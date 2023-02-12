function Bird(p5){
  this.y = p5.height / 2;
  this.x = 64;
  this.gravity = 0.5;
  this.lift = -10;
  this.velocity = 0;
  
  this.show = function(color){
    p5.fill(color);
    p5.ellipse(this.x, this.y, 32, 32);
  }
  
  this.goUp = function(){
    this.velocity += this.lift;
    // console.log(this.velocity);
  }
  
  this.update = function(){
    this.velocity += this.gravity;
    this.velocity *= 0.9;
    this.y += this.velocity;
    
    if (this.y > p5.height) {
      this.y = p5.height;
      this.velocity = 0;
    }
    
    if (this.y < 0) {
      this.y = 0;
      this.velocity = 0;
    }
  }
}

export default Bird;
