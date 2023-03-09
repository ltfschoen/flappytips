require('dotenv').config()
// const { spawn } = require('child_process');
// https://docs.zeitgeist.pm/docs/build/sdk/v2/getting-started#fulldefault
// const { batterystation, create, createStorage, mainnet } = require("@zeitgeistpm/sdk");
require("@zeitgeistpm/sdk");
// const { IPFS } = require("@zeitgeistpm/web3.storage");

// async function createMarketOnZeitgeist () {
//     const { REACT_APP_ZEITGEIST_SDK_NETWORK } = process.env;
//     let sdk;
//     if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'testnet') {
//         sdk = await create(batterystation());
//     } else if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'testnet') {
//         sdk = await create(mainnet());
//     // https://docs.zeitgeist.pm/docs/build/sdk/v2/getting-started#local-dev-node
//     } else if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'local') {

//         console.log('spawning Zeitgeist local Docker container');
//         const child = spawn('bash', [__dirname + '/zeitgeist_docker_local.sh'])
        
//         child.on('exit', code => {
//             console.log("Child exited", code);
//         });

//         child.stdout.on('data', data => {
//             console.log(`stdout:\n${data}`);
//         });
            
//         child.stderr.on('data', data => {
//             console.error(`stderr: ${data}`);
//         });
//         //     if (error) {
//         //         console.error(`error: ${error.message}`);
//         //         return;
//         //     }

//         //     if (stderr) {
//         //         console.error(`stderr: ${stderr}`);
//         //         return;
//         //     }

//         //     console.log(`stdout:\n${stdout}`);
//         // });

//         console.log('creating connection to Zeitgeist local');

//         sdk = await create({
//             provider: "wss://localhost:9944",
//             storage: createStorage(IPFS.storage({ node: { url: "localhost:5001" } })),
//         });
//     } else {
//         console.error('Unsupported Zeitgeist network');
//         return;
//     }
//     // TODO
// }

// createMarketOnZeitgeist()
//     .catch(console.error)
//     .finally(() => process.exit());