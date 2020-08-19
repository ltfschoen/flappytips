// Copyright 2017-2020 @polkadot/apps authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
//
// Modifications by Luke Schoen
// Original source: https://github.com/polkadot-js/apps/blob/master/scripts/ipfsUpload.js

require('dotenv').config()
const fs = require('fs');
const path = require('path');
const { execute } = require('../helpers/execute');
const { uploadDirectoryToSkynet } = require('../helpers/uploadToSkynet');
const { BUILD_SKYNET_SUBDIRECTORY } = require('../constants');

const PATH_SOURCE_CODE = path.join(__dirname, '..', 'build');
const WOPTS = { encoding: 'utf8', flag: 'w' };
const PATH_SKYNET = path.join(__dirname, '..', 'build', BUILD_SKYNET_SUBDIRECTORY);
const PATH_PROJECT_ROOT = path.join(__dirname, '..');

function writeFiles(name, content) {
  [PATH_SOURCE_CODE].forEach((root) => {
    const filePath = `${root}/${BUILD_SKYNET_SUBDIRECTORY}/${name}`;
    console.log('Writing to filePath: ', filePath);
    fs.writeFileSync(filePath, content, WOPTS,
      function() { console.log(`Wrote ${filePath}`) })
  });
}

/**
 * Skynet hash (Skylink) containing website
 */
async function uploadWebsite() {
  execute(`mkdir -p ${PATH_SKYNET}`);
  const directory = PATH_SOURCE_CODE;
  const { handshakePortalSkyLinkUrl, skylink } = await uploadDirectoryToSkynet(directory);
  writeFiles('skylink-website.txt', skylink);
  execute(`mv ${PATH_SKYNET}/skylink-website.txt ${PATH_PROJECT_ROOT}`);
  return handshakePortalSkyLinkUrl
}

/**
 * Upload the EthQuad source code Skynet hash using Skynet SDK.
 */
async function main() {
  const siaSkylinkWebsite = await uploadWebsite();
}

main()
  .catch(console.error)
  .finally(() => process.exit());
