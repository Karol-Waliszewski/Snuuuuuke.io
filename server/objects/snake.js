const config = require('../config');

class Snake {
  constructor({
    nick,
    color,
    id
  }) {
    this.x = Math.floor(Math.random() * config.Canvas.width);
    this.y = Math.floor(Math.random() * config.Canvas.height);
    this.dirX = 1;
    this.dirY = 0;
    this.speed = 4;
    this.color = color;
    this.nick = nick;
    this.id = id;
    this.points = 0;
    this.tail = [];
    this.addTail(10);
  }

  addTail(length) {
    if (length == undefined) {
      this.tail.push({
        x: null,
        y: null,
      });
    } else {
      for (let i = 0; i < length; i++) {
        this.tail.push({
          x: null,
          y: null,
        });
      }
    }
  }

  move() {
    this.moveTail();

    //if (!this.reachedBorder('x'))
    this.x += this.dirX * this.speed;
    this.reachedBorder2('x')
    //else return false;
    //if (!this.reachedBorder('y'))
    this.y += this.dirY * this.speed;
    this.reachedBorder2('y')
    //else return false;
  }

  moveTail() {
    if (this.tail.length > 0) {
      this.tail[0].x = this.x;
      this.tail[0].y = this.y;

      for (let i = this.tail.length - 1; i > 0; i--) {
        this.tail[i].x = this.tail[i - 1].x;
        this.tail[i].y = this.tail[i - 1].y;
      }
    }
  }

  reachedBorder(axis) {
    if (axis == 'x') {
      if (this.dirX == 1 && this.x >= config.Canvas.width - 20) return true;
      else if (this.dirX == -1 && this.x <= 0) return true;
      else return false;
    } else if (axis == 'y') {
      if (this.dirY == 1 && this.y >= config.Canvas.height - 20) return true;
      else if (this.dirY == -1 && this.y <= 0) return true;
      else return false;
    } else throw new Error('Wrong Axis!')
  }

  reachedBorder2(axis) {
    if (axis == 'x') {
      if (this.dirX == 1 && this.x >= config.Canvas.width - 20) this.x = 0;
      else if (this.dirX == -1 && this.x <= 0) this.x = config.Canvas.width - 20;

    } else if (axis == 'y') {
      if (this.dirY == 1 && this.y >= config.Canvas.height - 20) this.y = 0;
      else if (this.dirY == -1 && this.y <= 0) this.y = config.Canvas.height - 20;

    } else throw new Error('Wrong Axis!')
  }

  changeDirection(key) {
    switch (key) {
      case 37:
        if (this.dirY != 0) {
          this.dirX = -1;
          this.dirY = 0;
        }
        break;
      case 39:
        if (this.dirY != 0) {
          this.dirX = 1;
          this.dirY = 0;
        }
        break;
      case 38:
        if (this.dirX != 0) {
          this.dirX = 0;
          this.dirY = -1;
        }
        break;
      case 40:
        if (this.dirX != 0) {
          this.dirX = 0;
          this.dirY = 1;
        }
        break;
    }
  }
}

module.exports = Snake;
