## FlappyTips

**Objective:** Fly the DOT character between the gaps as many blocks as possible. 

**Economics** Incentivises users to create an account on the chain and deposit sufficient funds to cover the transaction costs required to share their game results. If the user plays the game and shares their results, they may be eligible for a tip from the treasury.

**Features**:
* Choice of currently supported chains (i.e. Polkadot, Kusama).
* Player character is a DOT (similar to Flappy Bird)
* Polkadot.js Extension is integrated when playing on Desktop, otherwise user needs to enter their private key to share their result (until FlappyTips supports account QR code scanning)
* Responsive with support for mobile devices or desktop
* Press Spacebar multiple times to fly the DOT on desktop
* Touch the screen multiple times to fly the DOT on mobile devices
* Blocks appear each time a new block is authored on your chosen chain. The chain must support `treasury.reportAwesome`
* After each block appears, the speed that it moves increases each time.
* After about 10 blocks the gap may becomes larger but it still becomes more difficult as the blocks move faster
* If you click "Request Tip?" button after each game and enter your "Mnemonic Seed" that corresponds to the chain that you chose to connected to in the game, along with an optional identifer (i.e. your Twitter handle), it then will submit an extrinsic to the chain that will report your awesomeness for clearing some blocks as a Tip, and should appear in the "Tip" section here https://polkadot.js.org/apps/#/treasury. To obtain an account for that chain and an associated "Mnemonic Seed", go to https://polkadot.js.org/apps/#/accounts and create an account at "Add Account", and remember and use the "Mnemonic Seed".
* Deploy to a Handshake decentralized domain name with DNS settings configured to load a Sia Skynet Skylink where FlappyTips is deployed. e.g. https://siasky.net/hns/flappy

**Future**:
* Add support for adding accounts by scanning QR code on mobile devices
* Standardise the game configurations and prevent users from submitting a fake game result

### Play

* Go to https://flappytips.herokuapp.com or https://siasky.net/hns/flappy
* Press space bar to make your dot fly and try to navigate through the obstacles.

### Develop Environment

Clone the repository, install Yarn and Node.js, and then run the following in terminal:
```
npm install -g nodemon &&
yarn add node-gyp
yarn run dev
```

* Go to http://localhost:4000
* Press space bar to make your dot fly and try to navigate through the obstacles.
* Access the API endpoints at http://localhost:5000/api 
Additional planned functionality and deployment to production is dependent on whether help is obtained from Riot channels in response to technical support enquiries.

### Maintenance

```
npm outdated
npm update --save
rm -rf node_modules
npm install
```

### Interact with Handshake API

Install dependencies
```
yarn add node-gyp
yarn
```

Generate HSD API Key. Paste into .env as value for `HSD_API_KEY`. See https://hsd-dev.org/api-docs/#authentication
```
node -e "bcrypto=require('bcrypto'); console.log(bcrypto.random.randomBytes(32).toString('hex'))"
```

Create a Wallet. See https://hsd-dev.org/guides/wallet.html. Clone https://github.com/handshake-org/faucet-tool
```
yarn
./bin/faucet-tool --help
./bin/faucet-tool createaddress \
  -n "main" \
  -l "english" \
  -b 256 \
  --backup \
  --show-keys
```

Run Mining node. By default the Chain DB is store in ~/.hsd/main. See https://hsd-dev.org/guides/config.html, and https://github.com/handshake-org/hsd#mining

* Note: Always use `--wallet-wallet-auth` set `true` and to set a unique api-key so a wallet's token to be submitted with every request, even for local development or local wallets, otherwise other applications on your system could theoretically access your wallet through the HTTP server without any authentication barriers.

```
./node_modules/.bin/hsd --network=main \
  --prefix=~/.hsd \
  --config=~/.hsd/main/hsd.conf \
  --port 12038 \
  --http-host 127.0.0.1 \
  --http-port 12037 \
  --ssl false \
  --wallet-http-host=127.0.0.1 \
  --wallet-api-key='...' \
  --wallet-wallet-auth=true \
  --log-level=debug \
  --max-outbound=8 \
  --api-key '...' \
  --coinbase-address '...' \
  --node-api-key '...' \
  --node-ssl false
```

Run script. Choose network from either: main on port 12037 (default), testnet 13037, regtest 14037, or simnet15037
```
HSD_NETWORK=main \
  node ./scripts/handshakeDomain.js
```

Optional: Use HSD via CLI
```
./node_modules/.bin/hsd --help
```

View Handshake Transaction History: https://hnscan.com

### Deploy to Skylink (on Sia Skynet)

Deploy FlappyTips to a Skylink hash that is shown in the terminal output.
e.g. https://siasky.net/AAA_drG9QqdvXXkVxLJxhyFIGseAnkhEQXPGUAWWjfQYfw/

```
yarn deploy:sia-skynet
```

Update DNS settings of Handshake domain (e.g. https://siasky.net/hns/flappy) as follows (or manually update the link at https://www.namebase.io/domain-manager) so it loads the Skylink. Note: Where flappy/ is the Handshake domain name.

```
yarn configure:handshake
```

### Deploy to Heroku

* Start
```
heroku login
heroku apps:create flappytips
heroku git:remote -a flappytips
git push -f heroku master
heroku local web
heroku ps:scale web=1:free
heroku ps
heroku open
heroku logs --tail
heroku restart
```

* Stop
```
heroku ps:stop web
```

* Scale up dynos
```
heroku ps:scale web=2:standard-2x
```

* Scale down dynos
```
heroku ps:scale web=1:free
```

* Fees - https://devcenter.heroku.com/articles/usage-and-billing
* Scaling help - https://devcenter.heroku.com/articles/scaling

## Troubleshooting

* If you get an unknown type error, then it may be necessary to update polkadot-js/api dependency in package.json, since it is constantly evolving.

* To kill a frozen process
```
ps -ef | grep node
kill -9 <PROCESS_ID>
```

## Additional Notes

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
Credit to this repo that was used to replicate a Flappy Bird like game https://codepen.io/renzo/pen/GXWbEq

## Smart Contracts

### Create Leaderboard using Substrate ink! Smart Contract language

* Install Substrate, WASM, latest Substrate node client with built-in Contracts module, ink! CLI.
See https://substrate.dev/substrate-contracts-workshop/#/0/setup
```
curl https://getsubstrate.io -sSf | bash -s -- --fast
rustup target add wasm32-unknown-unknown --toolchain stable
rustup component add rust-src --toolchain nightly
cargo install node-cli --git https://github.com/paritytech/substrate.git --tag v2.0.0-rc4 --force
cargo install cargo-contract --vers 0.6.1 --force
```

* Generate boilerplate Flipper smart contract.
See https://substrate.dev/substrate-contracts-workshop/#/0/creating-an-ink-project
```
mkdir -p ink/contracts
cd ink/contracts
cargo contract new flipper
cd flipper
```

* Build smart contract to convert ink! project into Wasm binary for deployment to chain.
Access in ./target/<CONTRACT_NAME>.wasm
```
cargo +nightly build
```

* Test smart contract
```
cd ink/contracts/leaderboard
cargo +nightly test
```

* Generate smart contract metadata (ABI).
Access in ./target/<CONTRACT_NAME>.json
```
cargo +nightly contract generate-metadata
```

### Deploy Smart Contract to Edgeware

* Deploy smart contract to Substrate node. See https://substrate.dev/substrate-contracts-workshop/#/0/deploying-your-contract
  * Contract deployment is split into: 1. Deploying code on blockchain (only once); 2. Create smart contract instance; 3. Instantiate multiple times (without having to redeploy code and waste space on blockchain)
  * Go to https://polkadot.js.org/apps/#/settings.
  * Change remote node to Edgeware and "Save"
  * Go to https://polkadot.js.org/apps/#/contracts/code.
  * Click "Upload WASM" to open popup
  * Select a "deployment account" with account balance (e.g. Alice)
  * Select the generated flipper.wasm file in "compiled contract WASM" 
  * Select the generated flipper.json file in "contract ABI"
  * Click "Upload" and "Sign & Submit" (with sufficient gas to execute the contract call)
* Instantiate Contract. See https://substrate.dev/substrate-contracts-workshop/#/0/deploying-your-contract?id=creating-an-instance-of-your-contract
  * Go to https://polkadot.js.org/apps/#/contracts/code
  * Click "Deploy" for flipper.wasm
    * Give the contract account an endowment of 10 Units to pay storage rent
    * Set the maximum gas allowed to value 1,000,000
  * Note: Contract creation involves creation of a new Account.
  Give the contract account at least the existential deposit defined by the blockchain.
  Ensure contract balance is refilled with sufficient balance to pay the contract's rent (endowment)
  otherwise the contract becomes an invalid tombstone.
* Call smart contract using Polkadot.js Apps. See https://substrate.dev/substrate-contracts-workshop/#/0/calling-your-contract
  * Deploy Contract

### Documentation for ink!

https://paritytech.github.io/ink/