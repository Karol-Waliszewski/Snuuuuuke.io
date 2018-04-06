<template lang="html">
  <transition name="fade">
    <div v-if="logged" ref="containerGame" class="container" key="game">

      <div class="wrapper">

        <div class="sidebar">
          <h1 class="sidebar__title">Snuuuuke.io</h1>

          <div class="scoreboard">
            <h3 class="scoreboard__header">Online Players</h3>
            <ul class="scoreboard__list">
              <li v-for="snake in points" class="scoreboard__player">
                <span class="scoreboard__player--nick">{{snake.nick}}: </span>
                <span class="scoreboard__player--points">{{snake.points}}</span>
              </li>
            </ul>
          </div>

          <button class="btn--connection" type="button" @click="disconnect">
            Disconnect
          </button>
        </div>

        <div class="gameboard">
          <canvas ref="mainGame" width="1150" height="750"></canvas>
        </div>

      </div>

    </div>
      <div v-else class="container" key="start">
        <h1 class="start__title">Snuuuuke.io</h1>
        <div class="start__login">
          <label class="start__nick--label" for="nick">Nick</label>
          <input class="start__nick--input" id="nick" type="text" placeholder="Enter your nickname" v-model="player.nick">
          <hr class="start__nick--line">
          <br>
          <label class="start__colors--label">Colors</label>
          <div class="start__colors">
            <button v-for="color in colors" v-if="color != player.color" class="btn--color" @click="updateColor" :style="{background:color}" :value="color" type="button"></button>
            <button v-else class="btn--color" @click="updateColor" :style="{background:color,outline: '2px solid #34495e'}" :value="color" type="button"></button>
          </div>
          <button type="button" class="btn--connection" @click="connect">Connect</button>
          <p class="start__alert" v-if="lost">You Lost!</p>
          <p class="start__alert" v-if="error">{{error}}</p>
        </div>

      </div>
  </transition>
</template>

<script>
export default {
	data() {
		return {
			logged: false,
			lost: false,
			ctx: null,
			socket: null,
			error: null,
			fruits: [],
			snakes: [],
			points: [],
			colors: [],
			player: {
				nick: '',
				color: '',
				id: null,
				x: null,
				y: null,
				tail: null,
			}
		}
	},
	methods: {
		connect() {
			if (this.player.nick.length > 0 && this.player.color.length == 7) {
				// Resets flags
				this.lost = false;
				this.error = null;

				// Sets logged to true
				this.logged = true;

				this.$nextTick(function() {
					// Init canvas
					this.initCanvas();

					// Init socket
					this.socket = io();

					// Init player
					this.socket.on('connect', () => {
						this.player.id = this.socket.id;

						this.socket.emit('Join Game', {
							nick: this.player.nick,
							color: this.player.color
						});
					});

					// Event Listeners
					let vm = this;
					document.addEventListener('keydown', vm.changeDirection);
					swipedetect(this.$refs['mainGame'], vm.changeDirection);
					this.socket.on('Update Players', vm.updateSnakes);
					this.socket.on('Update Players', vm.tick);
					this.socket.on('Update Fruits', vm.updateFruits);
					this.socket.on('Update Points', vm.updatePoints);
					this.socket.on('Game Lost', vm.disconnect);
					this.socket.on('Game Lost', function() {
						vm.lost = true;
					});
				});
			} else {
				this.error = "Choose your nickname and colour";
			}
		},
		disconnect() {
			this.socket.emit('Leave Game');
			this.logged = false;
			this.socket = null;
			this.ctx = null;
			this.getColors();
		},
		initCanvas() {

			// Getting and initing canvas
			var canvas = this.$refs['mainGame'];
			this.ctx = canvas.getContext('2d');

			// Setting Canvas Background
			this.ctx.setBackground = (color) => {
				this.ctx.fillStyle = color;
				this.ctx.fillRect(0, 0, canvas.width, canvas.height)
			}

			// Clearing canvas
			this.ctx.clearCanvas = () => {
				this.ctx.clearRect(0, 0, canvas.width, canvas.height);
				this.ctx.setBackground('#040608');
			};

		},
		updateColor(event) {
			this.player.color = event.target.value;
		},
		getRandomColor() {
			var letters = '0123456789ABCDEF';
			var color = '#';
			for (var i = 0; i < 6; i++) {
				color += letters[Math.floor(Math.random() * 16)];
			}
			return color;
		},
		getColors() {
			this.colors = [];
			for (let i = 0; i < 12; i++)
				this.colors.push(this.getRandomColor());
		},
		changeDirection(e) {
			if (this.logged) {
				let keycode;
				if (typeof e.keyCode != 'undefined')
					keycode = e.keyCode;
				else if (e == 'left')
					keycode = 37;
				else if (e == 'right')
					keycode = 39;
				else if (e == 'up')
					keycode = 38;
				else if (e == 'down')
					keycode = 40;
				this.socket.emit('Change Direction', keycode);
			}
		},
		updateFruits(data) {
			this.fruits = data;
		},
		updatePoints(data) {
			this.points = data;
		},
		updateSnakes(data) {
			this.snakes = data;
			let updatedPlayer = data.find((snake) => {
				return snake.id == this.player.id;
			})
			for (let prop in updatedPlayer) {
				this.player[prop] = updatedPlayer[prop];
			}
		},
		draw(obj) {

			if (obj.hasOwnProperty('nick')) {
				this.ctx.fillStyle = '#ffffff';
				this.ctx.textAlign = "center";
				this.ctx.font = '16px Open Sans';
				if (obj.tail[0].y < obj.y)
					this.ctx.fillText(obj.nick, obj.x + 20 / 2, obj.y + 20 * 2);
				else
					this.ctx.fillText(obj.nick, obj.x + 20 / 2, obj.y - 20 / 2);
			}
			this.ctx.fillStyle = obj.color;
			if (obj.hasOwnProperty('size'))
				this.ctx.fillRect(obj.x, obj.y, obj.size, obj.size);
			else
				this.ctx.fillRect(obj.x, obj.y, 20, 20);
		},
		drawObjects() {
			// Drawing players
			for (let snake of this.snakes) {
				this.draw(snake);
				for (let tail of snake.tail) {
					if (tail.x != null && tail.y != null) {
						this.draw(tail);
					}
				}
			}
			// Drawing fruits
			for (let fruit of this.fruits) {
				this.draw(fruit);
			}
		},
		tick() {
			if (this.logged) {
				// Clearing the gameboard
				this.ctx.clearCanvas();
				// Drawing Background
				this.ctx.setBackground('#040608');
				// Drawing all entities
				this.drawObjects();
			}
		}
	},
	created() {
		this.getColors();
	}
}
</script>

<style lang="css">
</style>
