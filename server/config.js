const path = require('path');

var OPTIONS = {
  SnakeSize: 20,
  Canvas: {
    width: 1150,
    height: 750
  },
  vueOptions: {
    rootPath: path.join(__dirname, './views'),
    layout: {
      start: '<div id="app">',
      end: '</div>'
    },
    vue: {
      head: {
        title: 'Snuuuuke.io',
        meta: [{
            name: 'application-name',
            content: 'Snuuuuke.io'
          },
          {
            name: 'description',
            content: 'Play snuuuuke.io with our friends in real tim!',
            id: 'snuuuuke'
          },
          {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1'
          },
          {
            script: 'js/swipedetect.js'
          },
          {
            script: 'https://unpkg.com/vue'
          },
          {
            script: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.slim.js'
          },
          {
            style: 'css/style.css'
          },
        ]
      }
    }
  }
}


module.exports = OPTIONS;
