const ENDPOINTS = {
  'Kusama': 'wss://cc3-5.kusama.network/',
  'Polkadot-CC1': 'wss://cc1-1.polkadot.network',
  // Note: Edgeware not supported as it returns error
  // `Unhandled Rejection (Error): createType(Vec<EventRecord>):: Struct: failed on 'data':: Unable to create Enum via index 20, in Normal, Operational, Mandatory`
  'Edgeware Mainnet': 'wss://mainnet1.edgewa.re',
  'DataHighway Harbour Testnet': 'wss://testnet-harbour.datahighway.com',
  // Note: Westend not supported as it does not use Treasury, which is required for using Tips
  'Westend Testnet': 'wss://westend-rpc.polkadot.io',
  // Note: Kulupu not supported as it returns error
  // `Unhandled Rejection (TypeError): Cannot read property 'validators' of undefined`
  // 'Kulupu Mainnet': 'wss://rpc.kulupu.network/ws',
}

const COLOURS = {
  pink: '#FF0863'
};

export {
  COLOURS,
  ENDPOINTS
}
