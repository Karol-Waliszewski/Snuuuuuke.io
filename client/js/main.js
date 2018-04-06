const Canvas = (function() {
  // DOM
  var $canvas = document.getElementById('gameboard');

  // Variables
  var config = {
    canvasWidth: 1160,
    canvasHeight: 760,
    canvasBackground: '#000'
  };

  var ctx = $canvas.getContext('2d');

  // Functions
  var setBackground = function() {
    ctx.fillStyle = config.canvasBackground;
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
  };

  var setSize = function() {
    $canvas.setAttribute('width', config.canvasWidth);
    $canvas.setAttribute('height', config.canvasHeight);
  };

  var draw = function({
    x = 0,
    y = 0,
    size = 20,
    color = '#fff',
    nick
  }) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    // TODO nicks
  };

  var clear = function({
    x = 0,
    y = 0,
    size = 20
  }) {
    ctx.fillStyle = config.canvasBackground;
    ctx.fillRect(x, y, size, size);
  };

  return {
    setSize,
    setBackground,
    draw,
    clear
  };

})();

const Socket = (function() {

  let url = "http://localhost:4000/";
  var socket = io(url);

  socket.emit('Join Game', {
    nick: 'Lolekappa',
    color: "#e6e6e6"
  });

  // Functions
  var changeDirection = function(direction) {
    return socket.emit('Change Direction', direction);
  };

  // Listeners
  socket.on('Load Fruits', renderFruit);
  socket.on('Update Players', renderSnake);
  socket.on('Fruit Eaten', Canvas.clear);
  socket.on('Fruit Created', renderFruit);
  socket.on('Update Points', renderPoints);
  socket.on('Player Left', removeSnake);

  return {
    changeDirection
  };

})();

const Controller = (function() {

  // Functions
  var getDirection = function(e) {
    let direction = null;
    switch (e.keyCode) {
      case 38:
      case 87:
        direction = 'up';
        break;
      case 40:
      case 83:
        direction = 'down';
        break;
      case 37:
      case 65:
        direction = 'left';
        break;
      case 39:
      case 68:
        direction = 'right';
        break;
    }
    if (direction)
      return direction;
  };

  var onKeyDown = function(e) {
    let direction = getDirection(e);
    Socket.changeDirection(direction);
  };

  // Listeners
  document.addEventListener('keydown', onKeyDown);
})();

// Functions
function renderFruit(data) {
  if (Array.isArray(data)) {
    for (let fruit of data)
      renderFruit(fruit);
  } else {
    Canvas.draw(data);
  }
}

function renderSnake(data) {
  if (Array.isArray(data)) {
    for (let snake of data)
      renderSnake(snake);
  } else {
    let {
      tail,
      ...head
    } = data;
    Canvas.draw(head);
    Canvas.clear(tail[tail.length - 1]);
  }
}

function removeSnake(data) {
  let {
    tail,
    ...head
  } = data;
  Canvas.clear(head);
  if (Array.isArray(tail))
    for (let tailPart of tail) {
      Canvas.clear(tailPart);
    }
}

function renderPoints(data) {
  console.log(data);
}

Canvas.setSize();
Canvas.setBackground();
