const ENDPOINTS = {
  kusamaW3F: 'wss://cc3-5.kusama.network/',
  polkadotW3F: 'wss://cc1-1.polkadot.network',
  dataHighwayHarbourTest: 'wss://testnet-harbour.datahighway.com',
  // Note: Westend not supported as it does not use Treasury, which is required for using Tips
  // westendW3F: 'wss://westend-rpc.polkadot.io',
  // Note: Kulupu not supported as it returns error
  // `Unhandled Rejection (TypeError): Cannot read property 'validators' of undefined`
  // kulupuMainnet: 'wss://rpc.kulupu.network/ws',
  // Note: Edgeware not supported as it returns error
  // `Unhandled Rejection (Error): createType(Vec<EventRecord>):: Struct: failed on 'data':: Unable to create Enum via index 20, in Normal, Operational, Mandatory`
  // edgewareMainnet: 'wss://mainnet1.edgewa.re'
}

const COLOURS = {
  pink: '#FF0863'
};

export {
  COLOURS,
  ENDPOINTS
}
