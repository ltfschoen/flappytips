#!/usr/bin/env bash
set -e

# reference: https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js

# note: need to somehow increase the max buffer size in the container since it will want 2048 kiB https://github.com/quic-go/quic-go/wiki/UDP-Receive-Buffer-Size
# the logs output `failed to sufficiently increase receive buffer size (was: 208 kiB, wanted: 2048 kiB, got: 416 kiB). See https://github.com/lucas-clemente/quic-go/wiki/UDP-Receive-Buffer-Size for details.`
# sysctl -w kern.ipc.maxsockbuf=3014656

# note: ths shouldn't be run here but was used for debugging. it removes all existing docker containers
# docker rm -f $(docker ps -a -q)

# kill ports that may already be allocated
# kill -9 $(lsof -t -i :8081)

# open Docker only if is not running
if (! docker stats --no-stream 2>/dev/null); then
    # on Linux
    if [[ $OSTYPE == 'darwin'* ]]; then
        systemctl enable docker
    else
        # on Mac OS use terminal command to launch Docker
        open /Applications/Docker.app
    fi
    echo "Waiting for Docker to launch..."
    sleep 1
    # wait until Docker daemon is running and has completed initialisation
    while (! docker stats --no-stream >/dev/null 2>&1); do
        # Docker takes a few seconds to initialize
        echo -n "."
        sleep 5
    done
fi
echo
echo "Docker launched. Starting Zeitgeist Docker containers..."

ZTG_CONTAINER_NAME="zeitgeistpm-zeitgeist-node"

LOG_FILE="$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")/scripts/docker.log"
rm $LOG_FILE && touch $LOG_FILE

docker pull ipfs/go-ipfs:latest &&
docker pull zeitgeistpm/zeitgeist-node &&
docker run \
    -p 4001:4001 \
    -p 127.0.0.1:8080:8080 \
    -p 127.0.0.1:8081:8081 \
    -p 127.0.0.1:5001:5001 \
    --name "ipfs-go-ipfs" \
    -d \
    ipfs/go-ipfs &&
docker run \
    -p 30333:30333 \
    -p 9933:9933 \
    -p 9944:9944 \
    -d \
    --name $ZTG_CONTAINER_NAME \
    zeitgeistpm/zeitgeist-node \
    --dev \
    --base-path=/tmp/data \
    --rpc-external \
    --ws-external \
    --rpc-cors=all \
    --pruning=archive &&
docker logs -f $ZTG_CONTAINER_NAME &> $LOG_FILE \
    | tee $LOG_FILE \
    | tail -F $LOG_FILE \
    | grep --line-buffered 'Running JSON-RPC WS' \
    | while read ; do
        echo "Detected Zeitgeist node running JSON-RPC WS"
        break
    done

echo "Finished creating Zeitgeist Docker containers..."
