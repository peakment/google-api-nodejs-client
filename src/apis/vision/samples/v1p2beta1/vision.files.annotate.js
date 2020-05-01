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
 * vision.files.annotate
 * Service that performs image detection and annotation for a batch of files.
 * Now only "application/pdf", "image/tiff" and "image/gif" are supported.
 * 
 * This service will extract at most 5 (customers can specify which 5 in
 * AnnotateFileRequest.pages) frames (gif) or pages (pdf or tiff) from each
 * file provided and perform detection and annotation for each image
 * extracted.
 * Before running the sample, please make sure to run:
 *   $ npm install googleapis
 */

const {google} = require('googleapis');
const vision = google.vision('v1p2beta1');

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
  const res = await vision.files.annotate({
                
    // Request body metadata
    requestBody: {
      // request body parameters
      // {
  //   "requests": [],
  //   "parent": "my_parent"
  // }
    },
        
  });
  console.log(res.data);

    // Example response
  // {
  //   "responses": []
  // }
  }

main().catch(e => {
  console.error(e);
  throw e;
});
