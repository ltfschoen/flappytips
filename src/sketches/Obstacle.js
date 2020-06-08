import { COLOURS } from '../constants';

function Obstacle(p){
  this.x = p.width;
  this.w = 30;
  this.topMin = 50;
  this.botMin = p.height - 50;
  this.gapStart = p.random(this.topMin, this.botMin);
  this.gapLength = 200;  
  this.speed = 3;

  this.show = function(){
      p.fill(0);
      if (this.highlight){
          p.fill(COLOURS.pink);
      }
      p.rect(this.x, 0, this.w, this.gapStart);
      p.rect(this.x, this.gapStart + this.gapLength, this.w, p.height);
  }
  this.update = function(){
      this.x -= this.speed;     
  }
  this.offscreen = function(){
      return this.x < -this.w;
  }
  
  this.hits = function(){
      if (p.bird.y < this.gapStart || p.bird.y > this.gapStart + this.gapLength) {
          if (p.bird.x > this.x && p.bird.x < this.x + this.w) {
              this.highlight = true;
              return true;
          }
      } 
      this.highlight = false;
      return false;
  }    
}

export default Obstacle;
