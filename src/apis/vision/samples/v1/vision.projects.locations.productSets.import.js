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
 * vision.projects.locations.productSets.import
 * Asynchronous API that imports a list of reference images to specified
 * product sets based on a list of image information.
 * 
 * The google.longrunning.Operation API can be used to keep track of the
 * progress and results of the request.
 * `Operation.metadata` contains `BatchOperationMetadata`. (progress)
 * `Operation.response` contains `ImportProductSetsResponse`. (results)
 * 
 * The input source of this method is a csv file on Google Cloud Storage.
 * For the format of the csv file please see
 * ImportProductSetsGcsSource.csv_file_uri.
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
  const res = await vision.projects.locations.productSets.import({
             // Required. The project in which the ProductSets should be imported.
// 
// Format is `projects/PROJECT_ID/locations/LOC_ID`.    
    parent: 'projects/my-project/locations/my-location',
            
    // Request body metadata
    requestBody: {
      // request body parameters
      // {
  //   "inputConfig": {}
  // }
    },
        
  });
  console.log(res.data);

    // Example response
  // {
  //   "done": false,
  //   "response": {},
  //   "name": "my_name",
  //   "error": {},
  //   "metadata": {}
  // }
  }

main().catch(e => {
  console.error(e);
  throw e;
});
