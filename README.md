## FlappyTips 2

**Objective:** Fly the DOT character between more gaps (of obstacles blocks) than all other opponents to win the game of that starting block on the Zeitgeist chain.

**Economics** Players may choose to play without using any funds. However, incentivises exist that require tokens, where users may create a Substrate-based account and deposit sufficient tokens (DOT tokens) to cover the transaction costs required to share their game results. If the user plays the game and shares their results, they may be eligible for a tip from the treasury.

**Build Log**
* Add restricted gameplay endpoint of only Zeitgeist to use their block time for ease of integration with the Zeitgeist prediction markets. Future releases may restore choice of chain
* Adds support for multiplayer instead of just single player games. If no other opponents connect in time. Once the user selects a Polkadot.js Extension account to play with and clicks "Play" it schedules a game at a future block. Other players may join if they also click "Play" a sufficient amount of blocks before the game starts, otherwise they are scheduled to play at a future block, where other players can join too.
* Added support to show ghost icon of other players during gameplay
* Adds support to tracks the start block and end block of the game after all players have hit an obstacle
* Adds gameplay success factor where players may only Win in multiplayer. Single player games or draws are shown as losing
* Updated all dependencies including Polkadot.js API, Polkadot Extension, Express API, P5 Gaming API, React
* Updated from Node.js 10 to latest Node.js 19 and updated Yarn 1 to Yarn 3
* Added Websockets support for multiplayer
* Add IP address recording only incase necessary to block malicious users in production.
* Retains FlappyTips 1 UI where player character is a dot icon
* Retains FlappyTips 1 gameplay movement via pressing space bar (Desktop) or tapping screen (Mobile) to fly character between gaps of approaching obstacles. Each obstacle is labelled to represent a block of the connected blockchain (Zeitgeist)
* Retains FlappyTips 1 obstacle speed increase after each obstacle bypassed
* Retains FlappyTips 1 responsive support for mobile devices or desktop
* Retains FlappyTips 1 legacy code where users may share their results on Twitter
* Retains FlappyTips 1 legacy code (only Desktop support) to request a tip from the Polkadot treasury
* Retains FlappyTips 1 support for deploying to Heroku for production
* Temporarily removes FlappTips 1 support for requesting a tip on Mobile devices until QR code scanning is supported to avoid having tn enter private key
* Removes FlappyTips 1 Namebase API and Handshake API domain deployment since Sia Skynet Skylink deprecated.

### Play

#### Setup
* Create an account at "Add Account" from Polkadot.js Apps at https://polkadot.js.org/apps/#/accounts
* Install the latest [Polkadot.js Browser Extension](https://github.com/polkadot-js/extension) and import that account
* Go to https://flappytips.herokuapp.com
* Authorize in the popup from Polkadot.js Browser Extension for FlappyTips 2 dapp to access the the addresses of your accounts by clicking "Yes, allow this application access"
* Select an injected account from Polkadot.js Browser Extension to play a game with

#### Start Game
* Click the "Play" button after the "Loading..." screen disappears to automatically schedule to play a game at an upcoming block
* Watch the countdown to the scheduled starting block when gameplay starts  
* Press space bar multiple times (Desktop) to make your dot character fly and try to navigate and clear your way through gaps in the obstacles to score points.
* Touch the screen multiple times to fly the DOT (Mobile devices)
* Obstacles (blocks) appear each time a new block is authored on the connected chain (Zeitgeist). 
* After each block appears, the speed that it moves increases each time.
* After about 10 blocks the gap may becomes larger but it still becomes more difficult as the blocks move faster

#### Share Results
* After game ends optionally click the "Share" button to share your result or request a tip (Desktop only) 
* After winning a game you may wish to click the "Share & Request Tip?" button, along with an optional identifer (i.e. your Twitter handle). Share your result on Twitter for free. Alternatively deposit submit sufficient funds into the wallet to create an extrinsic to Polkadot chain (DOT tokens) that will report your awesomeness for clearing some blocks requesting a Tip, and should appear in the "Tip" section here https://polkadot.js.org/apps/#/treasury on a chain that supports `treasury.reportAwesome` (Polkadot).

### Develop Environment

Clone the repository, install Yarn 3.x and Node.js, and then run the following in terminal:
```
nvm use 19.6.0
npm i -g yarn
corepack enable && corepack prepare yarn@stable --activate && yarn set version 3.4.1 \
yarn \
npm install -g nodemon &&
npm install -g concurrently &&
yarn add node-gyp
yarn run dev
```
 
* Follow the "Setup" in the "Play" section of this README file, but instead go to http://localhost:4000
* Click the polkadot-js/extension browser icon and allow it to interact with FlappyTips 2
* Press space bar to make your dot character fly and try to navigate through the obstacles.
* Access the API endpoints at http://localhost:5000/api 

### Maintenance

```
npm outdated
npm update --save
rm -rf node_modules
npm install
```

### Deploy to Heroku

Note: It is necessary to use either Eco or Basic plan on Heroku. [Eco plan dyno that receives no web traffic in a 30-minute period sleeps and becomes active again upon receiving traffic](https://devcenter.heroku.com/articles/eco-dyno-hours#dyno-sleeping). See https://www.heroku.com/pricing

* Install Heroku CLI for macOS
```
brew tap heroku/brew && brew install heroku
```

* Start
```
heroku login
heroku apps:create flappytips
heroku git:remote -a flappytips
git push -f heroku yourbranch:master
git push -f heroku master
heroku local web
heroku ps:scale web=0:Eco
heroku ps
heroku open
heroku logs --tail
heroku restart
```

* SSH
```
heroku ps:exec
```

* Stop
```
heroku ps:stop web
```

* Scale up dynos. If you get an error like `code=H14 desc="No web processes running"` in Heroku logs then scale your dynos
```
heroku ps:scale web=1:Basic
heroku ps:scale web=2:standard-2x
heroku ps:scale web=1:performance-m
```

* Scale down dynos
```
heroku ps:scale web=0:Eco
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

<!-- ## Smart Contracts

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
``` -->

<!-- ### Deploy Smart Contract to Edgeware

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
  * Deploy Contract -->

### Documentation for ink!

https://paritytech.github.io/ink/

### References

* https://medium.com/geekculture/multiplayer-interaction-with-p5js-f04909e13b87
* Swenky CLI for ink! https://www.youtube.com/watch?v=rx9B6vQLmS8