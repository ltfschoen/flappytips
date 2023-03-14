require('dotenv').config()
import bodyParser from 'body-parser';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import https from 'https';
import fs from 'fs';
import moment from 'moment';
import { game } from '_game/index'; // babel alias

const {
  NODE_ENV,
  REACT_APP_HOST_PROD,
  REACT_APP_IS_REVERSE_PROXY,
  REACT_APP_SERVER_PORT,
  REACT_APP_WSS,
} = process.env;

// import {
//   fetchOracleAndLeaderboardContracts, 
//   submitGameWinnerToContract,
//   submitOracleOutcomeToZeitgeist
// } from '../scripts/fetchOracleAndLeaderboardContracts.js';

console.log('server env: ', REACT_APP_HOST_PROD, REACT_APP_IS_REVERSE_PROXY, REACT_APP_WSS, REACT_APP_SERVER_PORT);
// https or http
let proxy_port = REACT_APP_SERVER_PORT; //= (REACT_APP_WSS !== true) ? 80 : 443;
let proxy_url;
if (process.env.NODE_ENV === 'production' && REACT_APP_WSS === 'true') {
  proxy_url = `https://clawbird.com:5000`;
} else if (process.env.NODE_ENV === 'production' && REACT_APP_WSS !== 'true') {
  proxy_url = `http://${REACT_APP_HOST_PROD}:${proxy_port}`;
} else if (process.env.NODE_ENV !== 'production' && REACT_APP_WSS === 'true') {
  proxy_url = `https://localhost:5000`;
} else if (process.env.NODE_ENV !== 'production' && REACT_APP_WSS !== 'true') {
  proxy_url = `http://localhost:5000`;
}
// const target = PROXY || pkg.proxy;
console.log('proxy_url: ', proxy_url);
let options;
if (REACT_APP_WSS === 'true') {
  options = {
    // https://socket.io/docs/v4/client-options/#nodejs-specific-options
    //
    // Self-sign
    // key: fs.readFileSync(path.resolve(__dirname, 'key-rsa.pem')),
    // cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
    //
    // Positive SSL
    // key: fs.readFileSync(path.resolve('/root/certs/clawbird.com/positivessl/clawbird.com.key')),
    // cert: fs.readFileSync(path.resolve('/root/certs/clawbird.com/positivessl/clawbird.com.combined.crt')),
    //requestCert: true,
    //ca: [
    //  fs.readFileSync(path.resolve('/root/certs/clawbird.com/positivessl/clawbird.com.combined.crt')),
    //],
    //
    // Let's Encrypt
    key: fs.readFileSync(path.resolve('/etc/letsencrypt/live/www.clawbird.com/privkey.pem')),
    cert: fs.readFileSync(path.resolve('/etc/letsencrypt/live/www.clawbird.com/fullchain.pem')),
    //requestCert: true,
    //ca: [
    //  fs.readFileSync(path.resolve('/etc/letsencrypt/live/www.clawbird.com/cert.pem')),
    //],
  };
}

const app = express();

let httpServer;
if (REACT_APP_WSS === 'true') {
  // https
  httpServer = https.createServer(options, app);
} else {
  // http
  // httpServer = http.createServer(app);
  httpServer = require('http').Server(app);
}

let httpServerOptions;

httpServerOptions = {
  transports: ["websocket"], // set to use websocket only
  cors: {
    origin: proxy_url,
    credentials: REACT_APP_WSS === 'true',
  }
};

if (REACT_APP_IS_REVERSE_PROXY === 'false') {
  httpServerOptions["path"] = "/socket.io/"; // explicitly set custom path (default)
}

const io = require("socket.io")(httpServer, httpServerOptions); // this loads socket.io and connects it to the server.
const staticPath = path.join(__dirname, '../', 'public');
const corsWhitelist = [
  'http://0.0.0.0:5000',
  'https://0.0.0.0:443',
  `https://${REACT_APP_HOST_PROD}:443`,
  `http://${REACT_APP_HOST_PROD}:80`,
  `https://${REACT_APP_HOST_PROD}:5000`,
  `http://${REACT_APP_HOST_PROD}:4000`,
  `http://${REACT_APP_HOST_PROD}:5000`,
  'https://clawbird.com:443',
  'https://clawbird.com:5000',
  'http://localhost:3000',
  'http://localhost:4000', // frontend
  'http://localhost:5000', // proxy
  `http://localhost:${REACT_APP_SERVER_PORT}`, // proxy
  'https://localhost:5000',
  'https://localhost:443',
  `http://${REACT_APP_HOST_PROD}`, // http
  `https://${REACT_APP_HOST_PROD}`, // https
  `http://${REACT_APP_HOST_PROD}/assets/LemonMilkMedium.otf`,
  `https://${REACT_APP_HOST_PROD}/assets/LemonMilkMedium.otf`,
  'http://clawbird.com', // http
  'https://clawbird.com', // https
  'http://clawbird.com/assets/LemonMilkMedium.otf',
  'https://clawbird.com/assets/LemonMilkMedium.otf'
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

let wsProxy;

if (REACT_APP_IS_REVERSE_PROXY === 'true') {
  wsProxy = createProxyMiddleware({
    target: proxy_url,
    changeOrigin: true, // for vhosted sites, changes host header to match to target's host
    ws: true, // enable websocket proxy
    logger: console,
  });

  // https://www.npmjs.com/package/http-proxy-middleware#external-websocket-upgrade
  // add the proxy to express
  app.use('/socket.io/', wsProxy);
}

app.use(express.static(staticPath));

app.options('*', cors())
app.get('/api/test', cors(corsOptions),
  // Middleware chain
  async (req, res, next) => {
    // console.log('Test');
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
  // console.log('ip connected: ', ip);
  res.sendFile(path.join(staticPath, 'index.html'));
});

httpServer.listen(
  REACT_APP_SERVER_PORT,
  NODE_ENV === 'production' ? REACT_APP_HOST_PROD : '0.0.0.0',
);
//httpServer.listen(REACT_APP_SERVER_PORT, () => {
//   // console.log(`CORS-enabled web server listening on port ${REACT_APP_SERVER_PORT}`);
//});

if (REACT_APP_IS_REVERSE_PROXY === 'true' && wsProxy) {
  // https://github.com/chimurai/http-proxy-middleware/blob/master/examples/websocket/index.js
  // TODO - when uncommented it gives browser ws error "invalid frame header"
  // httpServer.on('upgrade', wsProxy.upgrade); // optional: upgrade externally
}

game(io);

export default app;
