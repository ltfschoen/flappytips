const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { BlueprintPromise } = require('@polkadot/api-contract');
const metadata = require('./ink/contracts/leaderboard/leaderboard.json');

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const codeHash = ""; // code hash where Oracle and Leaderboard contract deployed

async function fetchOracleAndLeaderboardContracts () {
    const endpoint = 'wss://rpc.astar.network';
    const provider = new WsProvider(endpoint);
    const keyring = new Keyring({ type: 'sr25519' });
    let api;
    api = await ApiPromise.create({ provider });
    const blueprint = new BlueprintPromise(api, metadata, codeHash);

    // maximum gas to be consumed for the instantiation. if limit is too small the instantiation will fail.
    const gasLimit = 100000n * 1000000n;
    // a limit to how much Balance to be used to pay for the storage created by the instantiation
    // if null is passed, unlimited balance can be used
    const storageDepositLimit = null;
    // used to derive contract address, 
    // use null to prevent duplicate contracts
    const salt = new Uint8Array();

    const tx = blueprint.tx.default({ gasLimit, storageDepositLimit, salt });

    let address;

    const unsub = await tx.signAndSend(ALICE, ({ contract, status }) => {
        if (status.isInBlock || status.isFinalized) {
            address = contract.address.toString();
            unsub();
        }
    });

    return address;
}

module.exports = {
    fetchOracleAndLeaderboardContracts: fetchOracleAndLeaderboardContracts().catch(console.error).finally(() => process.exit();
};
