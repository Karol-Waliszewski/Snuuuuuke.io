// Requirements
const socketio = require('socket.io');
const express = require('express');
const Snake = require('./objects/snake');
const Fruit = require('./objects/fruit');

// Variables
const snakes = [],
  fruits = [];

var app = express();

app.get('/', (req, res) => {
  res.send('Snuuuke');
});

// Init server
const server = require('http').createServer(app);
let port = process.env.PORT || 4000;
server.listen(port);
console.log('Snuuuuke.io is running on port: ' + port);

// Init socket
const io = socketio.listen(server);

// Functions
const FindSnake = function(id) {
  let searchedSnake = snakes.find(function(snake) {
    return snake.id == id;
  });
  if (searchedSnake) return searchedSnake;
  else return false;
};

const updatePlayers = function() {
  for (let snake of snakes) {
    snake.move();
  }
  let data = snakes.map(function(snake) {
    return {
      x: snake.x,
      y: snake.y,
      color: snake.color,
      nick: snake.nick,
      tail: snake.tail
    };
  });
  checkObjectsCollison();
  io.to('Game Room').emit('Update Players', snakes);
};

const comparePoints = function(a, b) {
  if (a.points < b.points)
    return 1;
  if (b.points < a.points)
    return -1;
  return 0;
};

const updatePoints = function() {
  let points = snakes.map(function(snake) {
    return {
      nick: snake.nick,
      points: snake.points
    };
  });
  points = points.sort(comparePoints);
  io.to('Game Room').emit('Update Points', points);
};

const checkColision = function(obj1, obj2) {
  if (obj1.hasOwnProperty('size'))
    return obj1.x < obj2.x + 20 && obj2.x < obj1.x + obj1.size && obj1.y < obj2.y + 20 && obj2.y < obj1.y + obj1.size;
  else if (obj2.hasOwnProperty('size'))
    return obj1.x < obj2.x + obj2.size && obj2.x < obj1.x + 20 && obj1.y < obj2.y + obj2.size && obj2.y < obj1.y + 20;
  else
    return obj1.x < obj2.x + 20 && obj2.x < obj1.x + 20 && obj1.y < obj2.y + 20 && obj2.y < obj1.y + 20;
};

const checkObjectsCollison = function() {
  for (let player of snakes) {
    for (let fruit of fruits) {
      if (checkColision(player, fruit)) {
        player.points += fruit.size / 10;
        player.addTail(Math.round(fruit.size / player.speed));
        updatePoints();

        // Emiting update to clients
        FruitEaten(fruit);
      }
      let lostFlag = false;
      for (let snake of snakes) {
        if (snake.id != player.id && checkColision(player, snake)) {
          lostFlag = true;
          break;
        }
        if (snake.id != player.id) {
          for (let tail of snake.tail) {
            if (checkColision(player, tail)) {
              lostFlag = true;
              break;
            }
          }
        } else if (snake.id == player.id) {
          for (let i = 11 + snake.speed; i < snake.tail.length; i++) {
            if (checkColision(player, snake.tail[i])) {
              lostFlag = true;
              break;
            }
          }
        }
      }
      if (lostFlag) {
        io.to(player.id).emit('Game Lost');
        leaveGame(player.id);
      }
    }
  }
};

function createFruit() {
  // Server creates fruit provided that there is not already 15 on the gameboard
  if (fruits.length < 15) {
    // Creates new Fruit object
    let f = new Fruit();
    fruits.push(f);

    // Emiting update to clients
    io.to('Game Room').emit('Fruit Created', f);
  }
  // Interval is based on amount of fruits on the gameboard (1 fruit = 0.5s more)
  setTimeout(createFruit, fruits.length * 500);
}

function FruitEaten(fruit) {
  let searchedFruit = fruits.find(function(f) {
    return fruit.x == f.x && fruit.y == f.y;
  });
  if (searchedFruit) {
    fruits.splice(fruits.indexOf(searchedFruit), 1);

    // Emiting update to clients
    io.to('Game Room').emit('Fruit Eaten', fruit);
  }
}

function LoadFruits(id) {
  io.to(id).emit('Load Fruits', fruits);
}

const leaveGame = function(id) {
  let snake = FindSnake(id);
  if (snake) {
    snakes.splice(snakes.indexOf(snake), 1);
  }
  updatePoints();
  io.to('Game Room').emit('Player Left', snake);
};

// SOCKET.IO
io.on('connection', function(socket) {

  // Connected
  console.log(`Connected: ${socket.id}`);

  // Disconnected
  socket.on('disconnect', function() {
    console.log(`Disconnected: ${socket.id}`);
    leaveGame(socket.id);
  });

  // Join Game
  socket.on('Join Game', function(data) {

    // Joining to game room
    socket.join('Game Room');

    // Creates new Snake
    let snake = new Snake({
      color: data.color,
      nick: data.nick,
      id: socket.id
    });

    // Adding to array
    snakes.push(snake);

    // Loading fruits on start
    LoadFruits(socket.id);

    // Loading Points
    updatePoints();
  });

  // leave Game
  socket.on('Leave Game', function() {
    console.log(`Left Game: ${socket.id}`);
    leaveGame(socket.id);
  });

  socket.on('Change Direction', function(direction) {
    let searchedSnake = FindSnake(socket.id);
    if (searchedSnake) {
      searchedSnake.changeDirection(direction);
    }
  });

});

// ----------- UPDATE ------------ //
setInterval(updatePlayers, 1000 / 30);

// ----------- FRUITS ------------ //
createFruit();
