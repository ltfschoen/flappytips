// https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/production.ts
const ENDPOINTS = {
  'Kusama': {
    url: 'wss://kusama-rpc.polkadot.io',
    isPolk: true
  },
  'Polkadot-CC1': {
    url: 'wss://rpc.polkadot.io',
    isPolk: true
  },
  'Edgeware Mainnet': {
    url: 'wss://mainnet4.edgewa.re',
    isPolk: true
  },
  'Sia Mainnet': {
    url: 'https://siastats.info',
    isPolk: false
  },
  'DataHighway Harbour Testnet': {
    url: 'wss://testnet-harbour.datahighway.com',
    isPolk: true
  },
  // Note: Westend not supported as it does not use Treasury, which is required for using Tips
  'Westend Testnet': {
    url: 'wss://westend-rpc.polkadot.io',
    isPolk: true
  },
  // Note: Kulupu not supported as it returns error
  // `Unhandled Rejection (TypeError): Cannot read property 'validators' of undefined`
  // 'Kulupu Mainnet': 'wss://rpc.kulupu.network/ws',
}

const COLOURS = {
  pink: '#FF0863',
  grey: '#EE4499'
};

export {
  COLOURS,
  ENDPOINTS
}
