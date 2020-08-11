const ENDPOINTS = {
  'Kusama': {
    url: 'wss://cc3-5.kusama.network/',
    isPolk: true
  },
  'Polkadot-CC1': {
    url: 'wss://cc1-1.polkadot.network',
    isPolk: true
  },
  'Edgeware Mainnet': {
    url: 'wss://mainnet1.edgewa.re',
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
