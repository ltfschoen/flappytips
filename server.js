const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { IS_PROD } = require('./constants');

const app = express();
const port = process.env.PORT || 5000;
const staticPath = path.join(__dirname, './', 'build');
const corsWhitelist = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://ipfs.io',
  'https://siasky.net'
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

app.listen(port, () => {
   console.log(`CORS-enabled web server listening on port ${port}`);
});
