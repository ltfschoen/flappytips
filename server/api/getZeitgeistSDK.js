require('dotenv').config()
const BN = require('bn.js');
const { spawn } = require('child_process');
const { waitUntil } = require('_utils/waitUntil'); // babel alias
const { REACT_APP_ZEITGEIST_SDK_NETWORK } = process.env;

let sdk;
(async ()  => {
    // https://docs.zeitgeist.pm/docs/build/sdk/v2/getting-started#fulldefault
    // must import @zeitgeistpm dependencies using `import`, not `require`
    const { batterystation, create, createStorage, mainnet } = await import("@zeitgeistpm/sdk");
    const { IPFS } = await import("@zeitgeistpm/web3.storage");

    if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'testnet') {
        sdk = await create(batterystation());
        console.log('sdk: ', sdk);

        const { data: { free } } = await sdk.api.query.system.account(
            "dE1qN74MfnkZdc2PDiwfeUW27D3JsRwP8GcgirtmAwDyCSMfp",
        );
        const [chain] = await Promise.all([
            sdk.api.registry.chainDecimals,
        ]);
        
        console.log('current balance: ', new BN(free, 10).div(new BN(chain[0].toString(), 10).pow(new BN(10, 10))));
        console.log(free.toString(10));


    } else if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'mainnet') {
        sdk = await create(mainnet());
        console.log('sdk: ', sdk);
    // https://docs.zeitgeist.pm/docs/build/sdk/v2/getting-started#local-dev-node
    } else if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'local') {

        console.log('spawning Zeitgeist local Docker container');
        const child = spawn('bash', [__dirname + '/zeitgeist_docker_local.sh'])
        let localNodeStarted = false;

        child.on('exit', code => {
            console.log("Child exited", code);
        });

        child.stdout.on('data', data => {
            console.log(`stdout:\n${data}`);
            if (data.includes('docker.io/ipfs/go-ipfs:latest')) {
                console.log('Finished pulling docker.io/ipfs/go-ipfs:latest');
            } else if (data.includes('docker.io/zeitgeistpm/zeitgeist-node:latest')) {
                console.log('Finished pulling docker.io/zeitgeistpm/zeitgeist-node:latest');
            }
            // Note: Only use this method if not running docker as a daemon with `-d` option in shell script
            // if (data.includes('Running JSON-RPC WS server')) {
            //     console.log('Running local Zeitgeist Node using db /tmp/data/chains/dev/db/full');
            //     localNodeStarted = true;
            // }
            if (data.includes('Detected Zeitgeist node running JSON-RPC WS')) {
                console.log('Running local Zeitgeist Node using db /tmp/data/chains/dev/db/full');
                localNodeStarted = true;
            }
        });
        child.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });

        console.log('Creating connection to Zeitgeist Node where WS port now available');

        await waitUntil(() => localNodeStarted);
        console.log("Local Zeitgeist Node started");

        sdk = await create({
            connectionRetries: 20,
            provider: "ws://localhost:9944",
            storage: createStorage(IPFS.storage({ node: { url: "localhost:5001" } })),
        });
        console.log('sdk: ', sdk);

        return sdk;
    } else {
        console.error('Unsupported Zeitgeist network');
        return;
    }
});

export default sdk;

// FIXME - below gives lodash-es error

// require('dotenv').config()
// import BN from 'bn.js';
// import { spawn } from 'child_process';
// import { waitUntil } from '../utils/waitUntil.js';
// import { batterystation, create, createStorage, mainnet } from "@zeitgeistpm/sdk";
// import { IPFS } from "@zeitgeistpm/web3.storage";

// const { REACT_APP_ZEITGEIST_SDK_NETWORK } = process.env;

// async function getZeitgeistSDK() {
//     let sdk;

//     if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'testnet') {
//         sdk = await create(batterystation());
//         console.log('sdk: ', sdk);

//         const { data: { free } } = await sdk.api.query.system.account(
//             "dE1qN74MfnkZdc2PDiwfeUW27D3JsRwP8GcgirtmAwDyCSMfp",
//         );
//         const [chain] = await Promise.all([
//             sdk.api.registry.chainDecimals,
//         ]);
        
//         console.log('current balance: ', new BN(free, 10).div(new BN(chain[0].toString(), 10).pow(new BN(10, 10))));
//         console.log(free.toString(10));
//     } else if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'mainnet') {
//         sdk = await create(mainnet());
//         console.log('sdk: ', sdk);
//     // https://docs.zeitgeist.pm/docs/build/sdk/v2/getting-started#local-dev-node
//     } else if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'local') {
//         console.log('spawning Zeitgeist local Docker container');
//         const child = spawn('bash', [__dirname + '/zeitgeist_docker_local.sh'])
//         let localNodeStarted = false;

//         child.on('exit', code => {
//             console.log("Child exited", code);
//         });

//         child.stdout.on('data', data => {
//             console.log(`stdout:\n${data}`);
//             if (data.includes('docker.io/ipfs/go-ipfs:latest')) {
//                 console.log('Finished pulling docker.io/ipfs/go-ipfs:latest');
//             } else if (data.includes('docker.io/zeitgeistpm/zeitgeist-node:latest')) {
//                 console.log('Finished pulling docker.io/zeitgeistpm/zeitgeist-node:latest');
//             }
//             // Note: Only use this method if not running docker as a daemon with `-d` option in shell script
//             // if (data.includes('Running JSON-RPC WS server')) {
//             //     console.log('Running local Zeitgeist Node using db /tmp/data/chains/dev/db/full');
//             //     localNodeStarted = true;
//             // }
//             if (data.includes('Detected Zeitgeist node running JSON-RPC WS')) {
//                 console.log('Running local Zeitgeist Node using db /tmp/data/chains/dev/db/full');
//                 localNodeStarted = true;
//             }
//         });
//         child.stderr.on('data', data => {
//             console.error(`stderr: ${data}`);
//         });

//         console.log('Creating connection to Zeitgeist Node where WS port now available');

//         await waitUntil(() => localNodeStarted);
//         console.log("Local Zeitgeist Node started");

//         sdk = await create({
//             connectionRetries: 20,
//             provider: "ws://localhost:9944",
//             storage: createStorage(IPFS.storage({ node: { url: "localhost:5001" } })),
//         });
//         console.log('sdk: ', sdk);

//     } else {
//         console.error('Unsupported Zeitgeist network');
//         return;
//     }

//     return sdk;
// }

// export default getZeitgeistSDK;
