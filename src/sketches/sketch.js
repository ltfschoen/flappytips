import io from 'socket.io-client';
import moment from 'moment';
import Bird from './Bird';
import Obstacle from './Obstacle';
import { COLOURS } from '../constants';

// get socket which only uses websockets as a means of communication
// ws://localhost:5000/socket.io/?EIO=4&transport=websocket
let socketEndpoint = process.env.NODE_ENV ? 'ws://flappytips.herokuapp.com:5000' : 'ws://localhost:5000';
const socket = io(socketEndpoint, {
  transports: ["websocket"], // , "polling"
  // withCredentials: true
});
console.log('socket in sketch', socket);

const DEFAULT_SPEED = 3;

export default function sketch(p5) {
  let canvas;
  let currentSpeed = DEFAULT_SPEED;
  let didChangeBlockNumber = 0;
  let opponentOffset = 5;
  let isGameOver = 0;
  let obstacles = [];
  let obstaclesHitAt;
  let blocksCleared = 0;
  let obstaclesHit;
  let playQuality;
  let customFont;
  let interval;
  let isLoadingMsg = 'Loading...';
  let isPendingMsg = 'Pending...';
  let isWaitingMsg = 'Waiting...';

  // Sockets
  let gameDataPlayers = {};

  // Props
  let activeAccountIds = {};
  let birdColor = 255;
  let chain;
  let chainAccount = '';
  let chainAccountResult = '';
  let currentBlockAuthors = [];
  let currentBlockHash = '';
  let currentBlockNumber;
  let deviceOrientation;
  let gameStartRequestedAtBlock = '';
  let gameEndedAtBlock = '';
  let gameEndedAtTime = '';
  let opponentsWhenEnded = {};
  let gameOver;
  let innerHeight = 0;
  let innerWidth = 0;
  let parentBlockHash = '';
  let previousBlockNumber = '';
  let updatePlayerFromSockets;
  let updateOpponentsFromSockets;
  let opponents = {};

  function updateServerWithPlayerViaSockets(obstaclesHitAt) {
    if (!chain || !chainAccount) {
      return;
    }
    // update server that of obstaclesHit value that caused gameover
    socket.emit("updateGameDataPlayers", {
      x: p5.bird.x / p5.width, // always send relative number of position between 0 and 1
      y: p5.bird.y / p5.height, // so it positions are the relatively the same on different screen sizes.
      chain: chain,
      chainAccount: chainAccount,
      chainAccountResult: chainAccountResult,
      gameStartRequestedAtBlock: gameStartRequestedAtBlock,
      gameEndedAtBlock: gameEndedAtBlock,
      gameEndedAtTime: gameEndedAtTime,
      opponentsWhenEnded: opponentsWhenEnded,
      currentBlockNumber: currentBlockNumber,
      blocksCleared: blocksCleared,
      obstaclesHit: obstaclesHit,
      obstaclesHitAt: obstaclesHitAt
    });
  }

  p5.preload = () => {
    customFont = p5.loadFont('assets/LemonMilkMedium.otf');
  }

  p5.setup = () => {
    canvas = p5.createCanvas(800, 400);
    p5.noStroke();
    p5.bird = new Bird(p5);
    blocksCleared = 0;
    obstaclesHit = 0;
    obstaclesHitAt = null;
    playQuality = 10;
    // obstacles.push(new Obstacle(p5));

    // canvas.mousePressed(() => {
    //   // when you click on the canvas, update your position
    // });

    interval = setInterval(() => {
      updateServerWithPlayerViaSockets(obstaclesHitAt);
    }, 10); // update player position every x seconds so opponent can see them

    p5.frameRate(30); //set framerate to 30, same as server

    socket.on('connect', () => {
      console.log('socket connected', socket);
    });

    socket.on("gameDataPlayers", (data) => {
      // get the data from the server to continually update the positions

      // if current player has requested to start at a block
      if (data[socket.id] && data[socket.id]['gameStartRequestedAtBlock']) {
        let gameDataPlayersStarted = {};
        Object.entries(data).forEach((player) => {
          // filter only the other players that started at the same block as the current player
          if (player[0] !== socket.id) {
            if (player[1]['gameStartRequestedAtBlock'] === data[socket.id]['gameStartRequestedAtBlock']) {
              gameDataPlayersStarted[`${player[0]}`] = player[1];
            }
          // add the current player too
          } else {
            gameDataPlayersStarted[socket.id] = player[1];
          }
        });

        gameDataPlayers = gameDataPlayersStarted;
      }
    });
  }

  // note: function updateWithProps replaces deprecated
  // function myCustomRedrawAccordingToNewPropsHandler
  p5.updateWithProps = (newProps) => {
    if (canvas) { // Make sure the canvas has been created
      // console.log('activeAccountIds', JSON.stringify(activeAccountIds));
      activeAccountIds = newProps.activeAccountIds;
      birdColor = newProps.birdColor;
      chain = newProps.chain;
      if (newProps.chainAccount) {
        chainAccount = newProps.chainAccount;
        // console.log('chainAccount', chainAccount);
      }
      if (
        currentBlockNumber !== newProps.currentBlockNumber &&
        currentBlockNumber === newProps.previousBlockNumber && 
        newProps.currentBlockNumber !== newProps.previousBlockNumber
      ) {
        didChangeBlockNumber = 1;
        p5.changeSpeed();   
      }
      chainAccountResult = newProps.chainAccountResult;
      currentBlockAuthors = newProps.currentBlockAuthors;
      currentBlockHash = newProps.currentBlockHash;
      currentBlockNumber = newProps.currentBlockNumber;
      deviceOrientation = newProps.deviceOrientation;
      p5.deviceOrientation = deviceOrientation;
      gameStartRequestedAtBlock = newProps.gameStartRequestedAtBlock;
      gameEndedAtBlock = newProps.gameEndedAtBlock;
      gameEndedAtTime = newProps.gameEndedAtTime;
      opponentsWhenEnded = newProps.opponentsWhenEnded;
      gameOver = newProps.gameOver;
      innerHeight = newProps.innerHeight;
      innerWidth = newProps.innerWidth;
      parentBlockHash = newProps.parentBlockHash;
      previousBlockNumber = newProps.previousBlockNumber;
      updatePlayerFromSockets = newProps.updatePlayerFromSockets;
      updateOpponentsFromSockets = newProps.updateOpponentsFromSockets;
      opponents = newProps.opponents;

      if (
        gameStartRequestedAtBlock === currentBlockNumber ||
        gameEndedAtBlock === currentBlockNumber
      ) {
        currentSpeed = DEFAULT_SPEED;
      }
    }
  }

  p5.draw = () => {
    // console.log('p5', p5);
    p5.clear();
    p5.background('#000000');
    // draw a circle for opponent position
    // console.log('gameDataPlayers received: ', gameDataPlayers);

    // update opponent state
    if (updateOpponentsFromSockets) {
      updateOpponentsFromSockets({
        allPlayersData: gameDataPlayers,
        playerSocketId: socket.id
      });
    }

    // for (const id in gameDataPlayers) {
    for (const [socketId, value] of Object.entries(gameDataPlayers)) {
      // console.log('id', id);
      // console.log('current player socket.id', socket.id);
      if (socketId !== socket.id) {
        const gameDataPlayer = gameDataPlayers[socketId];
        // console.log('opponent gameDataPlayer', gameDataPlayer);
        p5.fill(COLOURS.purple);
        // give opponent slight offset so can see them behind current player icon
        p5.circle(gameDataPlayer.x * p5.width + opponentOffset, gameDataPlayer.y * p5.height + opponentOffset, 30);
      } else {
        // update current player state
        if (updatePlayerFromSockets) {
          updatePlayerFromSockets(gameDataPlayers[socket.id]);
        }
      }
    }
    p5.fill(COLOURS.pink);
    p5.textSize(12);
    p5.textFont(customFont);
    // p5.text('Date: ' + new Date().toLocaleTimeString(), 20, 20);
    p5.text('Game Speed: ' + currentSpeed, 20, 40);
    p5.text('Chain Name: ' + chain || isLoadingMsg, 20, 80);
    let result = (chainAccountResult === chainAccount) ? 'winner' : chainAccountResult;
    p5.text('Game Result: ' + result, 20, 100);
    p5.text('Game Start Block: ' + gameStartRequestedAtBlock || isLoadingMsg, 20, 120);
    p5.text('Game Ended Block: ' + gameEndedAtBlock || isPendingMsg, 20, 140);
  
    p5.text('Current Block: ' + currentBlockNumber || isLoadingMsg, 20, 160);
    // p5.text('Current Block Hash: ' + currentBlockHash, 20, 80);
    // if (currentBlockAuthors.length > 0) {
    //   p5.text('Current Block Authors: ' + currentBlockAuthors.join(', '), 20, 100);
    // }
    // p5.text('Parent Block Hash: ' + parentBlockHash, 20, 120);
    p5.text('Player Chain Account: ' + chainAccount, 20, 180);
    p5.text('Player Blocks Cleared: ' + Number.parseFloat(blocksCleared).toFixed(2), 20, 200);
    let opponentCount = currentBlockNumber >= gameStartRequestedAtBlock ? Object.keys(opponents).length : Object.keys(opponentsWhenEnded).length;
    p5.text('Opponent Count: ' + opponentCount, 20, 220);

    let lv = 240;
    let vs = 20;
    let addVertSpace = () => {
      lv = lv + vs;
      return lv + vs;
    };
    p5.fill(COLOURS.blue);
    p5.textSize(10);
    let maxOpponentToDisplay = 2;
    let count = 0;
    for (const [socketId, value] of Object.entries(opponents)) {
      // only compare with players other than the current player
      if (socket.id !== socketId && count < maxOpponentToDisplay) {
        count = count + 1;
        p5.text('Opponent Chain Account: ' + value.chainAccount || isWaitingMsg, 20, addVertSpace());
        p5.text('Opponent Blocks Cleared: ' + Number.parseFloat(value.blocksCleared).toFixed(2), 20, addVertSpace());   
        p5.text('', 20, addVertSpace());
      }
    }

    // p5.text('Block Collisions Damage: ' + obstaclesHit, 20, 120);
    // p5.text('Current Block Active Account IDs: ' + JSON.stringify(activeAccountIds), 20, 180)
    // p5.text('Play Quality: ' + String(1 + (blocksCleared / obstaclesHit) || 4).substring(0, 4) + '/5', 20, 140);

    if (isGameOver) {
      p5.fill(COLOURS.grey);
      p5.circle(0.08, 1, 30);
      currentSpeed = 3;
      // only let blocksCleared reset in new game since results shown in ui
      // blocksCleared = 0;
      // obstaclesHit = 0;
      obstacles = [];
      return;
    }
    if (obstaclesHit > 0) {
      let currentDateUnixTimestamp = moment().unix();
      console.log('time: ', moment.unix(currentDateUnixTimestamp).format("YYYY-MM-DD HH:mm"));
      updateServerWithPlayerViaSockets(currentDateUnixTimestamp);
      clearInterval(interval);

      console.log('game over');
      // game over for currrent player, 
      isGameOver = 1;
      gameOver(blocksCleared);

      return;
    }

    p5.bird.show(birdColor);
    p5.bird.update();
    // p5.background('#FF0000');

    // if (p5.frameCount % 100 === 0) {
    //   obstacles.push(new Obstacle(p5));
    // }  

    if (
      p5.frameCount % 100 === 0 &&
      gameStartRequestedAtBlock &&
      currentBlockNumber >= gameStartRequestedAtBlock &&
      !gameEndedAtBlock &&
      currentBlockNumber !== '' &&
      didChangeBlockNumber === 1
    ) {
      obstacles.push(new Obstacle(p5, currentBlockNumber, currentSpeed, customFont, false));
      didChangeBlockNumber = 0;
    }
    
    for (var i = obstacles.length - 1; i >= 0; i--){
      obstacles[i].show();
      obstacles[i].update();
      
      if (obstacles[i].hits(p5.bird)){
        obstaclesHit++;
      }

      if (obstacles[i].offscreen()){
        obstacles.splice(i, 1);
        blocksCleared++;
      }      
    }
  }

  p5.keyPressed = () => {
    if (p5.key === " ") {
      p5.bird.goUp();
    }
  }

  p5.touchStarted = () => {
    if (isGameOver) {
      return;
    }
    if (birdColor === 255) {
      birdColor = COLOURS.pink;
      setTimeout(() => {
        birdColor = 255;
      }, 1000);
    }

    p5.bird && p5.bird.goUp();
    // prevent default
    // To prevent any default behavior for this event, add "return false" to the end of the method.
    // See https://github.com/processing/p5.js/blob/1.0.0/src/events/touch.js#L10
    // return false;
  }

  p5.getNextSpeed = () => {
    let nextSpeed;
    if (currentSpeed >= 20) {
      nextSpeed = currentSpeed + 0.125;
    } else if (currentSpeed >= 10) {
      nextSpeed = currentSpeed + 0.5;
    } else {
      nextSpeed = currentSpeed + 1;
    }
    return nextSpeed; 
  }
  
  p5.changeSpeed = () => {
    currentSpeed = p5.getNextSpeed();
  }
}
