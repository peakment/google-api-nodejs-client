// Copyright 2020 Google LLC
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

/*! THIS FILE IS AUTO-GENERATED */

/*
 * vision.operations.list
 * Lists operations that match the specified filter in the request. If the
 * server doesn't support this method, it returns `UNIMPLEMENTED`.
 * 
 * NOTE: the `name` binding allows API services to override the binding
 * to use different resource name schemes, such as `users/x/operations`. To
 * override the binding, API services can add a binding such as
 * `"/v1/{name=users/x}/operations"` to their service configuration.
 * For backwards compatibility, the default name includes the operations
 * collection id, however overriding users must ensure the name binding
 * is the parent resource, without the operations collection id.
 * Before running the sample, please make sure to run:
 *   $ npm install googleapis
 */

const {google} = require('googleapis');
const vision = google.vision('v1');

async function main() {
  // By default, this method will look for, in order:
  // 1. An environment variable set to `GOOGLE_APPLICATION_CREDENTIALS`
  //    pointing to a service account credential file.
  // 2. A GCE metadata server, present in Google Cloud products like
  //    Compute Engine, Kubernetes Engine, Cloud Run, etc.
  // 3. A local OAuth token written by the Cloud SDK, obtained by running
  //    `gcloud auth application-default login`. This is preferred for local
  //    development.
  const auth = new google.auth.GoogleAuth({
    // Scopes can be specified either as an array or as a single, space-delimited string.
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/cloud-vision',
          ],
  });

  // Acquire an auth client, and bind it to all future calls
  const authClient = await auth.getClient();
  google.options('auth', authClient);

  // Do the magic
  const res = await vision.operations.list({
             // The standard list filter.    
    filter: 'placeholder-value',
         // The name of the operation's parent resource.    
    name: 'operations',
         // The standard list page size.    
    pageSize: 'placeholder-value',
         // The standard list page token.    
    pageToken: 'placeholder-value',
                
  });
  console.log(res.data);

    // Example response
  // {
  //   "operations": [],
  //   "nextPageToken": "my_nextPageToken"
  // }
  }

main().catch(e => {
  console.error(e);
  throw e;
});
