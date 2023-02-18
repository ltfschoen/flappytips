// below also need updating in in ./constants/index.js for frontend
const HOST_PROD = '139.144.96.196';
const IS_PROD = process.env.NODE_ENV === 'production';
const WSS = true; 

module.exports = {
  HOST_PROD,
  IS_PROD,
  WSS
};
