const fs = require('fs');
const path = require('path');
const skynet = require('@nebulous/skynet');
const internetAvailable = require('internet-available');
const { HANDSHAKE_DOMAIN_NAME } = require('../../constants');

const getSkylinkFromUrl = (url) => {
  return url.substring(url.lastIndexOf("/") + 1);
}

// Convert Sia Skylink URL sia://??? to Sia Skylink Portal URL https://siasky.net/???
// where ??? is 46 characters long and called a "Skylink"
const convertSiaUrlToSiaPortalUrl = (url) => {
  return url.replace("sia://", "https://siasky.net/");
}

// Convert Sia Skylink Portal URL https://siasky.net/??? to
// Sia Skylink Portal Handshake (Handshake) URL (human-readable) http://siasky.net/hns/<HANDSHAKE_DOMAIN_NAME>/ 
const convertSiaPortalUrlToHandshake = (portalUrl) => {
  const url = portalUrl.replace("https://siasky.net/", "https://siasky.net/hns/");
  const skylink = url.substring(url.lastIndexOf("/") + 1);
  const handshakeUrl = url.replace(skylink, HANDSHAKE_DOMAIN_NAME);

  return handshakeUrl;
}

/**
 * Upload Directory to Skynet
 *
 * https://nebulouslabs.github.io/skynet-docs/?javascript--node#uploading-a-directory
 */
const uploadDirectoryToSkynet = async (directory) => {
  internetAvailable().then(function(){
    console.log("Internet available");
  }).catch(function(){
      console.log("No internet");
  });
  console.log('Uploading directory to Skynet: ', directory);
  const skylinkUrl = await skynet.uploadDirectory(
    directory,
    {
      APIKey: process.env.SKYNET_API_KEY,
      customFilename: "FlappyTips-Website",
      customUserAgent: "Sia-Agent"
    }
  );
  console.log(`Upload directory successful, skylink URL: ${skylinkUrl}`);
  const skylink = getSkylinkFromUrl(skylinkUrl);
  const portalSkyLinkUrl = convertSiaUrlToSiaPortalUrl(skylinkUrl);
  console.log(`View folder at Sia Skylink Portal: ${portalSkyLinkUrl}`);
  console.log(`View website at Sia Skylink Portal: ${portalSkyLinkUrl}/index.html`);
  const handshakePortalSkyLinkUrl = convertSiaPortalUrlToHandshake(portalSkyLinkUrl);
  console.log('Please configure Blockchain DNS Records for Handshake');

  return {
    handshakePortalSkyLinkUrl,
    skylink
  };
}

module.exports = {
  uploadDirectoryToSkynet
}
