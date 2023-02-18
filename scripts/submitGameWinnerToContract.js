const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { ContractPromise } = require('@polkadot/api-contract');
const metadata = require('./ink/contracts/leaderboard/leaderboard.json');

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

async function submitGameWinnerToContract (address, winnerAccountId, winnerBlocksCleared) {
    const endpoint = 'wss://rpc.astar.network';
    const provider = new WsProvider(endpoint);
    const keyring = new Keyring({ type: 'sr25519' });
    let api;
    api = await ApiPromise.create({ provider });

    // The address is the actual on-chain address as ss58 or AccountId object.
    const contract = new ContractPromise(api, metadata, address);

    const value = 10000; // only for payable messages, call will fail otherwise
    const gasLimit = 3000n * 1000000n;
    const storageDepositLimit = null;

    // Set Oracle owner of contract to Zeitgeist address, or just Alice for dev purposes
    await contract.tx
        .set_owner({ storageDepositLimit, gasLimit }, ALICE)
        .signAndSend(ALICE, result => {
            if (result.status.isInBlock) {
            console.log('in a block');
            } else if (result.status.isFinalized) {
            console.log('finalized');
            }
        });

    // Send transaction with winner score and account for leaderboard and oracle
    await contract.tx
        .set_score_of_account({ storageDepositLimit, gasLimit }, winnerAccountId, winnerBlocksCleared)
        .signAndSend(ALICE, result => {
            if (result.status.isInBlock) {
            console.log('in a block');
            } else if (result.status.isFinalized) {
            console.log('finalized');
            }
        });
}

module.exports = {
    submitGameWinnerToContract: submitGameWinnerToContract().catch(console.error).finally(() => process.exit())
};