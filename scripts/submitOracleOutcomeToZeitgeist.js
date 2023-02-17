const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { CodePromise, ContractPromise } = require('@polkadot/api-contract');
const metadata = require('./ink/contracts/leaderboard/leaderboard.json');

// Alice will deploy oracle and leaderboard contract on behalf of players
// using treasury funds
const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

// TODO - use Swanky CLI instead
async function submitOracleOutcomeToZeitgeist (address, winnerAccountId) {
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
}

submitOracleOutcomeToZeitgeist();

