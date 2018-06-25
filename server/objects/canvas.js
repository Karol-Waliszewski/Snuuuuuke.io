// Getting and initing canvas
var canvas = document.getElementById('mainGame');
var ctx = canvas.getContext('2d');

// Setting Canvas Background
ctx.setBackground = function(color) {
  this.fillStyle = color;
  this.fillRect(0, 0, canvas.width, canvas.height)
}

// Clearing canvas
ctx.clearCanvas = function() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setBackground('#000');
};

module.exports = ctx;
