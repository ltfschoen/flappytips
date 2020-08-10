const IS_PROD = process.env.NODE_ENV === 'production';
const BUILD_SKYNET_SUBDIRECTORY = 'skynet';
const HANDSHAKE_DOMAIN_NAME = `${process.env.HNS_DOMAIN}/`;
const SIA_SKYLINK_PORTAL_HANDSHAKE_URL_PREFIX = 'https://siasky.net/hns/';

module.exports = {
  BUILD_SKYNET_SUBDIRECTORY,
  HANDSHAKE_DOMAIN_NAME,
  IS_PROD,
  SIA_SKYLINK_PORTAL_HANDSHAKE_URL_PREFIX
};
