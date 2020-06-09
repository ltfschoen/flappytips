import Bird from './Bird';
import Obstacle from './Obstacle';
import { COLOURS } from '../constants';

export default function sketch(p){
  let canvas;
  let activeAccountIds = {};
  let chain = '';
  let currentBlockNumber = '';
  let currentSpeed = 3;
  let didChangeBlockNumber = 0;
  let currentBlockHash = '';
  let currentBlockAuthors = [];
  let parentBlockHash = '';
  let obstacles = [];
  let pipesCleared;
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
    pipesCleared = 0;
    obstaclesHit = 0;
    playQuality = 10;
    // obstacles.push(new Obstacle(p));
  }

  p.draw = () => {
    p.clear();
    p.fill(COLOURS.pink);
    p.textSize(12);
    p.textFont("Helvetica");
    // p.text('Date: ' + new Date().toLocaleTimeString(), 20, 20);
    p.text('Game Speed: ' + currentSpeed, 20, 40);
    p.text('Chain Name: ' + chain, 20, 60);
    p.text('Current Block Number: ' + currentBlockNumber, 20, 80);
    // p.text('Current Block Hash: ' + currentBlockHash, 20, 80);
    // if (currentBlockAuthors.length > 0) {
    //   p.text('Current Block Authors: ' + currentBlockAuthors.join(', '), 20, 100);
    // }
    // p.text('Parent Block Hash: ' + parentBlockHash, 20, 120);
    p.text('Blocks Cleared: ' + pipesCleared, 20, 100);
    p.text('Block Collisions Damage: ' + obstaclesHit, 20, 120);
    // p.text('Current Block Active Account IDs: ' + JSON.stringify(activeAccountIds), 20, 180)
    // p.text('Play Quality: ' + String(1 + (pipesCleared / obstaclesHit) || 4).substring(0, 4) + '/5', 20, 140);
    p.bird.show(birdColor);
    p.bird.update();
    // p.background('#FF0000');

    // if (p.frameCount % 100 === 0) {
    //   obstacles.push(new Obstacle(p));
    // }  

    if (p.frameCount % 100 === 0 && currentBlockNumber !== '' && didChangeBlockNumber === 1) {
      obstacles.push(new Obstacle(p, currentBlockNumber, currentSpeed, customFont));
      didChangeBlockNumber = 0;
    }
    
    for (var i = obstacles.length - 1; i >= 0; i--){
      obstacles[i].show();
      obstacles[i].update();
      
      if (obstacles[i].hits(p.bird)){
        obstaclesHit++;
      }

      if (obstacles[i].offscreen()){
        obstacles.splice(i, 1);
        pipesCleared++;
      }      
    }
  }

  p.keyPressed = () => {
    if (p.key === " ") {
      p.bird.goUp();
    }
  }

  p.touchStarted = () => {
    if (birdColor === 255) {
      birdColor = COLOURS.pink;
      setTimeout(() => {
        birdColor = 255;
      }, 1000);
    }
    p.bird.goUp();
    // prevent default
    return false;
  }

  p.myCustomRedrawAccordingToNewPropsHandler = (newProps) => {
    if (canvas) { // Make sure the canvas has been created
      birdColor = newProps.color;
      console.log('activeAccountIds', JSON.stringify(activeAccountIds));
      activeAccountIds = newProps.activeAccountIds;
      chain = newProps.chain;
      if (newProps.currentBlockNumber !== newProps.previousBlockNumber) {
        didChangeBlockNumber = 1;
      }
      currentBlockNumber = newProps.currentBlockNumber;
      currentBlockHash = newProps.currentBlockHash;
      currentBlockAuthors = newProps.currentBlockAuthors;
      parentBlockHash = newProps.parentBlockHash;
    }
  }

  // p.getNextSpeed = () => {
  //   let nextSpeed;
  //   if (currentSpeed >= 5) {
  //      nextSpeed = 1;
  //   } else {
  //     nextSpeed = currentSpeed + 1;
  //   }
  //   return nextSpeed; 
  // }
  
  // p.changeSpeed = () => {
  //   currentSpeed = p.getNextSpeed();
  // }
}
