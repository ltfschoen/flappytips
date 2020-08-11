import axios from "axios";

const getCurrentBlockInfo = async (currentEndpoint) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${currentEndpoint}/dbs/network_status.json`,
        { headers: { 'Accept': 'application/json' }}
      )
      .then((response) => {
        if (!response && response.status !== 200) {
          console.error('Unable to connect to Sia');

          resolve({ 
            currentBlockNumber: '',
            currentBlockTimestamp: null
          });
        }
        console.log('Response from fetching network status: ', response);

        console.log('Received Sia network status');
        let currentBlockNumber, currentBlockTimestamp;
        if (response && response.data) {
          currentBlockNumber = response.data.block_height;
          currentBlockTimestamp = parseInt(response.data.block_timestamp);
        } else {
          currentBlockNumber = '';
          currentBlockTimestamp = null;
        }

        console.log('Sia current block number', currentBlockNumber);
        console.log('Sia current block timestamp', currentBlockTimestamp);

        resolve({ 
          currentBlockNumber,
          currentBlockTimestamp
        });
      })
      .catch((error) => {
        console.error('Error fetching network status: ', error);
        reject(error);
      });
  });
}

const getPreviousBlockInfo = async (currentEndpoint) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${currentEndpoint}/dbs/stats24h.json`,
        { headers: { 'Accept': 'application/json' }}
      )
      .then((response) => {
        if (!response && response.status !== 200) {
          console.error('Unable to connect to Sia');

          resolve({
            previousBlockNumber: '',
            previousBlockTimestamp: null
          });
        }
        console.log('Response from fetching network 24 hr stats: ', response);

        console.log('Received Sia network 24 hr stats');
        let previousBlockNumber, previousBlockTimestamp;
        if (response && response.data.length) {
          // Second last element contains the previous block information
          const lastElement = response.data.length - 2;
          previousBlockNumber = response.data[lastElement].height;
          previousBlockTimestamp = parseInt(response.data[lastElement].timestamp);
        } else {
          previousBlockNumber = '';
          previousBlockTimestamp = null;
        }

        console.log('Sia previous block number', previousBlockNumber);
        console.log('Sia previous block timestamp', previousBlockTimestamp);

        resolve({
          previousBlockNumber,
          previousBlockTimestamp
        });
      })
      .catch((error) => {
        console.error('Error fetching network 24 hr stats: ', error);
        reject(error);
      });
  });
}

export {
  getCurrentBlockInfo,
  getPreviousBlockInfo
}
