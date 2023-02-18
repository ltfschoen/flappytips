const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { CodePromise, ContractPromise } = require('@polkadot/api-contract');
let SDK, { util } = require("@zeitgeistpm/sdk");
const metadata = require('./ink/contracts/leaderboard/leaderboard.json');

// Alice will deploy oracle and leaderboard contract on behalf of players
// using treasury funds
const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

// TODO - use Swanky CLI instead
async function submitOracleOutcomeToZeitgeist (address, winnerAccountId, winnerBlocksCleared) {
    const endpoint = 'wss://zeitgeist-rpc.dwellir.com';
    const provider = new WsProvider(endpoint);
    const keyring = new Keyring({ type: 'sr25519' });
    let api;
    api = await ApiPromise.create({ provider });

    // The address is the actual on-chain address as ss58 or AccountId object.
    const contract = new ContractPromise(api, metadata, address);

    // maximum gas to be consumed for the call. if limit is too small the call will fail.
    const gasLimit = 3000n * 1000000n;
    // a limit to how much Balance to be used to pay for the storage created by the contract call
    // if null is passed, unlimited balance can be used
    const storageDepositLimit = null
    // balance to transfer to the contract account. use only with payable messages, will fail otherwise. 
    // formerly know as "endowment"
    const value = api.registry.createType('Balance', 1000)

    const { gasRequired, storageDeposit, result, output } = await contract.query.get(
        ALICE.get_score_of_account(winnerAccountId),
        {
            gasLimit,
            storageDepositLimit,
        },
    );

    // Oracle sends score to Zeitgeist
    // https://github.com/Whisker17/sdk-demo/blob/main/src/market/reportOutcome.ts

    const ZTGNET = "wss://bsr.zeitgeist.pm";
    const sdk = await SDK.initialize(ZTGNET);
    // TODO - automate this
    const marketId = 8; // specify the market that they were competing in

    // map tickers to account ids
    const outcomes = {
        "d.....1": 1, // PLY1 ticker
        "d.....2": 2, // PLY2 ticker
        "d.....3": 3, // PLY3 ticker
    }

    let outcomeForTickerOfWinner;
    for (const [account, value] of Object.entries(outcomes)) {
        if (account === winnerAccountId) {
            outcomeForTickerOfWinner = outcomes[account];
        }
    }
  
    // Generate signer based on seed
    const seed = ALICE;
    const signer = util.signerFromSeed(seed);
    console.log("Sending transaction from", signer.address);
  
    const market = await sdk.models.fetchMarketData(Number(marketId));
  
    const outcomeReport = market.marketType.isCategorical
      ? { categorical: Number(outcomeForTickerOfWinner) }
      : { scalar: Number(outcomeForTickerOfWinner) };
    const res = await market.reportOutcome(signer, outcomeReport, true);
  
    console.log(res);
}

submitOracleOutcomeToZeitgeist()
    .catch(console.error)
    .finally(() => process.exit());
