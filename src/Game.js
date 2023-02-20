import React, { Component } from 'react';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import { isMobile } from "react-device-detect";
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress, web3ListRpcProviders, web3UseRpcProvider } from '@polkadot/extension-dapp';
import { bufferToU8a, u8aToBuffer, u8aToString, stringToU8a, u8aToHex } from '@polkadot/util';
import { TwitterShareButton } from 'react-twitter-embed';
import { Alert, Button } from "react-bootstrap";
// import Input from "react-bootstrap/Input";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import pkg from '../package.json';
import sketch from './sketches/sketch';
import { ENDPOINTS } from './constants';
import merge from './helpers/merge';
import moment from 'moment';

class Game extends Component {
  constructor(){
    super();
    this.state = {
      api: undefined,
      accountAddress: undefined,
      activeAccountIds: {},
      blocksCleared: 0,
      chain: '',
      chainAccountResult: '',
      chainAccount: '',
      clearedOldSocketsOpponents: false,
      currentBlockNumber: '',
      currentBlockTimestamp: null,
      previousBlockNumber: '',
      previousBlockTimestamp: null,
      currentEndpoint: '',
      currentEndpointName: '',
      errorMessage: '',
      currentBlockHash: '',
      gameStartRequestedAtBlock: '',
      gameEndedAtBlock: '',
      gameEndedAtTime: '',
      currentBlockAuthors: [],
      extensionAllInjected: '',
      extensionAllAccountsList: [],
      innerHeight: 0,
      innerWidth: 0,
      isGameStart: false,
      parentBlockHash: '',
      birdColor: 255,
      provider: undefined,
      keyring: undefined,
      reason: '',
      showModal: false,
      showModalChain: false,
      showModalMobile: isMobile,
      deviceOrientation: undefined,
      ipData: {},
      opponents: {},
      opponentsWhenEnded: {},
    };

    this.twitterHandle = React.createRef();
    this.mnemonicSeed = React.createRef();
    this.chainAccount = React.createRef();
    this.customEndpoint = React.createRef();
    this.tweet = React.createRef();
  }

  async componentDidMount() {
    // console.log(`FlappyTips 2 v${pkg.version}`);

    this.getDimensions();
    this.getIpData();

    let initialChainAccount;
    let allInjected;
    let allAccounts = [];

    if (!isMobile) {
      // Returns an array of all the injected sources
      allInjected = await web3Enable('FlappyTips');
      allInjected = allInjected.map(({ name, version }) => `${name} ${version}`);
      // console.log('allInjected: ', allInjected);

      // returns an array of { address, meta: { name, source } }
      // meta.source contains the name of the extension that provides this account
      allAccounts = await web3Accounts();
      // console.log('allAccounts orig: ', allAccounts);
      // let allAccountsList = [];
      // allAccounts = allAccounts.map(({ address }) => allAccountsList.push(`${address}`));
      // console.log('allAccounts', allAccountsList);

      initialChainAccount = allAccounts.length !== 0 && allAccounts[0].address;
    }

    // initialise value of the ref
    this.chainAccount.current = initialChainAccount || 'DEMO-MOBILE';
    // console.log('set this.chainAccount.current: ', this.chainAccount.current);

    const initialEndpointName = 'Zeitgeist Mainnet';
    const initialEndpoint = ENDPOINTS['Zeitgeist Mainnet'].url;
    this.customEndpoint.current = initialEndpoint;

    this.setState({
      currentEndpoint: initialEndpoint,
      currentEndpointName: initialEndpointName,
      extensionNotInstalled: !allInjected || allInjected.length === 0,
      extensionAllInjected: allInjected,
      extensionAllAccountsList: allAccounts,
      chainAccount: this.chainAccount.current,
      showModalChain: true
    });

    window.addEventListener('resize', this.getDimensions);

    this.setup(initialEndpoint, initialEndpointName);
  }

  getDimensions = () => {
    const deviceOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    this.setState({
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      deviceOrientation: deviceOrientation
    });
  }

  shouldComponentUpdate(nextProps){
    return true;
  }

  componentDidUpdate(prevProps){
    const val = this.chainAccount && this.chainAccount.current && this.chainAccount.current.value;
    // // note: this may not be required
    // if (val && prevProps.chainAccount && prevProps.chainAccount !== val) {
    //   console.log('componentDidUpdate updating chainAccount: ', val, prevProps.chainAccount);
    //   this.setState({          
    //     chainAccount: val
    //   });
    // }

    if (prevProps.chainAccountResult !== this.props.chainAccountResult){
      this.setState({          
        chainAccountResult: this.props.chainAccountResult
      });
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
    window.removeEventListener('resize', this.getDimensions);
  }

  getIpData = async () => {
    // const response = await fetch('https://ipapi.co/json/');
    // const data = await response.json();
    // this.setState({
    //   ipData: data
    // });
  }

  setupTempApi = async (customEndpoint, customEndpointName) => {
    let currentEndpoint = customEndpoint;
    let currentEndpointName = customEndpointName;

    const provider = new WsProvider(currentEndpoint);
    // Create a keyring instance. https://polkadot.js.org/api/start/keyring.html
    const keyring = new Keyring({ type: 'sr25519' });
    let types;
    let api;
    api = await ApiPromise.create({ provider });
  
    return { provider, keyring, types, api };
  }  

  setupApi = async (customEndpoint, customEndpointName) => {
    let currentEndpoint = customEndpoint;
    let currentEndpointName = customEndpointName;

    const provider = new WsProvider(currentEndpoint);
    // Create a keyring instance. https://polkadot.js.org/api/start/keyring.html
    const keyring = new Keyring({ type: 'sr25519' });
    let types;
    let api;
    api = await ApiPromise.create({ provider });

    this.setState({
      api
    });
  
    return { provider, keyring, types, api };
  }

  setup = async (customEndpoint, customEndpointName) => {
    // // IMPORTANT: This does not appear to work so we've used @polkadot-js/api's WsProvider instead
    // // retrieve all the RPC providers from a particular source
    // const allProviders = await web3ListRpcProviders('polkadot-js');
    // console.log('allProviders', allProviders)
    // // assuming one of the keys in `allProviders` is 'kusama-cc3', we can then use that provider
    // const { provider } = web3UseRpcProvider('polkadot-js', 'kusama-cc3');

    let currentEndpoint = customEndpoint;
    let currentEndpointName = customEndpointName;
    // Fallback to default chains if necessary
    if (!customEndpoint) {
      currentEndpoint = ENDPOINTS['Zeitgeist Mainnet'].url;
      currentEndpointName = 'Zeitgeist Mainnet';
    }

    let chain, nodeName, nodeVersion;
    let { provider, keyring, types, api } = await this.setupApi(currentEndpoint, currentEndpointName);

    [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]);
    await api.rpc.chain.subscribeNewHeads(async (header) => {
      let currentBlockNumber = header.number.toString();
      let parentBlockHash = header.parentHash.toString();

      // const [blockHash, validators] = await Promise.all([
      //   api.rpc.chain.getBlockHash(currentBlockNumber),
      //   api.query.session.validators()
      // ]);
      const [blockHash] = await Promise.all([
        api.rpc.chain.getBlockHash(currentBlockNumber),
      ]);
      let currentBlockHash = blockHash.toString();

      // FIXME - triggers error on Kusama:
      // Unable to decode Vec on index 3 createType(ExtrinsicV4):: createType(Call):: Struct: failed on 'args':: Bytes: required length less than remainder, expected at least 324453603, found 512
      // RPC-CORE: getBlock(hash?: BlockHash): SignedBlock:: createType(SignedBlock):: Struct: failed on 'block':: Struct: failed on 'extrinsics':: createType(ExtrinsicV4):: createType(Call):: Struct: failed on 'args':: Bytes: required length less than remainder, expected at least 324453603, found 512

      // const [signedBlock] = await Promise.all([
      //   api.rpc.chain.getBlock(blockHash)
      // ]);
      // console.log('signedBlock', signedBlock);
      // console.log('signedBlock', signedBlock.block.header.parentHash.toHex());
      // console.log('signedBlock number', signedBlock.block.header.number.toString());

      // // Hash for each extrinsic in the block
      // signedBlock.block.extrinsics.forEach((ex, index) => {
      //   console.log('Hash for extrinsic in the block', index, ex.hash.toHex());
      //   // FIXME
      //   console.log('Hash for extrinsic in the block', index, bufferToU8a(ex.data.buffer).toHex());
      //   // console.log('Hash for extrinsic in the block', index, u8aToString(bufferToU8a(ex.data)));
      // });

      // Digest of current block
      const [currentDigest] = await Promise.all([
        api.query.system.digest() 
      ]);
      // console.log('currentDigest', currentDigest);

      // Extrinsic data
      const [extrinsicData] = await Promise.all([
        api.query.system.extrinsicData(header.number) 
      ]);
      // console.log('extrinsicData', extrinsicData);

      // // ExtrinsicsRoot
      // const [extrinsicsRoot] = await Promise.all([
      //   api.query.system.extrinsicsRoot() 
      // ]);
      // FIXME - not working anymore
      // console.log('extrinsicsRoot', extrinsicsRoot.toString());

      // Event topics
      const [eventTopics] = await Promise.all([
        api.query.system.eventTopics(currentBlockHash) 
      ]);
      // console.log('eventTopics', eventTopics);

      const { activeAccountIds } = this.state;
      let newActiveAccountIds = activeAccountIds;

      // TODO - https://polkadot.js.org/docs/api/cookbook/blocks#how-do-i-map-extrinsics-to-their-events
      let [currentBlockEvents] = [];
      [currentBlockEvents] = await Promise.all([
        api.query.system.events.at(currentBlockHash) 
      ]);

      // console.log('currentBlockEvents', currentBlockEvents);
      if (currentBlockEvents.length) {
        // console.log(`\nReceived ${currentBlockEvents.length} events:`);
      }

      // TODO - fix this
      // let foundAccountIds = {};
      // currentBlockEvents.forEach((record) => {
      //   const { event, phase } = record;
      //   const types = event.typeDef;

      //   console.log('Event record: ', record);
      //   console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
      //   console.log(`\t\t${event.meta.documentation.toString()}`);

      //   event.data.forEach((data, index) => {
      //     console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
      //     console.log('types[index].type: ', types[index].type, typeof types[index].type, types[index].type === 'AccountId');
      //     if (types[index].type === 'AccountId') {
      //       activeAccountIds.hasOwnProperty(data.toString()) ? foundAccountIds[data.toString()] += 1 : foundAccountIds[data.toString()] = 1;
      //     }
      //     console.log('foundAccountIds: ', foundAccountIds);
      //   });
      //   if (foundAccountIds.length !== 0) {
      //     newActiveAccountIds = merge(activeAccountIds, foundAccountIds);
      //   }
      //   // FIXME - its getting the validators account id that authored the block, but i want the account id that
      //   // sent the Deposit extrinsic instead
      //   console.log('newActiveAccountIds: ', newActiveAccountIds);
      // });

      let currentBlockAuthors = [];
      // FIXME - Game.js:125 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'validators')
      // currentBlockAuthors = validators && validators.map((item, index) => item.toString());

      this.handleReceiveNewHead(
        currentBlockNumber, '', '',
        '', [], currentBlockHash, currentBlockAuthors,
        parentBlockHash, newActiveAccountIds
      );
    });

    this.setState({
      chain: chain.toString(),
      currentEndpoint,
      currentEndpointName,
      api,
      keyring,
      provider: provider || '',
      // showModalChain: false,
      // showModalMobile: false
    });
  }

  handleReceiveNewHead = async (currentBlockNumber, currentBlockTimestamp, previousBlockNumber,
    previousBlockTimestamp, currentBlockHash, currentBlockAuthors, parentBlockHash, newActiveAccountIds
  ) => {
    const { gameStartRequestedAtBlock } = this.state;
    previousBlockNumber = previousBlockNumber !== '' ? previousBlockNumber : this.state.currentBlockNumber;

    if (gameStartRequestedAtBlock && currentBlockNumber) {
      if (currentBlockNumber === gameStartRequestedAtBlock) {
        // starting the game for the current player
        this.closeModalChainWindow();
        this.closeModalMobile();
      }
    }

    this.setState({
      currentBlockNumber: currentBlockNumber || '',
      currentBlockTimestamp: currentBlockTimestamp || null,
      previousBlockNumber: previousBlockNumber || '',
      previousBlockTimestamp: previousBlockTimestamp || null,
      currentBlockHash: currentBlockHash || '',
      currentBlockAuthors: currentBlockAuthors || [],
      parentBlockHash: parentBlockHash || '',
      activeAccountIds: newActiveAccountIds || {}
    });
  }

  randomColor = () => {
    this.setState({ birdColor: [Math.random()*255, Math.random()*255, Math.random()*255] })
  }

  gameOver = (blocksCleared) => {
    const { currentEndpointName, chainAccount, chainAccountResult, gameStartRequestedAtBlock, gameEndedAtBlock, opponentsWhenEnded } = this.state;
    const reason = `Played FlappyTips v${pkg.version} (${isMobile ? 'Mobile' : 'Desktop'}) @ https://clawbird.com on ${currentEndpointName} and ${chainAccountResult === chainAccount ? 'you won,' : 'you lost,'} against ${Object.keys(opponentsWhenEnded).length} opponents, clearing ${Number.parseFloat(blocksCleared).toFixed(0)} block obstacles from #${gameStartRequestedAtBlock} to #${gameEndedAtBlock}!`;
    this.setState({
      blocksCleared,
      isGameOver: true,
      reason
    })
  }

  updatePlayerFromSockets = (playerData) => {
    const { chainAccountResult, gameEndedAtBlock, gameEndedAtTime, opponents, opponentsWhenEnded } = this.state;
    // note that chainAccountResult is assigned with the chainAccount value on the server,
    // but when transferred to frontend it's assigned to 'winner', so it only happens once
    if (chainAccountResult !== 'winner') {
      if (playerData.chainAccountResult === this.state.chainAccount) {
        this.setState({
          chainAccountResult: this.state.chainAccount,
          gameEndedAtBlock: gameEndedAtBlock !== playerData.gameEndedAtBlock ? playerData.gameEndedAtBlock : gameEndedAtBlock,
          gameEndedAtTime: gameEndedAtTime !== playerData.gameEndedAtTime ? playerData.gameEndedAtTime : gameEndedAtTime,
          opponentsWhenEnded: gameEndedAtTime !== playerData.gameEndedAtTime ? opponentsWhenEnded : opponents 
        })
      // draw or lose
      } else {
        this.setState({
          chainAccountResult: (
            playerData.chainAccountResult !== chainAccountResult
          ) ? playerData.chainAccountResult : chainAccountResult,
          gameEndedAtBlock: gameEndedAtBlock !== playerData.gameEndedAtBlock ? playerData.gameEndedAtBlock : gameEndedAtBlock,
          gameEndedAtTime: gameEndedAtTime !== playerData.gameEndedAtTime ? playerData.gameEndedAtTime : gameEndedAtTime,
          opponentsWhenEnded: gameEndedAtTime !== playerData.gameEndedAtTime ? opponentsWhenEnded : opponents
        })
      }
    }

    this.setState({
      gameEndedAtBlock: gameEndedAtBlock !== playerData.gameEndedAtBlock ? playerData.gameEndedAtBlock : gameEndedAtBlock,
      gameEndedAtTime: gameEndedAtTime !== playerData.gameEndedAtTime ? playerData.gameEndedAtTime : gameEndedAtTime
    })
  }

  updateOpponentsFromSockets = (data) => {
    const { clearedOldSocketsOpponents, opponents } = this.state;
    const { allPlayersData, playerSocketId } = data;
    if (clearedOldSocketsOpponents === false) {
      this.setState({
        clearedOldSocketsOpponents: true
      });
    }
    let updatedOpponents = {};
    for (const [socketId, value] of Object.entries(allPlayersData)) {
      // only compare with players other than the current player
      if (value && playerSocketId !== socketId) {
        // console.log(`processing opponent: ${socketId}: ${value}`);
        // console.log('data', socketId, opponents[socketId], allPlayersData[socketId])
        if (opponents[socketId] !== allPlayersData[socketId]) {
          updatedOpponents[socketId] = value;
        }
      }
    }
 
    this.setState({
      opponents: updatedOpponents
    });
  }

  playAgain = () => {
    window.location.reload();
  }

  handleSubmit = async (event) => {
    // console.log('handleSubmit');
    event.preventDefault(); // Prevent page refreshing when click submit

    // only do tips on polkadot or kusama network
    let currentEndpoint = ENDPOINTS['Polkadot-CC1'].url;
    let currentEndpointName = 'Polkadot-CC1';

    let { keyring, api } = await this.setupTempApi(currentEndpoint, currentEndpointName);

    const { reason } = this.state;
    const twitterHandle = (this.twitterHandle.current && this.twitterHandle.current.value) || 'unknown';
    const reasonWithHandle = `${twitterHandle} ${reason}`;

    // Convert reason to message, sign and then verify
    const message = stringToU8a(reasonWithHandle);
    // const signature = newPair.sign(message);
    // const isValid = newPair.verify(message, signature);
    // // Log info
    // console.log(`The signature ${u8aToHex(signature)}, is ${isValid ? '' : 'in'}valid`);

    try {
      if (isMobile) {
        if (!this.mnemonicSeed.current || !this.mnemonicSeed.current.value) {
          console.error('Error: Unable to submit. Missing mnemonic seed form input or empty value');
          return;
        }
        // Alice
        // const mnemonicSeed = 'fitness brass champion rotate offer oak alarm purchase end mixture tattoo toss';
        const mnemonicSeed = this.mnemonicSeed.current.value;

        // Add an account to keyring
        const newPair = keyring.addFromUri(mnemonicSeed);
        // console.log('keyring pairs', keyring.getPairs());
        // Log some info
        // console.log(`Keypair has address ${newPair.address} with publicKey [${newPair.publicKey}]`);
        api.setSigner(newPair);
        await api.tx.tips
          .reportAwesome(u8aToHex(message), newPair.address)
          .signAndSend(newPair, ({ status, events }) => {
            this.showExtrinsicLogs('reportAwesome', status, events);
          });
        // console.log('Submitted reportAwesome on Mobile');
      } else {
        // Sign using Polkadot Extension
        if (!this.chainAccount.current.value || !this.chainAccount.current.value) {
          console.error('Error: Unable to submit. Missing chain account form input of empty value');
          return;
        }
        const chainAccount = this.chainAccount.current.value;
        // console.log('chainAccount entered: ', chainAccount);
        // finds an injector for an address
        const injector = await web3FromAddress(chainAccount);
        
        // Sets the signer for the address on the @polkadot/api so it causes popup to sign extrinsic
        api.setSigner(injector.signer);

        await api.tx.tips
          .reportAwesome(u8aToHex(message), chainAccount)
          .signAndSend(chainAccount, ({ status, events }) => {
            this.showExtrinsicLogs('reportAwesome', status, events);
          });
        // console.log('Submitted reportAwesome on Desktop');
      }
    } catch (error) {
      console.error('Caught error: ', error);
      this.setState({
        errorMessage: error.message
      });
    }

    // await api.tx.balances
    //   .transfer(senderAddress, 0.01)
    //   .signAndSend(senderAddress, ({ status, events }) => {
    //     this.showExtrinsicLogs('balances', status, events);
    //   });
    // Note: If returns error `Invalid Transaction: Payment`, then it is because the user is
    // trying to send from an account without sufficient balance
  }

  showExtrinsicLogs = (extrinsicName, status, events) => {
    const { api } = this.state;
    if (status.isInBlock || status.isFinalized) {
      // console.log(`${extrinsicName} current status is ${status}`);

      if (status.isInBlock) {
        // console.log(`${extrinsicName} transaction included at blockHash ${status.asInBlock}`);
      } else if (status.isFinalized) {
        // console.log(`${extrinsicName} transaction finalized at blockHash ${status.asFinalized}`);
      }

      events
        // find/filter for failed events
        .filter(({ section, method }) =>
          section === 'system' &&
          method === 'ExtrinsicFailed'
        )
        // we know that data for system.ExtrinsicFailed is
        // (DispatchError, DispatchInfo)
        .forEach(({ data: [error, info] }) => {
          if (error.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = api.registry.findMetaError(error.asModule);
            const { documentation, method, section } = decoded;

            // console.log(`${extrinsicName} error: ${section}.${method}: ${documentation.join(' ')}`);
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            // console.log(`${extrinsicName} other error: `, error.toString());
          }
        });
    }
  }

  handleSubmitChain = async (event) => {
    // console.log('handleSubmitChain');
    event.preventDefault(); // Prevent page refreshing when click submit
    const { api, chainAccount, currentBlockNumber, currentEndpoint, gameStartRequestedAtBlock } = this.state;
    if (!chainAccount) {
      // console.log('Error: cannot start game without account selected');
      return;
    }
    if (!currentBlockNumber) {
      // console.log('Error: cannot start game without first fetching block for default chain');
      return;
    }

    // this.closeModalChainWindow();
    // this.closeModalMobile();

    // check if customEndpoint submitted using the form differs from the one that loaded in componentDidMount
    const formCurrentEndpoint = this.customEndpoint.current && this.customEndpoint.current.value;
    if (formCurrentEndpoint !== currentEndpoint) {
      const foundValue = Object.values(ENDPOINTS).filter(obj => obj.url === formCurrentEndpoint)[0];
      const formCurrentEndpointName = Object.keys(ENDPOINTS)[Object.values(ENDPOINTS).indexOf(foundValue)];
  
      this.setState({
        formCurrentEndpoint,
        formCurrentEndpointName
      });
  
      this.setup(formCurrentEndpoint, formCurrentEndpointName);
    }

    // record that users clicked 'Play' and wants to start a game in future ahead of current block hash
    // const signedBlock = await api.rpc.chain.getBlock(currentBlockHash);
    // const currentBlockNumber = signedBlock.block.header.number.toString();
    // const gameStartRequestedAtBlock = ((signedBlock.block.header.number.toString()).toNumber() + 100).toString();
    // console.log('currentBlock', currentBlockNumber);
    // console.log('gameStartRequestedAtBlock', gameStartRequestedAtBlock);
    
    let startBlock;
    if (!gameStartRequestedAtBlock) {

      // if less than 5 blocks before next 100th block, the wait for game at next 100th block after that
      // i.e. 24199 + (100 - (24199 % 100)) == 24200 (so game would start in only 1 block!)
      let modulo = 10; // default 100
      let gap = 9// default 95
      if (Number(currentBlockNumber) % modulo > 95) {
        startBlock = (Number(currentBlockNumber) + (modulo - (Number(currentBlockNumber) % modulo)) + modulo).toString();
      } else {
        startBlock = (Number(currentBlockNumber) + (modulo - (Number(currentBlockNumber) % modulo))).toString();
      }
      // console.log('startBlock: ', startBlock);

      this.setState({
        // only set this up once, not if they call handleSubmitChain again to change the chain
        gameStartRequestedAtBlock: gameStartRequestedAtBlock === '' ? startBlock : gameStartRequestedAtBlock,
      });
    }
  }

  closeModalMobile = () => {
    this.setState({
      showModalMobile: false,
    });
  }

  closeModal = () => {
    this.setState({
      showModal: false,
    });
  }

  openModal = () => {
    this.setState({
      showModal: true,
    });
  }

  // Common method to close the chain window
  closeModalChainWindow = () => {
    this.setState({
      showModalChain: false,
    });
  }

  // // If the user clicks outside the chain modal, we want to setup but with the default chain endpoint
  closeModalChain = () => {
    // this.closeModalChainWindow();
    // this.setup(undefined, undefined, undefined);

    const { currentBlockNumber, gameStartRequestedAtBlock } = this.state;

    if (gameStartRequestedAtBlock && currentBlockNumber) {
      if (currentBlockNumber === gameStartRequestedAtBlock) {
        // starting the game for the current player
        this.closeModalChainWindow();
        this.closeModalMobile();
      }
    }
  }

  openModalChain = () => {
    this.setState({
      showModalChain: true,
    });
  }

  onChangeMnemonic = (event) => {
    let accountAddress;
    const { keyring } = this.state;
    const mnemonicSeed = this.mnemonicSeed.current.value;
    try {
      const newPair = keyring.addFromUri(mnemonicSeed);
      if (newPair) {
        // console.log(`Keypair accountAddress [${newPair.address}]`);
        accountAddress = newPair.address;
      }
    } catch (err) {
      // console.log('no matching pair for mnemonic seed');
      accountAddress = undefined;
    }
    this.setState({
      accountAddress,
    });
  }

  onChangeChainAccount = (event) => {
    const chainAccount = this.chainAccount && this.chainAccount.current && this.chainAccount.current.value;
    if (chainAccount) {
      // console.log('changed chainAccount to:', chainAccount);
      this.setState({
        chainAccount
      });
    }
  }

  render() {
    const { accountAddress, activeAccountIds, birdColor, blocksCleared, chain, chainAccountResult, chainAccount, currentBlockNumber, currentBlockHash, gameStartRequestedAtBlock, gameEndedAtBlock, gameEndedAtTime,
      currentBlockAuthors, currentEndpoint, currentEndpointName, deviceOrientation, errorMessage, extensionNotInstalled, extensionAllInjected, extensionAllAccountsList,
      isGameOver, innerHeight, innerWidth, opponents, opponentsWhenEnded,
      parentBlockHash, previousBlockNumber, reason, showModal, showModalChain, showModalMobile, ipData } = this.state;
    let reasonForTweet;
    // console.log('ip: ', ipData.ip);
    reasonForTweet = 'I just ' + reason + ' @polkadotnetwork #buildPolkadot';


    let remainingBlocksUntilPlay;
    if (gameStartRequestedAtBlock) {
      remainingBlocksUntilPlay = (Number(gameStartRequestedAtBlock) - Number(currentBlockNumber)).toString();
    }

    // console.log('Object.keys(opponentsWhenEnded).length: ', Object.keys(opponentsWhenEnded).length);
    // console.log('chainAccountResult: ', chainAccountResult);

    return (
      <div>
        {/* <button onClick={this.randomColor}>Random Color</button> */}
        <div className="brandname">FlappyTips 2</div>
        <div style={{position: 'fixed', bottom: '10%', fontSize: '10px', color: '#4169e1'}}><br/>
          {
            Object.entries(opponents).map((value, i) => {
              if (
                gameStartRequestedAtBlock === JSON.stringify(value[1]['gameStartRequestedAtBlock']) &&
                chain === JSON.stringify(value[1]['chain'])
              ) {
                return <span>{JSON.stringify(value[1]['chainAccount'])} | Blocks Cleared: {JSON.stringify(value[1]['blocksCleared'])} | {JSON.stringify(value[0])} | {JSON.stringify(value[1]['chainAccountResult'])}<br/></span>
              }
            })
          }
        </div>
        {!isGameOver
          ? (
            currentBlockNumber > 0
            ? null
            : <div className={`game-state grey`}>Wait for next block, then Tap or press Spacebar to fly through it</div>
          )
          : (
            <div>
              <div className={`game-state white`}>Game over! {chainAccountResult ? (chainAccountResult === chainAccount ? 'You won,' : 'You lost,') : 'Waiting for results...' } cleared {blocksCleared} blocks on {currentEndpointName} from #{gameStartRequestedAtBlock} to #{gameEndedAtBlock}!</div>
              {/* <div className={`game-state white`}>Game over! {chainAccountResult && Object.keys(opponentsWhenEnded).length > 0 ? (chainAccountResult === chainAccount ? 'You won,' : 'You lost,') : (Object.keys(opponentsWhenEnded).length > 0 ? 'Waiting for other player results...' : 'Single player' ) } cleared {blocksCleared} blocks on {currentEndpointName} from #{gameStartRequestedAtBlock} to #{gameEndedAtBlock}!</div> */}
              <Button variant="primary" className="play-again btn btn-lg" onTouchStart={() => this.playAgain()} onClick={() => this.playAgain()}>Play Again?</Button>
              <div>
                {
                  chainAccountResult === chainAccount && gameEndedAtBlock ? (
                    <Button variant="success" className="report-awesomeness btn btn-lg" onTouchStart={() => this.openModal()} onClick={() => this.openModal()}>Share & Request Tip?</Button>
                  ) : null
                }
              </div>
            </div>
          )
        }
        <ReactP5Wrapper
          sketch={sketch}
          activeAccountIds={activeAccountIds}
          birdColor={birdColor}
          chain={chain}
          chainAccount={chainAccount}
          chainAccountResult={chainAccountResult}
          currentBlockAuthors={currentBlockAuthors}
          currentBlockHash={currentBlockHash}
          currentBlockNumber={currentBlockNumber}
          deviceOrientation={deviceOrientation}
          gameStartRequestedAtBlock={gameStartRequestedAtBlock}
          gameEndedAtBlock={gameEndedAtBlock}
          gameEndedAtTime={gameEndedAtTime}
          gameOver={(blocksCleared) => this.gameOver(blocksCleared)}
          innerHeight={innerHeight}
          innerWidth={innerWidth}
          opponents={opponents}
          opponentsWhenEnded={opponentsWhenEnded}
          parentBlockHash={parentBlockHash}
          previousBlockNumber={previousBlockNumber}
          updatePlayerFromSockets={(playerData) => this.updatePlayerFromSockets(playerData)}
          updateOpponentsFromSockets={(allPlayersData) => this.updateOpponentsFromSockets(allPlayersData)}
        />
        <Modal show={showModal} onHide={() => this.closeModal()}>
          <Form onSubmit={this.handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Share & Request Tip (on-chain)! <br /> <h6><i>Chain Endpoint: <span style={{color: '#007bff'}}>{currentEndpoint}</span></i></h6></Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {!isMobile
                ? (
                  <div>
                    <Form.Group controlId="formChainAccount">
                      <h5>Chain Account:</h5>
                      <Form.Label>Select an account for this chain</Form.Label>
                      <Form.Control as="select" ref={this.chainAccount} name="chainAccount">
                        {extensionAllAccountsList.map((value, i) => {
                          return <option key={i} value={value && value.address}>{value && value.meta.name} | {value && value.address}</option>
                        })}
                      </Form.Control>
                      <Form.Text className="text-muted">
                        Important: Ensure sufficient balance to pay transaction fees (e.g. >0.001 KSM)
                      </Form.Text>
                    </Form.Group>
                    <div>
                      After submitting, see if you receive a tip <a target="_new" href="https://polkadot.js.org/apps/#/treasury">here</a>
                    </div>
                  </div>
                )
                : (<div></div>)
                /* (
                  <Form.Group controlId="formMnemonicSeed">
                    <Form.Label>Mnemonic Seed:  Public Address (SS58): {accountAddress}</Form.Label>
                    <Form.Control type="text" ref={this.mnemonicSeed} name="mnemonicSeed" placeholder="Account Mnemonic Seed" onChange={() => this.onChangeMnemonic(this)}/>
                    <Form.Text className="text-muted">
                      Enter the secret of the account you created at https://polkadot.js.org/apps/#/accounts for the chain endpoint shown above.
                      Important: Ensure sufficient balance to pay transaction fees (e.g. >0.001 KSM)
                    </Form.Text>
                  </Form.Group>
                )*/
              }
              <Form.Group controlId="formTwitterHandle">
                <Form.Label>Twitter Handle:</Form.Label>
                <Form.Control type="text" ref={this.twitterHandle} name="twitterHandle" placeholder="Twitter Handle" />
                <Form.Text className="text-muted">
                  Enter your Twitter handle or other form of nickname
                </Form.Text>
              </Form.Group>
              <div style={{fontSize: '10px', color: '#4169e1'}}>
                <span>
                  Preview reason: <i>{reason}</i>
                </span>
              </div>
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
              <Button variant="success" className="btn btn-primary btn-large mr-auto btn-block" type="submit">Send Request</Button>
              { errorMessage ? (
                  <Alert variant="danger">
                    { errorMessage }
                  </Alert>
                ) : null
              }
              <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
              <TwitterShareButton
                url={`https://clawbird.com`}
                options={{ text: reasonForTweet, via: 'ltfschoen' }}
              />
              {/* <Button variant="secondary" className="btn btn-primary btn-large btn-block" onTouchStart={() => this.closeModal()} onClick={() => this.closeModal()} >Close</Button> */}
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showModalMobile || showModalChain} onHide={() => this.closeModalChain()}>
          <Form onSubmit={this.handleSubmitChain}>
            <Modal.Header closeButton>
              <Modal.Title>
                {isMobile ? 'FlappyTips 2 on Mobile' : 'FlappyTips 2 on Desktop'}: <br />
                {/* <i>Choose a blockchain to play!</i> */}
              </Modal.Title>
            </Modal.Header>
            {!isMobile
              ? <span style={{color: "#AAAAAA"}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Extension detected: {extensionAllInjected}</span>
              : null
            }
            <Modal.Body>
            <div>
              {!isMobile
                ? (
                  <div>
                    <Form.Group controlId="formChainAccount">
                      {/* <h5>Chain Account:</h5> */}
                      <Form.Label>Select an account to play with:</Form.Label>
                      <Form.Control
                        as="select" ref={this.chainAccount} name="chainAccount"
                        onChange={() => this.onChangeChainAccount(this)}
                      >
                        {
                          extensionAllAccountsList.map((value, i) => {
                            return <option key={i} value={value && value.address}>{value && value.meta.name} | {value && value.address}</option>
                          })
                        }
                      </Form.Control>
                    </Form.Group>
                  </div>
                )
                : <span>{chainAccount}</span>
              }
            </div>
            <Form.Group controlId="customEndpoint">
              {/* <h5>Chain Endpoint:</h5> */}
              <Form.Label>Chain endpoint:</Form.Label>
              <Form.Control hidden="hidden" as="select" ref={this.customEndpoint} name="customEndpoint">
                {Object.keys(ENDPOINTS).map((key, i) => {
                  // disabled="disabled"
                  return (
                    key === 'Zeitgeist Mainnet'
                      ? <option key={i} value={ENDPOINTS[key].url}>{key}</option>
                      : null
                  )
                })}
              </Form.Control>
              <span style={{color: "#AAAAAA"}}>&nbsp;Zeitgeist Mainnet</span>
            </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              { remainingBlocksUntilPlay
                ? (
                    <Button variant="warning" className="btn btn-warning btn-large btn-block" type="button">
                      Please wait... <b>{remainingBlocksUntilPlay}</b> blocks remaining for opponents to join before game starts
                    </Button>
                  )
                : (
                  currentBlockNumber
                  ? (
                      <Button variant="success" className="btn btn-primary btn-large btn-block" type="submit">
                        Play
                      </Button>
                    )
                  : (
                      <Button variant="warning" className="btn btn-warning btn-large btn-block" type="button">
                        Loading...
                      </Button>
                  )
                ) 
              }
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={extensionNotInstalled && !isMobile} onHide={() => {
          // console.log('Polkadot.js Extension required on Desktop');
        }}>
          <Modal.Header>
            <Modal.Title>FlappyTips 2 on Desktop: Install and enable Polkadot.js Extension</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h3>Desktop users</h3>
            <p>FlappyTips 2 on Desktop users should use the Polkadot.js Extension (similar to MetaMask) that allows use of your cryptocurrency wallet to easily interact with
              the game without exposing your private keys. Social interaction in FlappyTips 2
              requires an active account with sufficient balance to pay each transaction fee (e.g. 0.01 KSM)
              by accepting or rejecting pop-ups requesting your signature. After downloading it, enable it in your web browser settings, then refresh this
              page and authorise the extension to play!
            </p>
            <p>
              <Button variant="primary" className="btn btn-primary btn-large btn-block" target="_new" href="https://github.com/polkadot-js/extension#installation">Download the Polkadot.js Extension</Button>
            </p>
          </Modal.Body>
        </Modal>

        <Modal show={showModalMobile && extensionNotInstalled && isMobile} onHide={() => {
          // console.log('Mobile device detected')
        }}>
          <Modal.Header>
            <Modal.Title>FlappyTips on Mobile</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h3>Mobile users</h3>
            <p>Play and social sharing is enabled, however requesting tipping FlappyTips 2 on Mobile game results on mobile devices is not currently supported until a QR code scanning feature using Parity Signer is incorporated.</p>
            {/* <p><b>WARNING</b> Sharing your FlappyTips 2 on Mobile game results on mobile devices currently only supports loading your account by
            entering your private key. Only FlappyTips 2 on Desktop supports loading accounts using the Polkadot.js Extension.</p> */}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="success" className="btn btn-lg btn-block" onTouchStart={() => this.closeModalMobile()} onClick={() => this.closeModalMobile()}>Play</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default Game;
