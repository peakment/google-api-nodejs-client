// Copyright 2014 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// eslint-disable-next-line node/no-unsupported-features/node-builtins
import {promises as fs} from 'fs';
import {GaxiosOptions, Headers} from 'gaxios';
import {DefaultTransporter} from 'google-auth-library';
import {
  Schema,
  SchemaItem,
  SchemaMethod,
  SchemaParameters,
  Schemas,
  SchemaMethods,
  SchemaResources,
  SchemaItems,
} from 'googleapis-common';
import * as mkdirp from 'mkdirp';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import {URL} from 'url';
import * as util from 'util';
import Q from 'p-queue';

const srcPath = path.join(__dirname, '../../../src');
const TEMPLATES_DIR = path.join(srcPath, 'generator/templates');
const API_TEMPLATE = path.join(TEMPLATES_DIR, 'api-endpoint.njk');
const RESERVED_PARAMS = ['resource', 'media', 'auth'];

export interface GeneratorOptions {
  debug?: boolean;
  includePrivate?: boolean;
}

function getObjectType(item: SchemaItem): string {
  if (item.additionalProperties) {
    const valueType = getType(item.additionalProperties);
    return `{ [key: string]: ${valueType}; }`;
  } else if (item.properties) {
    const fields = item.properties;
    const objectType = Object.keys(fields)
      .map(field => `${cleanPropertyName(field)}?: ${getType(fields[field])};`)
      .join(' ');
    return `{ ${objectType} }`;
  } else {
    return 'any';
  }
}

function isSimpleType(type: string): boolean {
  if (type.indexOf('{') > -1) {
    return false;
  }
  return true;
}

/**
 * Attempt to turn a regex into a more human readable form.
 * @param regex pattern for the given parameter
 */
function unRegex(regex: string): string {
  // example: ^projects/[^/]+$' ==> projects/my-project
  let pattern = regex;
  if (typeof regex !== 'string') {
    return '';
  }
  // remove leading ^
  if (pattern.startsWith('^')) {
    pattern = pattern.slice(1);
  }
  // remove trailing $
  if (pattern.endsWith('$')) {
    pattern = pattern.slice(0, pattern.length - 1);
  }
  // replace projects placeholders
  pattern = pattern.replace(/\^?(\w+)s\/\[\^\/\]\+\$?/g, '$1s/my-$1');
  return pattern;
}

function cleanPropertyName(prop: string) {
  const match = prop.match(/[-@.]/g);
  return match ? `'${prop}'` : prop;
}

function camelify(name: string) {
  // If the name has a `-`, remove it and camelize.
  // Ex: `well-known` => `wellKnown`
  if (name.includes('-')) {
    const parts = name.split('-').filter(x => !!x);
    name = parts
      .map((part, i) => {
        if (i === 0) {
          return part;
        }
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
  }
  return name;
}

function getType(item: SchemaItem): string {
  if (item.$ref) {
    return `Schema$${item.$ref}`;
  }
  switch (item.type) {
    case 'integer':
      return 'number';
    case 'object':
      return getObjectType(item);
    case 'array': {
      const innerType = getType(item.items!);
      if (isSimpleType(innerType)) {
        return `${innerType}[]`;
      } else {
        return `Array<${innerType}>`;
      }
    }
    default:
      return item.type!;
  }
}

export class Generator {
  private transporter = new DefaultTransporter();
  private requestQueue = new Q({concurrency: 50});
  private env: nunjucks.Environment;

  /**
   * A multi-line string is turned into one line.
   * @param str String to process
   * @return Single line string processed
   */
  private oneLine(str?: string) {
    return str ? str.replace(/\n/g, ' ') : '';
  }

  /**
   * Clean a string of comment tags.
   * @param str String to process
   * @return Single line string processed
   */
  private cleanComments(str?: string) {
    // Convert /* into /x and */ into x/
    return str ? str.replace(/\*\//g, 'x/').replace(/\/\*/g, '/x') : '';
  }

  private getPathParams(params: SchemaParameters) {
    const pathParams = new Array<string>();
    if (typeof params !== 'object') {
      params = {};
    }
    Object.keys(params).forEach(key => {
      if (params[key].location === 'path') {
        pathParams.push(key);
      }
    });
    return pathParams;
  }

  private getSafeParamName(param: string) {
    if (RESERVED_PARAMS.indexOf(param) !== -1) {
      return param + '_';
    }
    return param;
  }

  private hasResourceParam(method: SchemaMethod) {
    return method.parameters && method.parameters['resource'];
  }

  private options: GeneratorOptions;

  private state = new Map<string, string[]>();

  /**
   * Generator for generating API endpoints
   * @param options Options for generation
   */
  constructor(options: GeneratorOptions = {}) {
    this.options = options;
    this.env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(TEMPLATES_DIR),
      {trimBlocks: true}
    );
    this.env.addFilter('buildurl', buildurl);
    this.env.addFilter('oneLine', this.oneLine);
    this.env.addFilter('getType', getType);
    this.env.addFilter('cleanPropertyName', cleanPropertyName);
    this.env.addFilter('unRegex', unRegex);
    this.env.addFilter('cleanComments', this.cleanComments);
    this.env.addFilter('camelify', camelify);
    this.env.addFilter('getPathParams', this.getPathParams);
    this.env.addFilter('getSafeParamName', this.getSafeParamName);
    this.env.addFilter('hasResourceParam', this.hasResourceParam);
    this.env.addFilter('cleanPaths', str => {
      return str
        ? str
            .replace(/\/\*\//gi, '/x/')
            .replace(/\/\*`/gi, '/x')
            .replace(/\*\//gi, 'x/')
            .replace(/\\n/gi, 'x/')
        : '';
    });
  }

  /**
   * Add a requests to the rate limited queue.
   * @param opts Options to pass to the default transporter
   */
  private request<T>(opts: GaxiosOptions) {
    return this.requestQueue.add(() => {
      return this.transporter.request<T>(opts);
    });
  }

  /**
   * Log output of generator. Works just like console.log.
   */
  private log(...args: string[]) {
    if (this.options && this.options.debug) {
      console.log(...args);
    }
  }

  /**
   * Write to the state log, which is used for debugging.
   * @param id DiscoveryRestUrl of the endpoint to log
   * @param message
   */
  private logResult(id: string, message: string) {
    if (!this.state.has(id)) {
      this.state.set(id, new Array<string>());
    }
    this.state.get(id)!.push(message);
  }

  /**
   * Generate all APIs and write to files.
   */
  async generateAllAPIs(discoveryUrl: string) {
    const headers: Headers = this.options.includePrivate
      ? {}
      : {'X-User-Ip': '0.0.0.0'};
    const ignore = require('../../../ignore.json').ignore as string[];
    const res = await this.request<Schemas>({url: discoveryUrl, headers});
    const apis = res.data.items;
    const queue = new Q({concurrency: 10});
    console.log(`Generating ${apis.length} APIs...`);
    queue.addAll(
      apis.map(api => {
        return async () => {
          // look at ignore.json to find a list of APIs to ignore
          if (ignore.includes(api.id)) {
            this.log(`Skipping API ${api.id}`);
            return;
          }
          this.log(`Generating API for ${api.id}...`);
          this.logResult(
            api.discoveryRestUrl,
            'Attempting first generateAPI call...'
          );
          try {
            await this.generateAPI(api.discoveryRestUrl);
            this.logResult(api.discoveryRestUrl, 'GenerateAPI call success!');
          } catch (e) {
            this.logResult(
              api.discoveryRestUrl,
              `GenerateAPI call failed with error: ${e}, moving on.`
            );
            console.error(`Failed to generate API: ${api.id}`);
            console.error(e);
            console.log(
              api.id +
                '\n-----------\n' +
                util.inspect(this.state.get(api.discoveryRestUrl), {
                  maxArrayLength: null,
                }) +
                '\n'
            );
          }
        };
      })
    );
    try {
      await queue.onIdle();
      await this.generateIndex(apis);
    } catch (e) {
      console.error(e);
      console.log(util.inspect(this.state, {maxArrayLength: null}));
    }
  }

  async generateIndex(metadata: Schema[]) {
    const apis: {[index: string]: {[index: string]: string}} = {};
    const apisPath = path.join(srcPath, 'apis');
    const indexPath = path.join(apisPath, 'index.ts');
    const rootIndexPath = path.join(apisPath, '../', 'index.ts');

    // Dynamically discover available APIs
    const files: string[] = await fs.readdir(apisPath);
    for (const file of files) {
      const filePath = path.join(apisPath, file);
      if (!(await fs.stat(filePath)).isDirectory()) {
        continue;
      }
      apis[file] = {};
      const files: string[] = await fs.readdir(path.join(apisPath, file));
      for (const version of files) {
        const parts = path.parse(version);
        if (!version.endsWith('.d.ts') && parts.ext === '.ts') {
          apis[file][version] = parts.name;
          const desc = metadata.filter(x => x.name === file)[0].description;
          // generate the index.ts
          const apiIdxPath = path.join(apisPath, file, 'index.ts');
          const result = this.env.render('api-index.njk', {
            name: file,
            api: apis[file],
          });
          await fs.writeFile(apiIdxPath, result);
          // generate the package.json
          const pkgPath = path.join(apisPath, file, 'package.json');
          const pkgResult = this.env.render('package.json.njk', {
            name: file,
            desc,
          });
          await fs.writeFile(pkgPath, pkgResult);
          // generate the README.md
          const rdPath = path.join(apisPath, file, 'README.md');
          const rdResult = this.env.render('README.md.njk', {name: file, desc});
          await fs.writeFile(rdPath, rdResult);
          // generate the tsconfig.json
          const tsPath = path.join(apisPath, file, 'tsconfig.json');
          const tsResult = this.env.render('tsconfig.json.njk');
          await fs.writeFile(tsPath, tsResult);
          // generate the webpack.config.js
          const wpPath = path.join(apisPath, file, 'webpack.config.js');
          const wpResult = this.env.render('webpack.config.js.njk', {
            name: file,
          });
          await fs.writeFile(wpPath, wpResult);
        }
      }
    }

    const result = this.env.render('index.njk', {apis});
    await fs.writeFile(indexPath, result, {encoding: 'utf8'});

    const res2 = this.env.render('root-index.njk', {apis});
    await fs.writeFile(rootIndexPath, res2, {encoding: 'utf8'});
  }

  /**
   * Generate API file given discovery URL
   * @param apiDiscoveryUri URL or filename of discovery doc for API
   */
  async generateAPI(apiDiscoveryUrl: string) {
    const parts = new URL(apiDiscoveryUrl);
    if (apiDiscoveryUrl && !parts.protocol) {
      this.log('Reading from file ' + apiDiscoveryUrl);
      const file = await fs.readFile(apiDiscoveryUrl, {
        encoding: 'utf-8',
      });
      await this.generate(apiDiscoveryUrl, JSON.parse(file));
    } else {
      this.logResult(apiDiscoveryUrl, 'Starting discovery doc request...');
      this.logResult(apiDiscoveryUrl, apiDiscoveryUrl);
      const res = await this.request<Schema>({url: apiDiscoveryUrl});
      await this.generate(apiDiscoveryUrl, res.data);
    }
  }

  private async generate(apiDiscoveryUrl: string, schema: Schema) {
    this.logResult(apiDiscoveryUrl, 'Discovery doc request complete.');
    const tasks = new Array<() => Promise<void>>();

    // e.g. apis/drive
    const apiPath = path.join(srcPath, 'apis', schema.name);
    // e.g. apis/drive/v1.ts
    const exportFilename = path.join(apiPath, schema.version + '.ts');

    this.logResult(apiDiscoveryUrl, 'Generating templates...');
    this.logResult(apiDiscoveryUrl, 'Step 1...');
    await Promise.all(tasks.map(t => t()));
    this.logResult(apiDiscoveryUrl, 'Step 2...');
    const contents = this.env.render(API_TEMPLATE, {api: schema});
    await mkdirp(path.dirname(exportFilename));
    this.logResult(apiDiscoveryUrl, 'Step 3...');
    await fs.writeFile(exportFilename, contents, {encoding: 'utf8'});
    this.logResult(apiDiscoveryUrl, 'Template generation complete.');

    // Generate samples
    const samplesPath = path.join(apiPath, 'samples', schema.version);
    await mkdirp(samplesPath);
    const methods = new Array<SchemaMethod>();
    getAllMethods(schema, methods);
    for (const method of methods) {
      const samplePath = path.join(samplesPath, `${method.id}.js`);
      let responseExample: undefined | {};
      if (method.response) {
        const item = schema.schemas[method.response.$ref!];
        responseExample = flattenSchema(item, schema.schemas);
      }
      let requestExample: {} | undefined;
      if (method.request) {
        const item = schema.schemas[method.request.$ref!];
        requestExample = flattenSchema(item, schema.schemas);
      }
      const sampleResult = this.env.render('sample.njk', {
        api: schema,
        method,
        responseExample,
        requestExample,
      });
      await fs.writeFile(samplePath, sampleResult);
    }
    return exportFilename;
  }
}

/**
 * Provide a flattened representation of what the structure for a
 * given request or response could look like.
 */
function flattenSchema(item: SchemaItem, schemas: SchemaItems) {
  // tslint:disable-next-line no-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  if (item.properties) {
    for (const [name, details] of Object.entries(item.properties)) {
      result[name] = getExamplePropertyValue(name, details, schemas);
    }
  }
  return result;
}

function getExamplePropertyValue(
  name: string,
  details: SchemaItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schemas: SchemaItems
): {} {
  switch (details.type) {
    case 'string':
      return `my_${name}`;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'integer':
      return 0;
    case 'array':
      return [];
    default:
      return {};
  }
}

interface MethodBag {
  methods?: SchemaMethods;
  resources?: SchemaResources;
}

/**
 * Iterate over items in the schema recursively, and return a flattened
 * list of all methods.
 * @param bag
 * @param methods
 */
function getAllMethods(bag: MethodBag, methods: SchemaMethod[]) {
  if (bag.methods) {
    for (const m of Object.keys(bag.methods)) {
      methods.push(bag.methods[m]);
    }
  }
  if (bag.resources) {
    for (const r of Object.keys(bag.resources)) {
      getAllMethods(bag.resources[r], methods);
    }
  }
  return methods;
}

/**
 * Build a string used to create a URL from the discovery doc provided URL.
 * replace double slashes with single slash (except in https://)
 * @private
 * @param  input URL to build from
 * @return Resulting built URL
 */
function buildurl(input?: string) {
  return input ? `'${input}'`.replace(/([^:]\/)\/+/g, '$1') : '';
}
