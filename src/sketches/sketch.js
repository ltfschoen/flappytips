import io from 'socket.io-client';
import Bird from './Bird';
import Obstacle from './Obstacle';
import { COLOURS } from '../constants';

// get socket which only uses websockets as a means of communication
// ws://localhost:5000/socket.io/?EIO=4&transport=websocket
const socket = io("ws://localhost:5000", {
  transports: ["websocket"]
});
console.log('socket in sketch', socket);

export default function sketch(p5) {
  let canvas;
  let currentSpeed = 3;
  let didChangeBlockNumber = 0;
  let enemyOffset = 5;
  let isGameOver = 0;
  let obstacles = [];
  let blocksCleared;
  let obstaclesHit;
  let playQuality;
  let customFont;

  // Sockets
  let gameDataPlayers = {};

  // Props
  let activeAccountIds = {};
  let birdColor = 255;
  let chain = '';
  let currentBlockAuthors = [];
  let currentBlockHash = '';
  let currentBlockNumber = '';
  let deviceOrientation;
  let gameOver;
  let height = 0;
  let parentBlockHash = '';
  let previousBlockNumber = '';
  let width = 0;

  p5.preload = () => {
    customFont = p5.loadFont('assets/LemonMilkMedium.otf');
  }

  p5.setup = () => {
    canvas = p5.createCanvas(800, 400);
    p5.noStroke();
    p5.bird = new Bird(p5);
    blocksCleared = 0;
    obstaclesHit = 0;
    playQuality = 10;
    // obstacles.push(new Obstacle(p5));

    canvas.mousePressed(() => {
      // when you click on the canvas, update your position
      socket.emit("updateGameDataPlayers", {
        x: p5.bird.x / p5.width, // always send relative number of position between 0 and 1
        y: p5.bird.y / p5.height, // so it positions are the relatively the same on different screen sizes.
        chain: chain,
        blocksCleared: blocksCleared,
        obstaclesHit: obstaclesHit,
      });
    });

    p5.frameRate(30); //set framerate to 30, same as server

    socket.on('connect', () => {
      console.log('socket connected', socket);
    });

    socket.on("gameDataPlayers", (data) => {
      // get the data from the server to continually update the positions
      gameDataPlayers = data;
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
      if (newProps.currentBlockNumber !== newProps.previousBlockNumber) {
        didChangeBlockNumber = 1;
        p5.changeSpeed();   
      }
      currentBlockAuthors = newProps.currentBlockAuthors;
      currentBlockHash = newProps.currentBlockHash;
      currentBlockNumber = newProps.currentBlockNumber;
      deviceOrientation = newProps.deviceOrientation;
      p5.deviceOrientation = deviceOrientation;
      gameOver = newProps.gameOver;
      height = newProps.height;
      parentBlockHash = newProps.parentBlockHash;
      previousBlockNumber = newProps.previousBlockNumber;
      width = newProps.width;
    }
  }

  p5.draw = () => {
    // console.log('p5', p5);
    p5.clear();
    p5.background('#000000');
    // draw a circle for opponent position
    for (const id in gameDataPlayers) {
      // console.log('id', id);
      // console.log('current player socket.id', socket.id);
      if (id !== socket.id) {
        const gameDataPlayer = gameDataPlayers[id];
        console.log('enemy gameDataPlayer', gameDataPlayer);

        p5.fill(COLOURS.purple);
        // give enemy slight offset so can see them behind current player icon
        p5.circle(gameDataPlayer.x * p5.width + enemyOffset, gameDataPlayer.y * p5.height + enemyOffset, 30);
      }
    }
    p5.fill(COLOURS.pink);
    p5.textSize(16);
    p5.textFont(customFont);
    // p5.text('Date: ' + new Date().toLocaleTimeString(), 20, 20);
    p5.text('Game Speed: ' + currentSpeed, 20, 40);
    p5.text('Chain Name: ' + chain, 20, 60);
    p5.text('Current Block: ' + currentBlockNumber, 20, 80);
    // p5.text('Current Block Hash: ' + currentBlockHash, 20, 80);
    // if (currentBlockAuthors.length > 0) {
    //   p5.text('Current Block Authors: ' + currentBlockAuthors.join(', '), 20, 100);
    // }
    // p5.text('Parent Block Hash: ' + parentBlockHash, 20, 120);
    p5.text('Blocks Cleared: ' + Number.parseFloat(blocksCleared).toFixed(2), 20, 100);
    // p5.text('Block Collisions Damage: ' + obstaclesHit, 20, 120);
    // p5.text('Current Block Active Account IDs: ' + JSON.stringify(activeAccountIds), 20, 180)
    // p5.text('Play Quality: ' + String(1 + (blocksCleared / obstaclesHit) || 4).substring(0, 4) + '/5', 20, 140);

    if (isGameOver) {
      currentSpeed = 3;
      blocksCleared = 0;
      obstacles = [];
      obstaclesHit = 0;
      return;
    }
    if (obstaclesHit > 0) {
      // update server that of obstaclesHit value that caused gameover
      socket.emit("updateGameDataPlayers", {
        x: p5.bird.x / p5.width, // always send relative number of position between 0 and 1
        y: p5.bird.y / p5.height, // so it positions are the relatively the same on different screen sizes.
        chain: chain,
        blocksCleared: blocksCleared,
        obstaclesHit: obstaclesHit,
      });

      console.log('game over');
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

    if (p5.frameCount % 100 === 0 && currentBlockNumber !== '' && didChangeBlockNumber === 1) {
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
