#!/usr/bin/env bash
set -e

# reference: https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js

# open Docker only if is not running
if (! docker stats --no-stream ); then
    # on Mac OS use terminal command to launch Docker
    open /Applications/Docker.app
    # wait until Docker daemon is running and has completed initialisation
while (! docker stats --no-stream ); do
    # Docker takes a few seconds to initialize
    echo "Waiting for Docker to launch..."
    sleep 5
done
fi

echo "Docker launched. Starting Zeitgeist Docker containers..."

docker pull ipfs/go-ipfs:latest
docker pull zeitgeistpm/zeitgeist-node
docker run \
    -p 4001:4001 \
    -p 127.0.0.1:8080:8080 \
    -p 127.0.0.1:8081:8081 \
    -p 127.0.0.1:5001:5001 \
    ipfs/go-ipfs

docker run \
    -p 30333:30333 \
    -p 9933:9933 \
    -p 9944:9944 \
    zeitgeistpm/zeitgeist-node \
    --dev \
    --rpc-external \
    --ws-external \
    --rpc-cors=all \
    --pruning=archive

echo "Finished creating Zeitgeist Docker containers...
