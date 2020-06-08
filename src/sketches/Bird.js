function Bird(p){
  this.y = p.height / 2;
  this.x = 64;
  this.gravity = 0.6;
  this.lift = -16;
  this.velocity = 0;
  
  this.show = function(color){
    p.fill(color);
    p.ellipse(this.x, this.y, 32, 32);
  }
  
  this.goUp = function(){
    this.velocity += this.lift;
    console.log(this.velocity);
  }
  
  this.update = function(){
    this.velocity += this.gravity;
    this.velocity *= 0.9;
    this.y += this.velocity;
    
    if (this.y > p.height) {
      this.y = p.height;
      this.velocity = 0;
    }
    
    if (this.y < 0) {
      this.y = 0;
      this.velocity = 0;
    }
  }
}

export default Bird;
