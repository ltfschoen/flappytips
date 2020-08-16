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

  // Get Name Info
  const domainName = 'epiphysitis';
  const nameInfo = await nodeClient.execute('getnameinfo', [ domainName ]);
  console.log(nameInfo);

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
