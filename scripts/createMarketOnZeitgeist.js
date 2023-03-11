require('dotenv').config()
const { spawn } = require('child_process');
const { waitUntil } = require('./utils/waitUntil');
const { REACT_APP_ZEITGEIST_SDK_NETWORK } = process.env;

(async () => {
    // https://docs.zeitgeist.pm/docs/build/sdk/v2/getting-started#fulldefault
    // must import @zeitgeistpm dependencies using `import`, not `require`
    const { batterystation, create, createStorage, mainnet } = await import("@zeitgeistpm/sdk");
    const { IPFS } = await import("@zeitgeistpm/web3.storage");

    if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'testnet') {
        sdk = await create(batterystation());
    } else if (REACT_APP_ZEITGEIST_SDK_NETWORK === 'testnet') {
        sdk = await create(mainnet());
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

    } else {
        console.error('Unsupported Zeitgeist network');
        return;
    }
})().catch(console.error).finally(() => process.exit());
