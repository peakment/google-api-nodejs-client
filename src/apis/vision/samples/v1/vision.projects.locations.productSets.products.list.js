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
 * vision.projects.locations.productSets.products.list
 * Lists the Products in a ProductSet, in an unspecified order. If the
 * ProductSet does not exist, the products field of the response will be
 * empty.
 * 
 * Possible errors:
 * 
 * * Returns INVALID_ARGUMENT if page_size is greater than 100 or less than 1.
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
  const res = await vision.projects.locations.productSets.products.list({
             // Required. The ProductSet resource for which to retrieve Products.
// 
// Format is:
// `projects/PROJECT_ID/locations/LOC_ID/productSets/PRODUCT_SET_ID`    
    name: 'projects/my-project/locations/my-location/productSets/my-productSet',
         // The maximum number of items to return. Default 10, maximum 100.    
    pageSize: 'placeholder-value',
         // The next_page_token returned from a previous List request, if any.    
    pageToken: 'placeholder-value',
                
  });
  console.log(res.data);

    // Example response
  // {
  //   "products": [],
  //   "nextPageToken": "my_nextPageToken"
  // }
  }

main().catch(e => {
  console.error(e);
  throw e;
});
