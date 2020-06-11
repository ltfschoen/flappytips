import { COLOURS } from '../constants';

function Obstacle(p, currentBlockNumber, currentSpeed, customFont){
  this.x = p.width;
  this.w = 50;
  this.topMin = 20;
  this.botMin = p.height - 100;
  this.gapStart = p.random(this.topMin, this.botMin);
  this.gapMax = 200;
  this.gapMin = this.gapMax / p.random(1.5, 4);
  // easier gap when get to higher level (speed) so time to move between gap, but speed obviously faster
  this.gapLength = currentSpeed > 10 ? this.gapMax : this.gapMax - this.gapMin;
  this.speed = currentSpeed;

  this.show = function(){
      p.fill('#FFFFFF');
      if (this.highlight){
          p.fill(COLOURS.pink);
      }
      p.rect(this.x, 0, this.w, this.gapStart);
      p.rect(this.x, this.gapStart + this.gapLength, this.w, p.height);

      p.fill(COLOURS.pink);
      p.textSize(25);
      p.text(String(currentBlockNumber), this.x - 15, this.gapStart + (this.gapLength / 2), this.w, this.w);
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
