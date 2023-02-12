// https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/production.ts
const ENDPOINTS = {
  'Kusama': {
    url: 'wss://kusama-rpc.polkadot.io',
  },
  'Polkadot-CC1': {
    url: 'wss://rpc.polkadot.io',
  },
  'Zeitgeist Mainnet': {
    url: 'wss://zeitgeist.api.onfinality.io/public-ws',
  },
  // Note: Westend not supported as it does not use Treasury, which is required for using Tips
  'Westend Testnet': {
    url: 'wss://westend-rpc.polkadot.io',
  },
}

const COLOURS = {
  pink: '#FF0863',
  grey: '#EE4499'
};

export {
  COLOURS,
  ENDPOINTS
}
