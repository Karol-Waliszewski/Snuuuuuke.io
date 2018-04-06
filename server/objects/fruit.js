
const config = require('../config');

class Fruit {
  constructor() {
    this.x = Math.floor(Math.random() * config.Canvas.width);
    this.y = Math.floor(Math.random() * config.Canvas.height);
    this.size = Math.floor(Math.random() * (4 - 1) + 1) * 10;
    this.color = "#e74c3c";
  }
}

module.exports = Fruit;
