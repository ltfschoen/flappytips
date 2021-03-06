import React, { Component } from 'react';
import P5Wrapper from 'react-p5-wrapper';
import { isMobile } from "react-device-detect";
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress, web3ListRpcProviders, web3UseRpcProvider } from '@polkadot/extension-dapp';
import { bufferToU8a, u8aToBuffer, u8aToString, stringToU8a, u8aToHex } from '@polkadot/util';
import { spec } from '@edgeware/node-types';
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
import { getCurrentBlockInfo, getPreviousBlockInfo, getBlocksLast24Hours } from './api/siaStats';

class Game extends Component {
  constructor(){
    super();
    this.state = {
      accountAddress: undefined,
      activeAccountIds: {},
      blocksCleared: 0,
      chain: '',
      currentBlockNumber: '',
      currentBlockTimestamp: null,
      previousBlockNumber: '',
      previousBlockTimestamp: null,
      previousBlocktime: '',
      estimatedNextBlocktime: '',
      blocksLast24Hours: [],
      currentEndpoint: '',
      currentEndpointName: '',
      errorMessage: '',
      currentBlockHash: '',
      currentBlockAuthors: [],
      extensionAllInjected: '',
      extensionAllAccountsList: [],
      isGameStart: false,
      isPolk: false,
      isNewSiaBlock: false,
      parentBlockHash: '',
      birdColor: 255,
      api: undefined,
      provider: undefined,
      keyring: undefined,
      reason: '',
      showModal: false,
      showModalSia: false,
      showModalChain: false,
      showModalMobile: isMobile
    };

    this.twitterHandle = React.createRef();
    this.mnemonicSeed = React.createRef();
    this.chainAccount = React.createRef();
    this.customEndpoint = React.createRef();
    this.tweet = React.createRef();
  }

  async componentDidMount() {
    console.log(`FlappyTips v${pkg.version}`);
    // Returns an array of all the injected sources
    let allInjected = await web3Enable('FlappyTips');
    allInjected = allInjected.map(({ name, version }) => `${name} ${version}`);
    console.log('allInjected: ', allInjected);

    // returns an array of { address, meta: { name, source } }
    // meta.source contains the name of the extension that provides this account
    let allAccounts = await web3Accounts();
    let allAccountsList = [];
    allAccounts = allAccounts.map(({ address }) => allAccountsList.push(`${address}`));
    console.log('allAccounts', allAccountsList);

    this.setState({
      extensionNotInstalled: allInjected.length === 0,
      extensionAllInjected: allInjected,
      extensionAllAccountsList: allAccountsList,
      showModalChain: true
    });
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
  }

  setupApi = async (customEndpoint, customEndpointName) => {
    let currentEndpoint = customEndpoint;
    let currentEndpointName = customEndpointName;

    if (customEndpoint === "https://siastats.info" && customEndpointName === "Sia Mainnet") {
      currentEndpoint = ENDPOINTS['Edgeware Mainnet'].url;
      currentEndpointName = 'Edgeware Mainnet';
    }
    const provider = new WsProvider(currentEndpoint);
    // Create a keyring instance. https://polkadot.js.org/api/start/keyring.html
    const keyring = new Keyring({ type: 'sr25519' });
    let types;
    let api;
    if (currentEndpointName === 'Edgeware Mainnet') {
      console.log('Setting up Edgeware');
      types = Object.values(edgewareDefinitions).reduce((res, { types }) => ({ ...res, ...types }), {});
      api = await ApiPromise.create({
        provider,
        // https://www.npmjs.com/package/@edgeware/node-types/v/3.3.1-newyork.0
        ...spec,
      });
    } else {
      api = await ApiPromise.create({ provider });
    }

    return { provider, keyring, types, api };
  }

  setup = async (customEndpoint, customEndpointName, isPolk) => {
    // // IMPORTANT: This does not appear to work so we've used @polkadot-js/api's WsProvider instead
    // // retrieve all the RPC providers from a particular source
    // const allProviders = await web3ListRpcProviders('polkadot-js');
    // console.log('allProviders', allProviders)
    // // assuming one of the keys in `allProviders` is 'kusama-cc3', we can then use that provider
    // const { provider } = web3UseRpcProvider('polkadot-js', 'kusama-cc3');

    let currentEndpoint = customEndpoint;
    let currentEndpointName = customEndpointName;
    // Fallback to default chains if necessary
    if (!customEndpoint && isPolk) {
      currentEndpoint = ENDPOINTS['Edgeware Mainnet'].url;
      currentEndpointName = 'Edgeware Mainnet';
    } else if (!customEndpoint && !isPolk) {
      currentEndpoint = ENDPOINTS['Sia Mainnet'].url;
      currentEndpointName = 'Sia Mainnet';
    }

    let chain, nodeName, nodeVersion;
    let { provider, keyring, types, api } = await this.setupApi(currentEndpoint, currentEndpointName);

    if (currentEndpoint === "https://siastats.info") {
      currentEndpointName = "Sia Mainnet";
      chain = 'Sia Mainnet';

      const updateSiaBlockInfo = async () => {
        const { currentBlockNumber: asCurrent } = this.state;
        const [
          { 
            currentBlockNumber,
            currentBlockTimestamp
          },
          {
            previousBlockNumber,
            previousBlockTimestamp
          },
          blocksLast24Hours
        ] = await Promise.all([
          getCurrentBlockInfo(currentEndpoint),
          getPreviousBlockInfo(currentEndpoint),
          getBlocksLast24Hours(currentEndpoint)
        ]);

        this.setState({
          isNewSiaBlock: currentBlockNumber !== asCurrent,
        });

        this.handleReceiveNewHead(
          currentBlockNumber, currentBlockTimestamp, previousBlockNumber,
          previousBlockTimestamp, blocksLast24Hours, '', [], '', {}
        );
      }

      updateSiaBlockInfo();

      this.timer = setInterval(async () => {
        this.setState({
          isNewSiaBlock: false,
        }, () => {
          updateSiaBlockInfo();
        });
      }, 10000);
    
    } else {
      [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ]);
      await api.rpc.chain.subscribeNewHeads(async (header) => {
        let currentBlockNumber = header.number.toString();
        let parentBlockHash = header.parentHash.toString();

        const [blockHash, validators] = await Promise.all([
          api.rpc.chain.getBlockHash(currentBlockNumber),
          api.query.session.validators()
        ]);
        let currentBlockHash = blockHash.toString();

        // FIXME - triggers error on Kusama:
        // Unable to decode Vec on index 3 createType(ExtrinsicV4):: createType(Call):: Struct: failed on 'args':: Bytes: required length less than remainder, expected at least 324453603, found 512
        // RPC-CORE: getBlock(hash?: BlockHash): SignedBlock:: createType(SignedBlock):: Struct: failed on 'block':: Struct: failed on 'extrinsics':: createType(ExtrinsicV4):: createType(Call):: Struct: failed on 'args':: Bytes: required length less than remainder, expected at least 324453603, found 512

        // const [signedBlock] = await Promise.all([
        //   api.rpc.chain.getBlock(blockHash)
        // ]);
        // // console.log('signedBlock', signedBlock);
        // console.log('signedBlock', signedBlock.block.header.parentHash.toHex());

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
        console.log('currentDigest', currentDigest);

        // Extrinsic data
        const [extrinsicData] = await Promise.all([
          api.query.system.extrinsicData(header.number) 
        ]);
        console.log('extrinsicData', extrinsicData);

        // ExtrinsicsRoot
        const [extrinsicsRoot] = await Promise.all([
          api.query.system.extrinsicsRoot() 
        ]);
        console.log('extrinsicsRoot', extrinsicsRoot.toString());

        // Event topics
        const [eventTopics] = await Promise.all([
          api.query.system.eventTopics(currentBlockHash) 
        ]);
        console.log('eventTopics', eventTopics);

        const { activeAccountIds } = this.state;
        let newActiveAccountIds = activeAccountIds;

        // Only update the newActiveAccountIds if we're not using Edgeware
        // until this issue is resolved: https://github.com/hicommonwealth/edgeware-node/issues/176
        if (currentEndpointName !== 'Edgeware Mainnet') {
          let [currentBlockEvents] = [];
          [currentBlockEvents] = await Promise.all([
            api.query.system.events.at(currentBlockHash) 
          ]);
          // console.log('currentBlockEvents', currentBlockEvents);
          if (currentBlockEvents.length) {
            console.log(`\nReceived ${currentBlockEvents.length} events:`);
          }

          let foundAccountIds = {};
          currentBlockEvents.forEach((record) => {
            const { event, phase } = record;
            const types = event.typeDef;

            console.log('Event record: ', record);
            console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
            console.log(`\t\t${event.meta.documentation.toString()}`);

            event.data.forEach((data, index) => {
              console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
              console.log('types[index].type: ', types[index].type, typeof types[index].type, types[index].type === 'AccountId');
              if (types[index].type === 'AccountId') {
                activeAccountIds.hasOwnProperty(data.toString()) ? foundAccountIds[data.toString()] += 1 : foundAccountIds[data.toString()] = 1;
              }
              console.log('foundAccountIds: ', foundAccountIds);
            });
            if (foundAccountIds.length !== 0) {
              newActiveAccountIds = merge(activeAccountIds, foundAccountIds);
            }
            // FIXME - its getting the validators account id that authored the block, but i want the account id that
            // sent the Deposit extrinsic instead
            console.log('newActiveAccountIds: ', newActiveAccountIds);
          });
        }

        let currentBlockAuthors = [];
        if (currentEndpointName !== 'Edgeware Mainnet') {
          currentBlockAuthors = validators && validators.map((item, index) => item.toString());
        }

        this.handleReceiveNewHead(
          currentBlockNumber, '', '',
          '', [], currentBlockHash, currentBlockAuthors,
          parentBlockHash, newActiveAccountIds
        );
      });
    }

    this.setState({
      chain: chain.toString(),
      currentEndpoint,
      currentEndpointName,
      api,
      keyring,
      provider: provider || '',
      showModalChain: false,
      showModalMobile: false
    });
  }

  calculatePreviousBlocktime = (currentBlockTimestamp, previousBlockTimestamp) => {
    const convertUnixTimestampToDateObject = (unixTimestamp) => {
      const milliseconds = unixTimestamp * 1000;
      return new Date(milliseconds);
    };

    const diff = moment.duration(moment(convertUnixTimestampToDateObject(currentBlockTimestamp)).diff(moment(convertUnixTimestampToDateObject(previousBlockTimestamp))));

    console.log('currentBlockTimestamp Date Object', moment(convertUnixTimestampToDateObject(currentBlockTimestamp)).toISOString());
    console.log('previousBlockTimestamp Date Object', moment(convertUnixTimestampToDateObject(previousBlockTimestamp)).toISOString());
    console.log('Time difference is: ', diff.asMinutes() + ' minutes');

    return `${Number.parseFloat(diff.asMinutes()).toFixed(2)} minutes`;
  }

  estimatedNextBlocktime = (blocksLast24Hours) => {
    let blocktimes = [];
    let currentBlockTimestamp;
    let lastBlockTimestamp;
    let lastBlocktime;
    for (const block of blocksLast24Hours) {
      currentBlockTimestamp = block.timestamp;
      if (lastBlockTimestamp) {
        lastBlocktime = (currentBlockTimestamp - lastBlockTimestamp) / 60;
        blocktimes.push(lastBlocktime);
      }
      lastBlockTimestamp = currentBlockTimestamp;
      // console.log(block.height + ' ' + lastBlocktime); 
    }
    // console.log('blocktimes: ', blocktimes);
    const sum = blocktimes.reduce((a, b) => {
      return a + b;
    }, 0);
    let average = sum / (blocksLast24Hours.length);
    console.log('Average blocktime over past 24 hrs: ', average);

    return `${Number.parseFloat(average).toFixed(2)} minutes`;
  }

  handleReceiveNewHead = (currentBlockNumber, currentBlockTimestamp, previousBlockNumber,
    previousBlockTimestamp, blocksLast24Hours, currentBlockHash, currentBlockAuthors, parentBlockHash, newActiveAccountIds
  ) => {
    const { currentEndpointName } = this.state;
    previousBlockNumber = previousBlockNumber !== '' ? previousBlockNumber : this.state.currentBlockNumber;

    let previousBlocktime, estimatedNextBlocktime;
    if (currentEndpointName == "Sia Mainnet") {
      previousBlocktime = this.calculatePreviousBlocktime(currentBlockTimestamp, previousBlockTimestamp);
      estimatedNextBlocktime = this.estimatedNextBlocktime(blocksLast24Hours);
    }

    this.setState({
      previousBlocktime: previousBlocktime || '',
      estimatedNextBlocktime: estimatedNextBlocktime || '',
      currentBlockNumber: currentBlockNumber || '',
      currentBlockTimestamp: currentBlockTimestamp || null,
      previousBlockNumber: previousBlockNumber || '',
      previousBlockTimestamp: previousBlockTimestamp || null,
      currentBlockHash: currentBlockHash || '',
      currentBlockAuthors: currentBlockAuthors || [],
      parentBlockHash: parentBlockHash || '',
      previousBlockNumber: previousBlockNumber || '',
      activeAccountIds: newActiveAccountIds || {}
    });
  }

  randomColor = () => {
    this.setState({ birdColor: [Math.random()*255, Math.random()*255, Math.random()*255] })
  }

  gameOver = (blocksCleared) => {
    const { currentBlockNumber, currentEndpointName } = this.state;
    const reason = `played https://siasky.net/hns/flappy v${pkg.version} (${isMobile ? 'Mobile' : 'Desktop'}) on ${currentEndpointName} and cleared ${Number.parseFloat(blocksCleared).toFixed(2)} blocks from #${currentBlockNumber}!`;
    this.setState({
      blocksCleared,
      isGameOver: true,
      reason
    })
  }

  playAgain = () => {
    window.location.reload();
  }

  handleSubmitSia = async (event) => {
    console.log('handleSubmitSia');
    event.preventDefault(); // Prevent page refreshing when click submit
  }

  handleSubmit = async (event) => {
    console.log('handleSubmit');
    event.preventDefault(); // Prevent page refreshing when click submit

    const { api, keyring, reason } = this.state;
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
        console.log('keyring pairs', keyring.getPairs());
        // Log some info
        console.log(`Keypair has address ${newPair.address} with publicKey [${newPair.publicKey}]`);
        api.setSigner(newPair);
        await api.tx.treasury
          .reportAwesome(u8aToHex(message), newPair.address)
          .signAndSend(newPair, ({ status, events }) => {
            this.showExtrinsicLogs('reportAwesome', status, events);
          });
        console.log('Submitted reportAwesome on Mobile');
      } else {
        // Sign using Polkadot Extension
        if (!this.chainAccount.current.value || !this.chainAccount.current.value) {
          console.error('Error: Unable to submit. Missing chain account form input of empty value');
          return;
        }
        const chainAccount = this.chainAccount.current.value;
        console.log('chainAccount entered: ', chainAccount);
        // finds an injector for an address
        const injector = await web3FromAddress(chainAccount);
        
        // Sets the signer for the address on the @polkadot/api so it causes popup to sign extrinsic
        api.setSigner(injector.signer);

        await api.tx.treasury
          .reportAwesome(u8aToHex(message), chainAccount)
          .signAndSend(chainAccount, ({ status, events }) => {
            this.showExtrinsicLogs('reportAwesome', status, events);
          });
        console.log('Submitted reportAwesome on Desktop');
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
      console.log(`${extrinsicName} current status is ${status}`);

      if (status.isInBlock) {
        console.log(`${extrinsicName} transaction included at blockHash ${status.asInBlock}`);
      } else if (status.isFinalized) {
        console.log(`${extrinsicName} transaction finalized at blockHash ${status.asFinalized}`);
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

            console.log(`${extrinsicName} error: ${section}.${method}: ${documentation.join(' ')}`);
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            console.log(`${extrinsicName} other error: `, error.toString());
          }
        });
    }
  }

  handleSubmitChain = async (event) => {
    console.log('handleSubmitChain');
    event.preventDefault(); // Prevent page refreshing when click submit

    this.closeModalChainWindow();
    this.closeModalMobile();

    const currentEndpoint = this.customEndpoint.current && this.customEndpoint.current.value;
    const foundValue = Object.values(ENDPOINTS).filter(obj => obj.url === currentEndpoint)[0];
    const currentEndpointName = Object.keys(ENDPOINTS)[Object.values(ENDPOINTS).indexOf(foundValue)];
    const isPolk = foundValue.isPolk ? true : false;

    this.setState({
      currentEndpoint,
      currentEndpointName,
      isPolk
    });

    this.setup(currentEndpoint, currentEndpointName, isPolk);
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

  closeModalSia = () => {
    this.setState({
      showModalSia: false,
    });
  }

  openModal = () => {
    this.setState({
      showModal: true,
    });
  }

  openModalSia = () => {
    this.setState({
      showModalSia: true,
    });
  }

  // Common method to close the chain window
  closeModalChainWindow = () => {
    this.setState({
      showModalChain: false,
    });
  }

  // If the user clicks outside the chain modal, we want to setup but with the default chain endpoint
  closeModalChain = () => {
    this.closeModalChainWindow();
    this.setup(undefined, undefined, undefined);
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
      console.log(`Keypair accountAddress [${newPair.address}]`);
      accountAddress = newPair.address;
    } catch (err) {
      console.log('no matching pair for mnemonic seed');
      accountAddress = undefined;
    }
    this.setState({
      accountAddress,
    });
  }

  render() {
    const { accountAddress, activeAccountIds, birdColor, blocksCleared, chain, currentBlockNumber, currentBlockHash,
      currentBlockAuthors, currentEndpoint, currentEndpointName, errorMessage, extensionNotInstalled, extensionAllInjected, extensionAllAccountsList, isGameOver,
      isNewSiaBlock, isPolk, parentBlockHash, previousBlockNumber, previousBlocktime, estimatedNextBlocktime, reason, showModal, showModalSia, showModalChain, showModalMobile } = this.state;
    let reasonForTweet;
    if (isPolk) {
      reasonForTweet = 'I just ' + reason + ' @polkadotnetwork #buildPolkadot';
    } else if (!isPolk && currentEndpointName == "Sia Mainnet") {
      reasonForTweet = 'I just ' + reason + ' @MySiacoin #Siacoin'
    } else {
      reasonForTweet = 'I just ' + reason;
    }

    return (
      <div>
        {/* <button onClick={this.randomColor}>Random Color</button> */}
        <div className="brandname">FlappyTips</div>
        {!isGameOver
          ? (
            currentBlockNumber > 0
            ? null
            : <div className={`game-state grey`}>Wait for next block, then Tap or press Spacebar to fly through it</div>
          )
          : (
            <div>
              <div className={`game-state white`}>Game over! You're awesome for clearing {blocksCleared} blocks on {currentEndpointName}!</div>
              <Button variant="primary" className="play-again btn btn-lg" onTouchStart={() => this.playAgain()} onClick={() => this.playAgain()}>Play Again?</Button>
              { isPolk ? (
                  <Button variant="success" className="report-awesomeness btn btn-lg" onTouchStart={() => this.openModal()} onClick={() => this.openModal()}>Share & Request Tip?</Button>
                ) : (
                  <Button variant="success" className="report-awesomeness btn btn-lg" onTouchStart={() => this.openModalSia()} onClick={() => this.openModalSia()}>Share?</Button>
                )
              }
            </div>
          )
        }
        <P5Wrapper
          sketch={sketch}
          gameOver={(blocksCleared) => this.gameOver(blocksCleared)}
          color={birdColor}
          chain={chain}
          currentBlockNumber={currentBlockNumber}
          currentBlockHash={currentBlockHash}
          currentBlockAuthors={currentBlockAuthors}
          isNewSiaBlock={isNewSiaBlock}
          parentBlockHash={parentBlockHash}
          previousBlockNumber={previousBlockNumber}
          previousBlocktime={previousBlocktime}
          estimatedNextBlocktime={estimatedNextBlocktime}
          activeAccountIds={activeAccountIds}
        ></P5Wrapper>
        <Modal show={showModal} onHide={() => this.closeModal()}>
          <Form onSubmit={this.handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Share & Request Tip (on-chain)! <br /> <h6><i>Chain Endpoint: <span style={{color: '#007bff'}}>{currentEndpoint}</span></i></h6></Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {!isMobile
                ? (
                  <Form.Group controlId="formChainAccount">
                    <h5>Chain Account:</h5>
                    <Form.Label>Select an account for this chain</Form.Label>
                    <Form.Control as="select" ref={this.chainAccount} name="chainAccount">
                      {extensionAllAccountsList.map((value, i) => {
                        return <option key={i} value={value}>{value}</option>
                      })}
                    </Form.Control>
                    <Form.Text className="text-muted">
                      Important: Ensure sufficient balance to pay transaction fees (e.g. >0.001 KSM)
                    </Form.Text>
                  </Form.Group>
                )
                : (
                  <Form.Group controlId="formMnemonicSeed">
                    <Form.Label>Mnemonic Seed:  Public Address (SS58): {accountAddress}</Form.Label>
                    <Form.Control type="text" ref={this.mnemonicSeed} name="mnemonicSeed" placeholder="Account Mnemonic Seed" onChange={() => this.onChangeMnemonic(this)}/>
                    <Form.Text className="text-muted">
                      Enter the secret of the account you created at https://polkadot.js.org/apps/#/accounts for the chain endpoint shown above.
                      Important: Ensure sufficient balance to pay transaction fees (e.g. >0.001 KSM)
                    </Form.Text>
                  </Form.Group>
                )
              }
              <Form.Group controlId="formTwitterHandle">
                <Form.Label>Twitter Handle:</Form.Label>
                <Form.Control type="text" ref={this.twitterHandle} name="twitterHandle" placeholder="Twitter Handle" />
                <Form.Text className="text-muted">
                  Enter your Twitter handle or other form of nickname
                </Form.Text>
              </Form.Group>
              <div>
                After submitting, find your tip <a target="_new" href="https://polkadot.js.org/apps/#/treasury">here</a>
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
                url={`https://siasky.net/hns/flappy`}
                options={{ text: reasonForTweet, via: 'ltfschoen' }}
              />
              {/* <Button variant="secondary" className="btn btn-primary btn-large btn-block" onTouchStart={() => this.closeModal()} onClick={() => this.closeModal()} >Close</Button> */}
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showModalSia} onHide={() => this.closeModalSia()}>
          <Form onSubmit={this.handleSubmitSia}>
            <Modal.Header closeButton>
              <Modal.Title>Share <br /> <h6><i>Chain Endpoint: <span style={{color: '#007bff'}}>{currentEndpoint}</span></i></h6></Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group controlId="formTwitterHandle">
                <Form.Label>Twitter Handle:</Form.Label>
                <Form.Control type="text" ref={this.twitterHandle} name="twitterHandle" placeholder="Twitter Handle" />
                <Form.Text className="text-muted">
                  Enter your Twitter handle or other form of nickname
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
              {/* <Button variant="success" className="btn btn-primary btn-large mr-auto btn-block" type="submit">Send Request</Button>
              { errorMessage ? (
                  <Alert variant="danger">
                    { errorMessage }
                  </Alert>
                ) : null
              } */}
              <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
              <TwitterShareButton
                url={`https://siasky.net/hns/flappy`}
                options={{ text: reasonForTweet, via: 'ltfschoen' }}
              />
              {/* <Button variant="secondary" className="btn btn-primary btn-large btn-block" onTouchStart={() => this.closeModal()} onClick={() => this.closeModal()} >Close</Button> */}
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showModalMobile || showModalChain} onHide={() => this.closeModalChain()}>
          <Form onSubmit={this.handleSubmitChain}>
            <Modal.Header closeButton>
              <Modal.Title>{isMobile ? 'FlappyTips on Mobile' : 'FlappyTips on Desktop'}: <br /><i>Choose a blockchain to play!</i></Modal.Title>
            </Modal.Header>
            {!isMobile
              ? <span style={{color: "#AAAAAA"}}><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Extension detected: {extensionAllInjected}</b></span>
              : null
            }
            <Modal.Body>
            <Form.Group controlId="customEndpoint">
              <h5>Chain Endpoint:</h5>
              <Form.Label>Select a chain endpoint</Form.Label>
              <Form.Control as="select" ref={this.customEndpoint} name="customEndpoint">
                {Object.keys(ENDPOINTS).map((key, i) => {
                  return (
                    key === 'DataHighway Harbour Testnet' || key === 'Westend Testnet'
                      ? <option disabled="disabled" key={i} value={ENDPOINTS[key].url}>{key}</option>
                      : <option key={i} value={ENDPOINTS[key].url}>{key}</option>
                  )
                })}
              </Form.Control>
            </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="success" className="btn btn-primary btn-large btn-block" type="submit">Play</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={isPolk && extensionNotInstalled && !isMobile} onHide={() => console.log('Polkadot.js Extension required on Desktop')}>
          <Modal.Header>
            <Modal.Title>FlappyTips on Desktop: Install and enable Polkadot.js Extension</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h3>Desktop users</h3>
            <p>FlappyTips on Desktop users should use the Polkadot.js Extension (similar to MetaMask) that allows use of your cryptocurrency wallet to easily interact with
              the game without exposing your private keys. Social interaction in FlappyTips
              requires an active account with sufficient balance to pay each transaction fee (e.g. 0.01 KSM)
              by accepting or rejecting pop-ups requesting your signature. After downloading it, enable it in your web browser settings, then refresh this
              page and authorise the extension to play!
            </p>
            <p>
              <Button variant="primary" className="btn btn-primary btn-large btn-block" target="_new" href="https://github.com/polkadot-js/extension#installation">Download the Polkadot.js Extension</Button>
            </p>
          </Modal.Body>
        </Modal>

        <Modal show={isPolk && showModalMobile && extensionNotInstalled && isMobile} onHide={() => console.log('Mobile device detected')}>
          <Modal.Header>
            <Modal.Title>FlappyTips on Mobile</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h3>Mobile users</h3>
            <p><b>WARNING</b> Sharing your FlappyTips on Mobile game results on mobile devices currently only supports loading your account by
            entering your private key. Only FlappyTips on Desktop supports loading accounts using the Polkadot.js Extension.</p>
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
