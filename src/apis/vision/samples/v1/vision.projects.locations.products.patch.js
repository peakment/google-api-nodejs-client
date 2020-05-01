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
 * vision.projects.locations.products.patch
 * Makes changes to a Product resource.
 * Only the `display_name`, `description`, and `labels` fields can be updated
 * right now.
 * 
 * If labels are updated, the change will not be reflected in queries until
 * the next index time.
 * 
 * Possible errors:
 * 
 * * Returns NOT_FOUND if the Product does not exist.
 * * Returns INVALID_ARGUMENT if display_name is present in update_mask but is
 *   missing from the request or longer than 4096 characters.
 * * Returns INVALID_ARGUMENT if description is present in update_mask but is
 *   longer than 4096 characters.
 * * Returns INVALID_ARGUMENT if product_category is present in update_mask.
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
  const res = await vision.projects.locations.products.patch({
             // The resource name of the product.
// 
// Format is:
// `projects/PROJECT_ID/locations/LOC_ID/products/PRODUCT_ID`.
// 
// This field is ignored when creating a product.    
    name: 'projects/my-project/locations/my-location/products/my-product',
         // The FieldMask that specifies which fields
// to update.
// If update_mask isn't specified, all mutable fields are to be updated.
// Valid mask paths include `product_labels`, `display_name`, and
// `description`.    
    updateMask: 'placeholder-value',
            
    // Request body metadata
    requestBody: {
      // request body parameters
      // {
  //   "name": "my_name",
  //   "displayName": "my_displayName",
  //   "description": "my_description",
  //   "productCategory": "my_productCategory",
  //   "productLabels": []
  // }
    },
        
  });
  console.log(res.data);

    // Example response
  // {
  //   "name": "my_name",
  //   "displayName": "my_displayName",
  //   "description": "my_description",
  //   "productCategory": "my_productCategory",
  //   "productLabels": []
  // }
  }

main().catch(e => {
  console.error(e);
  throw e;
});
