import Bird from './Bird';
import Obstacle from './Obstacle';
import { COLOURS } from '../constants';

export default function sketch(p){
  let canvas;
  let activeAccountIds = {};
  let chain = '';
  let currentBlockNumber = '';
  let previousBlocktime = '';
  let estimatedNextBlocktime = '';
  let currentSpeed = 3;
  let didChangeBlockNumber = 0;
  let currentBlockHash = '';
  let currentBlockAuthors = [];
  let gameOver;
  let isGameOver = 0;
  let isNewSiaBlock = false;
  let isPartialBlock = false;
  let parentBlockHash = '';
  let obstacles = [];
  let blocksCleared;
  let obstaclesHit;
  let playQuality;
  let birdColor = 255;
  let customFont;

  p.preload = () => {
    customFont = p.loadFont('assets/LemonMilkMedium.otf');
  }

  p.setup = () => {
    canvas = p.createCanvas(800, 400);
    p.bird = new Bird(p);
    blocksCleared = 0;
    obstaclesHit = 0;
    playQuality = 10;
    // obstacles.push(new Obstacle(p));
  }

  p.draw = () => {
    p.clear();
    p.background('#000000');
    p.fill(COLOURS.pink);
    p.textSize(16);
    p.textFont("Helvetica");
    // p.text('Date: ' + new Date().toLocaleTimeString(), 20, 20);
    p.text('Game Speed: ' + currentSpeed, 20, 40);
    p.text('Chain Name: ' + chain, 20, 60);
    p.text('Current Block: ' + currentBlockNumber, 20, 80);
    // p.text('Current Block Hash: ' + currentBlockHash, 20, 80);
    // if (currentBlockAuthors.length > 0) {
    //   p.text('Current Block Authors: ' + currentBlockAuthors.join(', '), 20, 100);
    // }
    // p.text('Parent Block Hash: ' + parentBlockHash, 20, 120);
    p.text('Blocks Cleared: ' + Number.parseFloat(blocksCleared).toFixed(2), 20, 100);
    if (chain == "Sia Mainnet") {
      p.text('Previous Blocktime: ' + previousBlocktime, 20, 120);
      p.text('Next Blocktime (Estimate): ' + estimatedNextBlocktime, 20, 140);
    }
    // p.text('Block Collisions Damage: ' + obstaclesHit, 20, 120);
    // p.text('Current Block Active Account IDs: ' + JSON.stringify(activeAccountIds), 20, 180)
    // p.text('Play Quality: ' + String(1 + (blocksCleared / obstaclesHit) || 4).substring(0, 4) + '/5', 20, 140);

    if (isGameOver) {
      currentSpeed = 3;
      blocksCleared = 0;
      obstacles = [];
      obstaclesHit = 0;
      return;
    }
    if (obstaclesHit > 0) {
      console.log('game over');
      isGameOver = 1;
      gameOver(blocksCleared);
      return;
    }

    p.bird.show(birdColor);
    p.bird.update();
    // p.background('#FF0000');

    // if (p.frameCount % 100 === 0) {
    //   obstacles.push(new Obstacle(p));
    // }  

    if (p.frameCount % 100 === 0 && currentBlockNumber !== '' && didChangeBlockNumber === 1) {
      obstacles.push(new Obstacle(p, currentBlockNumber, currentSpeed, customFont, false));
      didChangeBlockNumber = 0;
    }

    if (p.frameCount % 100 === 0 && currentBlockNumber !== '' && isPartialBlock === true) {
      obstacles.push(new Obstacle(p, `${currentBlockNumber}.X`, currentSpeed, customFont, isPartialBlock));
    }
    
    for (var i = obstacles.length - 1; i >= 0; i--){
      obstacles[i].show();
      obstacles[i].update();
      
      if (obstacles[i].hits(p.bird)){
        obstaclesHit++;
      }

      if (obstacles[i].offscreen()){
        obstacles.splice(i, 1);
        if (isPartialBlock) {
          blocksCleared = blocksCleared + 0.01;
        } else {
          blocksCleared++;
        }
      }      
    }
  }

  p.keyPressed = () => {
    if (p.key === " ") {
      p.bird.goUp();
    }
  }

  p.touchStarted = () => {
    if (isGameOver) {
      return;
    }
    if (birdColor === 255) {
      birdColor = COLOURS.pink;
      setTimeout(() => {
        birdColor = 255;
      }, 1000);
    }

    p.bird && p.bird.goUp();
    // prevent default
    // To prevent any default behavior for this event, add "return false" to the end of the method.
    // See https://github.com/processing/p5.js/blob/1.0.0/src/events/touch.js#L10
    // return false;
  }

  p.myCustomRedrawAccordingToNewPropsHandler = (newProps) => {
    if (canvas) { // Make sure the canvas has been created
      birdColor = newProps.color;
      // console.log('activeAccountIds', JSON.stringify(activeAccountIds));
      activeAccountIds = newProps.activeAccountIds;
      chain = newProps.chain;
      isNewSiaBlock = newProps.isNewSiaBlock;
      if (newProps.currentBlockNumber !== newProps.previousBlockNumber) {
        if (chain == "Sia Mainnet") {
          if (isNewSiaBlock) {
            didChangeBlockNumber = 1;
            p.changeSpeed();
          } else {
            isPartialBlock = true;
          }
        } else {
          didChangeBlockNumber = 1;
          p.changeSpeed();   
        }
      }
      currentBlockNumber = newProps.currentBlockNumber;
      currentBlockHash = newProps.currentBlockHash;
      currentBlockAuthors = newProps.currentBlockAuthors;
      gameOver = newProps.gameOver;
      parentBlockHash = newProps.parentBlockHash;
      previousBlocktime = newProps.previousBlocktime;
      estimatedNextBlocktime = newProps.estimatedNextBlocktime;
    }
  }

  p.getNextSpeed = () => {
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
  
  p.changeSpeed = () => {
    currentSpeed = p.getNextSpeed();
  }
}
