const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { CodePromise } = require('@polkadot/api-contract');
// FIXME - import contract built .wasm and metadata.json
const metadata = require('./ink/contracts/leaderboard/leaderboard.json');
const wasm = require('./ink/contracts/leaderboard/leaderboard.wasm');

// Alice will deploy oracle and leaderboard contract on behalf of players
// using treasury funds
const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

// TODO - use Swanky CLI instead
async function deployOracleAndLeaderboardContracts () {
    const endpoint = 'wss://rpc.astar.network';
    const provider = new WsProvider(endpoint);
    const keyring = new Keyring({ type: 'sr25519' });
    let api;
    api = await ApiPromise.create({ provider });

    // deploy contract
    const code = new CodePromise(api, metadata, wasm);

    // maximum gas to be consumed for the instantiation. if limit is too small the instantiation will fail.
    const gasLimit = 100000n * 1000000n
    // a limit to how much Balance to be used to pay for the storage created by the instantiation
    // if null is passed, unlimited balance can be used
    const storageDepositLimit = null
    // used to derive contract address, 
    // use null to prevent duplicate contracts
    const salt = new Uint8Array()
    // balance to transfer to the contract account, formerly know as "endowment". 
    // use only with payable constructors, will fail otherwise. 
    const value = api.registry.createType('Balance', 1000)
    const initValue = 1;

    const tx = code.tx.new({ gasLimit, storageDepositLimit }, initValue)

    let address;

    // TODO
    const unsub = await tx.signAndSend(ALICE, ({ contract, status }) => {
    if (status.isInBlock || status.isFinalized) {
        address = contract.address.toString();
        unsub();
    }
    });
}

deployOracleAndLeaderboardContracts();
