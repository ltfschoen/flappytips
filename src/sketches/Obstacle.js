import { COLOURS } from '../constants';

function Obstacle(p5, currentBlockNumber, currentSpeed, customFont){
  this.x = p5.width;
  this.w = 50;
  this.topMin = 20;
  this.botMin = p5.height - 100;
  this.gapStart = p5.random(this.topMin, this.botMin);
  this.gapMax = 200;
  this.gapMin = this.gapMax / p5.random(1.5, 4);
  // easier gap when get to higher level (speed) so time to move between gap, but speed obviously faster
  this.gapLength = currentSpeed > 10 ? this.gapMax : this.gapMax - this.gapMin;
  this.speed = currentSpeed;

  this.show = function(){
      p5.fill('#FFFFFF');
      if (this.highlight){
        p5.fill(COLOURS.pink)
      }
      p5.rect(this.x, 0, this.w, this.gapStart);
      p5.rect(this.x, this.gapStart + this.gapLength, this.w, p5.height);

      p5.fill(COLOURS.grey)
      p5.textSize(25);
      p5.text(String(currentBlockNumber), this.x - 15, this.gapStart + (this.gapLength / 2), this.w, this.w);     

  }
  this.update = function(){
      this.x -= this.speed;     
  }
  this.offscreen = function(){
      return this.x < -this.w;
  }
  
  this.hits = function(){
      if (p5.bird.y < this.gapStart || p5.bird.y > this.gapStart + this.gapLength) {
          if (p5.bird.x > this.x && p5.bird.x < this.x + this.w) {
              this.highlight = true;
              return true;
          }
      } 
      this.highlight = false;
      return false;
  }    
}

export default Obstacle;
