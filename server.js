require('dotenv').config()
const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const pkg = require('./package.json');
const http = require("http");
const https = require('https');
const fs = require('fs');
const moment = require('moment');
const { IS_PROD } = require('./constants');

// https or http
let proxy_port = (process.env.WSS !== true) ? 80 : 443;
let proxy_url;
if (process.env.NODE_ENV === 'production' && process.env.WSS) {
  proxy_url = `https://flappytips.herokuapp.com:${proxy_port}`;
} else if (process.env.NODE_ENV === 'production' && process.env.WSS !== true) {
  proxy_url = `http://flappytips.herokuapp.com:${proxy_port}`;
} else if (process.env.NODE_ENV !== 'production') {
  proxy_url = pkg.proxy;
}
// const target = PROXY || pkg.proxy;

let options;
if (process.env.WSS) {
  options = {
    key: fs.readFileSync(path.resolve(__dirname, 'key-rsa.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem'))
  };
}

const app = express();

let httpServer;
if (process.env.WSS !== true) {
  // https
  httpServer = https.createServer(options, app);
} else {
  // http
  // httpServer = http.createServer(app);
  httpServer = require('http').Server(app);
}


const io = require("socket.io")(httpServer, {
  transports: ["websocket"] // set to use websocket only
}); // this loads socket.io and connects it to the server.
const PORT = process.env.PORT || 5000;
const staticPath = path.join(__dirname, './', 'build');
const corsWhitelist = [
  'http://localhost:3000',
  'http://localhost:4000', // frontend
  'http://localhost:5000', // proxy
  `http://localhost:${PORT}`, // proxy
  'http://flappytips.herokuapp.com', // http
  'https://flappytips.herokuapp.com', // https
  'http://flappytips.herokuapp.com/assets/LemonMilkMedium.otf',
  'https://flappytips.herokuapp.com/assets/LemonMilkMedium.otf'
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

app.use('/api',
  createProxyMiddleware({ 
    target: proxy_url,
    changeOrigin: true 
  }
));

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
  let ip = (req.headers['x-forwarded-for'] || '').split(',')[0];
  console.log('ip connected: ', ip);
  res.sendFile(path.join(staticPath, 'index.html'));
});

httpServer.listen(PORT, () => {
   console.log(`CORS-enabled web server listening on port ${PORT}`);
});

// store the positions of each client in this object.
// It would be safer to connect it to a database as well so the data doesn't get destroyed when the server restarts
// but we'll just use an object for simplicity.
const gameDataPlayers = {};

// Socket configuration
io.on("connection", (socket) => {
  // each time someone visits the site and connect to socket.io this function gets called.
  // it includes the socket object from which you can get the id, useful for identifying each client
  console.log(`${socket.id} connected`);

  socket.on("disconnect", () => {
    // when this client disconnects, lets delete its position from the object.
    delete gameDataPlayers[socket.id];
    console.log(`${socket.id} disconnected`);
  });

  // client can send a message each time the clients position changes
  socket.on("updateGameDataPlayers", (data) => {
    if (!data.chainAccount || !data.chain) {
      // ignore connections that haven't chosen an account id to play with 
      return;
    }

    // initialize
    if (!gameDataPlayers[socket.id]) {
      gameDataPlayers[socket.id] = {
        x: 0.08,
        y: 1,
        chain: null,
        chainAccount: null,
        chainAccountResult: null,
        gameStartRequestedAtBlock: null,
        gameEndedAtBlock: null,
        gameEndedAtTime: null,
        opponentsWhenEnded: {},
        currentBlockNumber: null,
        blocksCleared: 0,
        obstaclesHit: 0,
        obstaclesHitAt: null
      };  
    }

    gameDataPlayers[socket.id].x = data.x;
    gameDataPlayers[socket.id].y = data.y;
    gameDataPlayers[socket.id].chain = data.chain;
    gameDataPlayers[socket.id].chainAccount = data.chainAccount;
    gameDataPlayers[socket.id].chainAccountResult = data.chainAccountResult;
    gameDataPlayers[socket.id].gameStartRequestedAtBlock = data.gameStartRequestedAtBlock;
    gameDataPlayers[socket.id].gameEndedAtBlock = data.gameEndedAtBlock;
    gameDataPlayers[socket.id].gameEndedAtTime = data.gameEndedAtTime;
    gameDataPlayers[socket.id].opponentsWhenEnded = data.opponentsWhenEnded;
    gameDataPlayers[socket.id].currentBlockNumber = data.currentBlockNumber;
    gameDataPlayers[socket.id].blocksCleared = data.blocksCleared;
    gameDataPlayers[socket.id].obstaclesHit = data.obstaclesHit;
    gameDataPlayers[socket.id].obstaclesHitAt = data.obstaclesHitAt;
    console.log('data.obstaclesHitAt', data.obstaclesHitAt);
    console.log('data.chainAccountResult: ', data.chainAccountResult);

    // console.log(`socket.on updateGameDataPlayers: ${socket.id}`, gameDataPlayers[socket.id]);

    // filter only the players that started at the same block as the current player
    // where the start block is defined
    let gameDataPlayersStarted = {};
    Object.entries(gameDataPlayers).forEach((player) => {
        if (data.gameStartRequestedAtBlock && (player[1]['gameStartRequestedAtBlock'] === data.gameStartRequestedAtBlock)) {
          // delete the opponent's 'opponentsWhenEnded' property, otherwise we have too much nested unnecessary data
          delete player[1]['opponentsWhenEnded'];
          gameDataPlayersStarted[`${player[0]}`] = player[1];
        }
    });
    // console.log('gameDataPlayers: ', JSON.stringify(gameDataPlayers));
    console.log('gameDataPlayersStarted: ', JSON.stringify(gameDataPlayersStarted));

    const playerCount = Object.keys(gameDataPlayersStarted).length;
    let obstaclesHitCount = 0;

    let hasSetOpponentsWhenEnded = data.opponentsWhenEnded !== {};
    if (data.obstaclesHitAt) {
      for (const [socketId, value] of Object.entries(gameDataPlayersStarted)) {
        // check if all players have died
        if (gameDataPlayersStarted[socketId]['obstaclesHitAt']) {
          obstaclesHitCount = obstaclesHitCount + 1;
        }
      }

      if (playerCount === obstaclesHitCount) {
        console.log('all players have died hitting an object at block for start block: ', gameDataPlayersStarted[socket.id]['gameStartRequestedAtBlock'], data.currentBlockNumber);
        for (const [socketId, value] of Object.entries(gameDataPlayersStarted)) {
          if (!hasSetOpponentsWhenEnded && socketId !== socket.id && !gameDataPlayersStarted[socketId]['opponentsWhenEnded'].hasOwnProperty(socketId)) {
            gameDataPlayersStarted[socketId]['opponentsWhenEnded'][socketId] = gameDataPlayersStarted[socketId];
          }

          if (
            value.chain === data.chain &&
            gameDataPlayersStarted[socket.id]['gameStartRequestedAtBlock'] === gameDataPlayersStarted[socketId]['gameStartRequestedAtBlock'] &&
            !gameDataPlayersStarted[socketId].gameEndedAtBlock &&
            !gameDataPlayersStarted[socketId].gameEndedAtTime
          ) {
            gameDataPlayersStarted[socketId].gameEndedAtBlock = data.currentBlockNumber;
            let currentDateUnixTimestamp = moment().unix();
            console.log('currentDateUnixTimestamp: ', currentDateUnixTimestamp);
            console.log('currentDateUnixTimestamp date: ', moment.unix(currentDateUnixTimestamp).format("YYYY-MM-DD HH:mm"));
            gameDataPlayersStarted[socketId].gameEndedAtTime = currentDateUnixTimestamp;
          }
        }
      }
    }

    if (data.chainAccountResult) {
      // game already over early exit
      return;
    } else {
      // game over event to determine winner
      let winner = {
        id: null,
        obstaclesHitAt: null
      };
      // only do once all have hit an object
      // note: data.gameEndedAtBlock won't have been set until next emission to server,
      // so use gameDataPlayersStarted[socketId].gameEndedAtBlock instead
      if (data.obstaclesHitAt && gameDataPlayersStarted[socket.id].gameEndedAtBlock) {
        for (const [socketId, value] of Object.entries(gameDataPlayersStarted)) {
          // only compare with players other than the current player
          // and only those connected using the same chain
          // and only those that started the game at the same block
          if (
            socket.id !== socketId &&
            value.chain === data.chain &&
            gameDataPlayersStarted[socket.id]['gameStartRequestedAtBlock'] === gameDataPlayersStarted[socketId]['gameStartRequestedAtBlock']
          ) {
            console.log(`processing: ${socketId}: ${value}`);
            // we are in a nested if where we have already checked that player socket.id has a defined obstaclesHitAt. 
            // if there is at least one other player account socketId who has an earlier obstaclesHitAt
            // then that other player account lost in comparison with the player socket.id.
            // note: we do not declare the 'winner' here, we only assign the account address that won later on the server.
            // and determine what player to display as the winner in sketch.js.
            if (value.obstaclesHitAt && data.obstaclesHitAt > value.obstaclesHitAt) {
              // player with older timestamp of hitting obstacle is loser
              winner.id = socket.id;
              winner.obstaclesHitAt = data.obstaclesHitAt;
              gameDataPlayersStarted[socketId]['chainAccountResult'] = 'loser';
              console.log('loser: ', socketId, moment.unix(value.obstaclesHitAt).format("YYYY-MM-DD HH:mm"));
            } else if (value.obstaclesHitAt && data.obstaclesHitAt < value.obstaclesHitAt) {
              winner.id = socketId;
              winner.obstaclesHitAt = value.obstaclesHitAt;
            } else if (value.obstaclesHitAt && data.obstaclesHitAt === value.obstaclesHitAt) {
              // draw is not supported. if you do not win then you lose
              gameDataPlayersStarted[socket.id]['chainAccountResult'] = 'loser';
              gameDataPlayersStarted[socketId]['chainAccountResult'] = 'loser';
              console.log('draw: ', socket.id, moment.unix(data.obstaclesHitAt).format("YYYY-MM-DD HH:mm"));
              console.log('draw: ', socketId, moment.unix(value.obstaclesHitAt).format("YYYY-MM-DD HH:mm"));
            }
          }
        }
        if (winner.id === socket.id && gameDataPlayersStarted[winner.id]['blocksCleared'] > 0) {
          gameDataPlayersStarted[winner.id]['chainAccountResult'] = gameDataPlayersStarted[winner.id].chainAccount;
          console.log('winner: ', winner.id, moment.unix(winner.obstaclesHitAt).format("YYYY-MM-DD HH:mm"));
        } else if (winner.id && winner.id !== socket.id) {
          gameDataPlayersStarted[winner.id]['chainAccountResult'] = gameDataPlayersStarted[winner.id].chainAccount;
          console.log('winner: ', winner.id, moment.unix(winner.obstaclesHitAt).format("YYYY-MM-DD HH:mm"));
          // haven't set the current player result previously
          gameDataPlayersStarted[socket.id]['chainAccountResult'] = 'loser';
        } else {
          console.log('no winner');
          // haven't set the current player result previously
          gameDataPlayersStarted[socket.id]['chainAccountResult'] = 'loser';
        }
      }
    }

    console.log('finished processing: ', gameDataPlayersStarted);
  });
});

// send gameDataPlayers every framerate to each client
const frameRate = 30;
setInterval(() => {
  io.emit("gameDataPlayers", gameDataPlayers);
}, 1000 / frameRate);
