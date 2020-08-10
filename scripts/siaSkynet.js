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
const { uploadFileToSkynet, uploadDirectoryToSkynet } = require('../server/helpers/uploadToSkynet');
const { BUILD_SKYNET_SUBDIRECTORY, HANDSHAKE_DOMAIN_NAME,
  IS_PROD, SIA_SKYLINK_PORTAL_HANDSHAKE_URL_PREFIX } = require('../constants');

const PATH_SOURCE_CODE = path.join(__dirname, '..', 'client', 'build');
const WOPTS = { encoding: 'utf8', flag: 'w' };
const PATH_SKYNET = path.join(__dirname, '..', 'client', 'build', BUILD_SKYNET_SUBDIRECTORY);
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
 * Skynet hash (Skylink) redirection to Handshake domain name
 */
async function uploadFile() {
  const filename = 'index.html';
  execute(`mkdir -p ${PATH_SKYNET}`);
  const url = `${SIA_SKYLINK_PORTAL_HANDSHAKE_URL_PREFIX}${HANDSHAKE_DOMAIN_NAME}`;
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Redirecting to Handshake domain name</title>
    <meta http-equiv="refresh" content="0; url=${url}" />
    <style>
      body { font-family: sans-serif; line-height: 1.5rem; padding: 2rem; text-align: center }
      p { margin: 0 }
    </style>
  </head>
  <body>
    <p>Redirecting to <a href="${url}">${url}</a></p>
  </body>
</html>`;
  console.log('Writing files for redirecting to Handshake domain from Skynet hash (Skylink)');
  writeFiles(filename, html);
  const { handshakePortalSkyLinkUrl, skylink } = await uploadFileToSkynet(filename);
  writeFiles('skylink-redirect.txt', skylink);
  execute(`mv ${PATH_SKYNET}/skylink-redirect.txt ${PATH_PROJECT_ROOT}`);
  return handshakePortalSkyLinkUrl
}

/**
 * Skynet hash (Skylink) containing website
 */
async function uploadWebsite() {
  const directory = PATH_SOURCE_CODE;
  execute(`./scripts/index_remove_public.sh`);
  const { handshakePortalSkyLinkUrl, skylink } = await uploadDirectoryToSkynet(directory);
  execute(`./scripts/index_restore_public.sh`);
  writeFiles('skylink-website.txt', skylink);
  execute(`mv ${PATH_SKYNET}/skylink-website.txt ${PATH_PROJECT_ROOT}`);
  return handshakePortalSkyLinkUrl
}

/**
 * Upload the EthQuad source code Skynet hash using Skynet SDK.
 */
async function main() {
  const siaSkylinkRedirect = await uploadFile();
  const siaSkylinkWebsite = await uploadWebsite();
}

main()
  .catch(console.error)
  .finally(() => process.exit());
