const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { IS_PROD } = require('./constants');

const app = express();
const http = require('http').Server(app);
const io = require("socket.io")(http, {
  transports: ["websocket"] // set to use websocket only
}); // this loads socket.io and connects it to the server.
const port = process.env.PORT || 5000;
const staticPath = path.join(__dirname, './', 'build');
const corsWhitelist = [
  'http://localhost:3000',
  'http://localhost:4000', // frontend
  'http://localhost:5000', // proxy
];
// https://www.npmjs.com/package/cors#configuration-options
const corsOptions = {
  'allowedHeaders': ['Content-Type','Authorization','Origin','Accept'],
  'exposedHeaders': ['Content-Type','Authorization','Origin','Accept'],
  'origin': function (origin, callback) {
    // Do not want to block REST tools or server-to-server requests
    // when running with `yarn dev` on localhost:4000
    if (corsWhitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  // "origin": "*",
  'methods': 'GET,POST,HEAD,OPTIONS'
};

// Enables CORS to allow queries from Website IPFS Hash to its Express API
// app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({status: err.status, message: err.message})
});
app.use(express.static(staticPath));

app.options('*', cors())
app.get('/api/test', cors(corsOptions),
  // Middleware chain
  async (req, res, next) => {
    console.log('Test');
  },
  async (req, res, next) => {
    // Handle error in async function
    try {
      const test = 'test';
      res.send({
        test,
      });
    } catch (error) {
      console.error(error);
      return;
    }
  }
);

// Incase user requests a resource not in the public folder
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

http.listen(port, () => {
   console.log(`CORS-enabled web server listening on port ${port}`);
});

//store the positions of each client in this object.
//It would be safer to connect it to a database as well so the data doesn't get destroyed when the server restarts
//but we'll just use an object for simplicity.
const gameDataPlayers = {};

//Socket configuration
io.on("connection", (socket) => {
  //each time someone visits the site and connect to socket.io this function  gets called
  //it includes the socket object from which you can get the id, useful for identifying each client
  console.log(`${socket.id} connected`);

  // lets add a starting position when the client connects
  gameDataPlayers[socket.id] = {
    x: 0.08,
    y: 1,
    chain: "",
    blocksCleared: 0,
    obstaclesHit: 0,
  };

  socket.on("disconnect", () => {
    //when this client disconnects, lets delete its position from the object.
    delete gameDataPlayers[socket.id];
    console.log(`${socket.id} disconnected`);
  });

  //client can send a message 'updatePosition' each time the clients position changes
  socket.on("updateGameDataPlayers", (data) => {
    gameDataPlayers[socket.id].x = data.x;
    gameDataPlayers[socket.id].y = data.y;
    gameDataPlayers[socket.id].chain = data.chain;
    gameDataPlayers[socket.id].blocksCleared = data.blocksCleared;
    gameDataPlayers[socket.id].obstaclesHit = data.obstaclesHit;
    console.log(`socket.on updateGameDataPlayers: ${socket.id}`, gameDataPlayers[socket.id]);
  });
});

// send gameDataPlayers every framerate to each client
const frameRate = 30;
setInterval(() => {
  io.emit("gameDataPlayers", gameDataPlayers);
}, 1000 / frameRate);
