require('dotenv').config()
const { NodeClient, WalletClient } = require('hs-client');
const { Network } = require('hsd');
const network = Network.get(process.env.HSD_NETWORK);

// network type derived from hsd object, client object stores API key
const clientOptions = {
  network: network.type,
  port: network.rpcPort,
  apiKey: process.env.HSD_API_KEY
}

const walletOptions = {
  network: network.type,
  port: network.walletPort,
  apiKey: process.env.HSD_API_KEY
}

const nodeClient = new NodeClient(clientOptions);
const walletClient = new WalletClient(walletOptions);
const wallet = walletClient.wallet('primary');

// Reference: https://www.w3resource.com/javascript-exercises/javascript-string-exercise-28.php
const hex_to_ascii = (str1) => {
  var hex  = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

(async () => {
  let result;

  const clientInfo = await nodeClient.getInfo();
  console.log('HSD_API_KEY: ', process.env.HSD_API_KEY);
  console.log('HSD_NETWORK: ', process.env.HSD_NETWORK);
  console.log('Client Info: ', clientInfo);

  // FIXME - why is this returning `[]` when I have a balance of HNS tokens?
  // Get Coins by Handshake Namebase.io Address
  const addressNamebase = process.env.HNS_WALLET_ADDRESS_NAMEBASE;
  console.log('Handshake Wallet Address (Namebase.io):', addressNamebase);
  const addressNamebaseCoins = await nodeClient.getCoinsByAddress(addressNamebase);
  console.log(addressNamebaseCoins);

  // Get Coins by Handshake Mining Address
  const addressMining = process.env.HNS_WALLET_ADDRESS_MINING;
  console.log('Handshake Wallet Address (Mining):', addressMining);
  const addressMiningCoins = await nodeClient.getCoinsByAddress(addressMining);
  console.log(addressMiningCoins);

  // Get Mining Info
  const miningInfo = await nodeClient.execute('getmininginfo', []);
  console.log('Mining Info: ', miningInfo);

  // Get Peer Info
  const peerInfo = await nodeClient.execute('getpeerinfo');
  console.log('Peer Info: ', peerInfo);

  // Get Blockchain Name DNS Info
  //
  // https://hsd-dev.org/api-docs/?javascript#getnameinfo
  // https://github.com/handshake-org/hsd/blob/master/lib/covenants/namestate.js#L671
  const domainName = 'epiphysitis';
  const nameInfo = await nodeClient.execute('getnameinfo', [ domainName ]);
  console.log('Name info: ', nameInfo);
  // Data e.g.
  // X_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/index.html ns1 <DOMAIN_NAME>,ç·À>
  //
  // The `X_XXXX.../index.html` value appears to be the Skylink of Sia Skynet,
  // and I thought you should be able to paste that value here to load the page that
  // https://siasky.net/hns/<DOMAIN_NAME>/ directs you to
  // e.g. https://siasky.net/hns/X_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/index.html
  // However, nothing loads using `X_XXXX.../index.html`.
  // So use `getnameresource` instead to get the Sia Skynet Skylink
  // 
  // Note: The 'data' corresponds to that shown if you go to
  // https://www.namebase.io/domain-manager/<DOMAIN_NAME> in the
  // Blockchain DNS Records. If you then click "Use advanced settings" it will
  // show the raw data hex string that is returned from the `getnameinfo` query
  console.log('data deserialized hex: ', hex_to_ascii(nameInfo.info.data));

  // Get Domain Records
  //
  // e.g.
  // resource: {
  //   records: [
  //     { type: 'TXT', txt: [Array] },
  //     { type: 'GLUE4', ns: 'ns1.<DOMAIN_NAME>.', address: <IP_ADDRESS> },
  //     { type: 'NS', ns: 'ns1.<DOMAIN_NAME>.' }
  //   ]
  // }
  //
  // The output of the `txt` value should match the TXT value that's shown when you
  // go to https://www.namebase.io/domain-manager/<DOMAIN_NAME> and view the
  // Blockchain DNS Records. Paste the output Sia Skynet Skylink here:
  // e.g. https://siasky.net/hns/Y_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY/index.html
  result = await nodeClient.execute('getnameresource', [ domainName ]);
  console.log('Name resource: ', JSON.stringify(result, null, 2));

  // Get Wallets
  result = await walletClient.getWallets();
  console.log(result);

  // Get Wallet Info
  result = await wallet.getInfo();
  console.log('Wallet Info: ', result);

  // Get Wallet's Coins
  //
  // https://hsd-dev.org/api-docs/?javascript#list-all-coins
  result = await wallet.getCoins();
  console.log(result);

  // Get Wallet Balance
  result = await wallet.getBalance(account);
  console.log(result);

  // TODO - https://hsd-dev.org/api-docs/?javascript#wallet-auctions

})().catch((err) => {
  console.error(err.stack);
});;
