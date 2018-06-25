// Requirements
const express = require('express');
const socketio = require('socket.io');
const expressVue = require('express-vue');
const _ = require('lodash');
const CONFIG = require('./server/config');
const Snake = require('./server/objects/snake');
const Fruit = require('./server/objects/fruit');

// Variables
const snakes = [],
  fruits = [];

// Init app
const app = express();

// Init server
const server = require('http').createServer(app);
server.listen(process.env.PORT || 4000);
console.log('Snuuuuke.io is running on port: 4000');

// Init socket
const io = socketio.listen(server);

// Init static files
app.use(express.static('client'));

// Init Vue Middleware
const expressVueMiddleware = expressVue.init(CONFIG.vueOptions);
app.use(expressVueMiddleware);

// Main index
app.get('/', function(req, res) {
  res.renderVue('index');
});

// Functions
function FindSnake(id) {
  let searchedSnake = snakes.find(function(snake) {
    return snake.id == id;
  });
  if (searchedSnake) return searchedSnake;
  else return false;
}

const updatePlayers = function() {
  for (snake of snakes) {
    snake.move();
  }
  let data = snakes.map(function(s) {
    return {
      x: s.x,
      y: s.y,
      color: s.color,
      nick: s.nick,
      tail: s.tail
    }
  });
  checkObjectsCollison();
  io.to('Game Room').emit('Update Players', snakes);
}

const updatePoints = function() {
  let points = snakes.map(function(snake) {
    return {
      nick: snake.nick,
      points: snake.points
    };
  });
  points = _.orderBy(points, 'points');
  points = points.reverse();
  io.to('Game Room').emit('Update Points', points);
}

const checkColision = function(obj1, obj2) {
  if (obj1.hasOwnProperty('size'))
    return obj1.x < obj2.x + 20 && obj2.x < obj1.x + obj1.size && obj1.y < obj2.y + 20 && obj2.y < obj1.y + obj1.size;
  else if (obj2.hasOwnProperty('size'))
    return obj1.x < obj2.x + obj2.size && obj2.x < obj1.x + 20 && obj1.y < obj2.y + obj2.size && obj2.y < obj1.y + 20;
  else
    return obj1.x < obj2.x + 20 && obj2.x < obj1.x + 20 && obj1.y < obj2.y + 20 && obj2.y < obj1.y + 20;
}

const checkObjectsCollison = function() {
  for (let player of snakes) {
    for (let fruit of fruits) {
      if (checkColision(player, fruit)) {
        player.points += fruit.size / 10;
        player.addTail(Math.round(fruit.size / player.speed));
        updatePoints();
        fruits.splice(fruits.indexOf(fruit), 1);

        // Emiting update to clients
        io.to('Game Room').emit('Update Fruits', fruits);
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
          // snake.startLength + snake.speed + 1
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
        leave(player.id)
      }
    }
  }
}

const createFruit = function() {
  // Server creates fruit provided that there is not already 10 on the gameboard
  if (fruits.length < 15) {
    // Creates new Fruit object
    let f = new Fruit();
    fruits.push(f);

    // Emiting update to clients
    io.to('Game Room').emit('Update Fruits', fruits)
  }
}

const leave = function(id) {
  let s = FindSnake(id);
  if (s) {
    snakes.splice(snakes.indexOf(s), 1);
  }
  updatePoints();
}

// SOCKET.IO
io.on('connection', function(socket) {

  // Connected
  console.log(`Connected: ${socket.id}`);

  // Disconnected
  socket.on('disconnect', function() {
    console.log(`Disconnected: ${socket.id}`);
    leave(socket.id);
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
    io.to(socket.id).emit('Update Fruits', fruits);
    // Loading Points
    updatePoints();
  });

  // Leave Game
  socket.on('Leave Game', function() {
    console.log(`Left Game: ${socket.id}`);
    leave(socket.id);
  });

  socket.on('Change Direction', function(key) {
    let searchedSnake = FindSnake(socket.id);
    if (searchedSnake) {
      searchedSnake.changeDirection(key);
    }
  });

  socket.on('Fruit Eaten', function(f) {
    let searchedFruit = fruits.find(function(fruit) {
      return fruit.x == f.x && fruit.y == f.y;
    });
    if (searchedFruit) {
      fruits.splice(fruits.indexOf(searchedFruit), 1);

      // Emiting update to clients
      io.to('Game Room').emit('Update Fruits', fruits);
    }
  });
});

// ----------- UPDATE ------------ //
setInterval(updatePlayers, 1000 / 60);

// ----------- FRUITS ------------ //
setInterval(createFruit, 4000);
