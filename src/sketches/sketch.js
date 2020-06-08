import Bird from './Bird';
import Obstacle from './Obstacle';
import { COLOURS } from '../constants';

export default function sketch(p){
  let canvas;
  let activeAccountIds = {};
  let chain = '';
  let currentBlockNumber = '';
  let currentBlockHash = '';
  let currentBlockAuthors = [];
  let parentBlockHash = '';
  let obstacles = [];
  let pipesCleared;
  let obstaclesHit;
  let playQuality;
  let birdColor = 255;

  p.setup = () => {
    canvas = p.createCanvas(800, 400);
    p.bird = new Bird(p);
    pipesCleared = 0;
    obstaclesHit = 0;
    playQuality = 10;
    obstacles.push(new Obstacle(p));
  }

  p.draw = () => {
    p.clear();
    p.fill(COLOURS.pink);
    p.textSize(14);
    p.textFont("Helvetica");
    // p.text('Date: ' + new Date().toLocaleTimeString(), 20, 20);
    p.text('Chain: ' + chain, 20, 40);
    p.text('Current Block Number: ' + currentBlockNumber, 20, 60);
    p.text('Current Block Hash: ' + currentBlockHash, 20, 80);
    p.text('Current Block Authors: ' + currentBlockAuthors, 20, 100);
    p.text('Parent Block Hash: ' + parentBlockHash, 20, 120);
    p.text('Obstacles Cleared: ' + pipesCleared, 20, 140);
    p.text('Obstacle Damage: ' + obstaclesHit, 20, 160);
    p.text('Current Block Active Account IDs: ' + JSON.stringify(activeAccountIds), 20, 180)
    // p.text('Play Quality: ' + String(1 + (pipesCleared / obstaclesHit) || 4).substring(0, 4) + '/5', 20, 140);
    p.bird.show(birdColor);
    p.bird.update();
    // p.background('#FF0000');
    
    if (p.frameCount % 100 === 0) {
      obstacles.push(new Obstacle(p));
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

  p.myCustomRedrawAccordingToNewPropsHandler = (newProps) => {
    if (canvas) { // Make sure the canvas has been created
      birdColor = newProps.color;
      console.log('activeAccountIds', JSON.stringify(activeAccountIds));
      activeAccountIds = newProps.activeAccountIds;
      chain = newProps.chain;
      currentBlockNumber = newProps.currentBlockNumber;
      currentBlockHash = newProps.currentBlockHash;
      currentBlockAuthors = newProps.currentBlockAuthors;
      parentBlockHash = newProps.parentBlockHash;
    }
  }
}
