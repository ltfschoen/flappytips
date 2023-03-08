// https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/production.ts
const ENDPOINTS = {
  'Kusama': {
    url: 'wss://kusama-rpc.polkadot.io',
  },
  'Polkadot-CC1': {
    url: 'wss://rpc.polkadot.io',
  },
  'Zeitgeist Mainnet': {
    // url: 'wss://zeitgeist.api.onfinality.io/public-ws',
    url: 'wss://zeitgeist-rpc.dwellir.com',
  },
  // Note: Westend not supported as it does not use Treasury, which is required for using Tips
  'Westend Testnet': {
    url: 'wss://westend-rpc.polkadot.io',
  },
}

const COLOURS = {
  pink: '#FF0863',
  orange: '#FFA500',
  purple: '#33338F',
  grey: '#EE4499',
  blue: '#4169e1'
};

export {
  COLOURS,
  ENDPOINTS,
}
