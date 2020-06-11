import React, { Component } from 'react';
import P5Wrapper from 'react-p5-wrapper';
import { isMobile } from "react-device-detect";
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress, web3ListRpcProviders, web3UseRpcProvider } from '@polkadot/extension-dapp';
import { bufferToU8a, u8aToBuffer, u8aToString, stringToU8a, u8aToHex } from '@polkadot/util';
import Button from "react-bootstrap/Button";
// import Input from "react-bootstrap/Input";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import sketch from './sketches/sketch';
import { ENDPOINTS } from './constants';
import merge from './helpers/merge';

class Game extends Component {
  constructor(){
    super();
    this.state = {
      accountAddress: undefined,
      activeAccountIds: {},
      blocksCleared: 0,
      chain: '',
      currentBlockNumber: '',
      currentEndpoint: '',
      previousBlockNumber: '',
      currentBlockHash: '',
      currentBlockAuthors: [],
      extensionAllInjected: '',
      extensionAllAccountsList: [],
      isGameStart: false,
      parentBlockHash: '',
      birdColor: 255,
      api: undefined,
      provider: undefined,
      keyring: undefined,
      showModal: false,
      showModalChain: false,
      showModalMobile: isMobile
    };

    this.twitterHandle = React.createRef();
    this.mnemonicSeed = React.createRef();
    this.chainAccount = React.createRef();
    this.customEndpoint = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitChain = this.handleSubmitChain.bind(this);
  }

  async componentDidMount() {
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

  setup = async (customEndpoint) => {
    // // IMPORTANT: This does not appear to work so we've used @polkadot-js/api's WsProvider instead
    // // retrieve all the RPC providers from a particular source
    // const allProviders = await web3ListRpcProviders('polkadot-js');
    // console.log('allProviders', allProviders)
    // // assuming one of the keys in `allProviders` is 'kusama-cc3', we can then use that provider
    // const { provider } = web3UseRpcProvider('polkadot-js', 'kusama-cc3');

    const currentEndpoint = customEndpoint || ENDPOINTS.kusamaW3F;
    const provider = new WsProvider(currentEndpoint);
    // Create a keyring instance. https://polkadot.js.org/api/start/keyring.html
    const keyring = new Keyring({ type: 'sr25519' });
    const api = await ApiPromise.create({ provider });
    const [chain, nodeName, nodeVersion] = await Promise.all([
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

      const [signedBlock] = await Promise.all([
        api.rpc.chain.getBlock(blockHash)
      ]);
      console.log('signedBlock', signedBlock);
      console.log('signedBlock', signedBlock.block.header.parentHash.toHex());

      // // Hash for each extrinsic in the block
      // signedBlock.block.extrinsics.forEach((ex, index) => {
      //   console.log('Hash for extrinsic in the block', index, ex.hash.toHex());
      //   // FIXME
      //   console.log('Hash for extrinsic in the block', index, bufferToU8a(ex.data.buffer).toHex());
      //   // console.log('Hash for extrinsic in the block', index, u8aToString(bufferToU8a(ex.data)));
      // });

      const [currentBlockEvents] = await Promise.all([
        api.query.system.events.at(currentBlockHash) 
      ]);
      // console.log('currentBlockEvents', currentBlockEvents);

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

      console.log(`\nReceived ${currentBlockEvents.length} events:`);

      const { activeAccountIds } = this.state;
      let newActiveAccountIds = activeAccountIds;
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

      const currentBlockAuthors = validators && validators.map((item, index) => item.toString());
      this.handleReceiveNewHead(currentBlockNumber, currentBlockHash, currentBlockAuthors, parentBlockHash, newActiveAccountIds);
    });

    this.setState({
      chain: chain.toString(),
      currentEndpoint,
      api,
      keyring,
      provider,
      showModalChain: false
    });
  }

  handleReceiveNewHead = (currentBlockNumber, currentBlockHash, currentBlockAuthors, parentBlockHash, newActiveAccountIds) => {
    let previousBlockNumber = this.state.currentBlockNumber;
    this.setState({
      currentBlockNumber,
      currentBlockHash,
      currentBlockAuthors,
      parentBlockHash,
      previousBlockNumber,
      activeAccountIds: newActiveAccountIds
    });
  }

  randomColor = () => {
    this.setState({ birdColor: [Math.random()*255, Math.random()*255, Math.random()*255] })
  }

  gameOver = (blocksCleared) => {
    this.setState({
      blocksCleared,
      isGameOver: true
    })
  }

  playAgain = () => {
    window.location.reload();
  }

  async handleSubmit(event) {
    console.log('handleSubmit');
    const { api, blocksCleared, currentBlockNumber, keyring } = this.state;
    const twitterHandle = this.twitterHandle.current.value;
    const reason = `${twitterHandle} played FlappyTips.herokuapp.com on desktop using Polkadot.js Extension and cleared ${blocksCleared} blocks from ${currentBlockNumber}!`;
    event.preventDefault();

    let senderAddress;
    if (isMobile) {
      // Alice
      // const mnemonicSeed = 'fitness brass champion rotate offer oak alarm purchase end mixture tattoo toss';
      const mnemonicSeed = this.mnemonicSeed.current.value;

      // Add an account to keyring
      const newPair = keyring.addFromUri(mnemonicSeed);
      console.log('keyring pairs', keyring.getPairs());
      // Log some info
      console.log(`Keypair has address ${newPair.address} with publicKey [${newPair.publicKey}]`);
      senderAddress = newPair.address;
    } else {
      const chainAccount = this.chainAccount.current.value;
      console.log('chainAccount entered: ', chainAccount);
      // finds an injector for an address
      const injector = await web3FromAddress(chainAccount);
      
      // Sets the signer for the address on the @polkadot/api so it causes popup to sign extrinsic
      api.setSigner(injector.signer);
      senderAddress = chainAccount;
    }

    // Convert reason to message, sign and then verify
    const message = stringToU8a(reason);
    // const signature = newPair.sign(message);
    // const isValid = newPair.verify(message, signature);
    // // Log info
    // console.log(`The signature ${u8aToHex(signature)}, is ${isValid ? '' : 'in'}valid`);

    // await api.tx.balances
    //   .transfer(senderAddress, 0.01)
    //   .signAndSend(senderAddress, ({ status, events }) => {
    //     this.showExtrinsicLogs('balances', status, events);
    //   });
    // Note: If returns error `Invalid Transaction: Payment`, then it is because the user is
    // trying to send from an account without sufficient balance

    // // Sign and send using user account
    // // Note: Check the chain that this is supported by
    // await api.tx.treasury
    //   .reportAwesome(u8aToHex(message), senderAddress)
    //   .signAndSend(senderAddress, ({ status, events }) => {
    //     this.showExtrinsicLogs('reportAwesome', status, events);
    //   });
    // console.log('Submitted reportAwesome');

      // IMPORTANT: Not using this since we're now using Polkadot.js Extension instead of mnemonic input
      // .reportAwesome(u8aToHex(message), newPair.address)
      // .signAndSend(newPair, ({ status, events }) => {
      //   console.log('reportAwesome output: ', status, events);
      // });
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

  async handleSubmitChain(event) {
    console.log('handleSubmitChain');
    this.closeModalChainWindow();
    const customEndpoint = this.customEndpoint.current.value;
    event.preventDefault();
    this.setState({
      currentEndpoint: customEndpoint
    });

    this.setup(customEndpoint);
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

  // If the user clicks outside the chain modal, we want to setup but with the default chain endpoint
  closeModalChain = () => {
    this.closeModalChainWindow();
    this.setup(undefined);
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
      currentBlockAuthors, currentEndpoint, extensionNotInstalled, extensionAllInjected, extensionAllAccountsList, isGameOver,
      parentBlockHash, previousBlockNumber, showModal, showModalChain, showModalMobile } = this.state;

    return (
      <div>
        {/* <button onClick={this.randomColor}>Random Color</button> */}
        <div className="brandname">FlappyTips</div>
        {!isGameOver
          ? (
            currentBlockNumber > 0
            ? null
            : <div className={`game-state`}>Wait for next block, then Tap or press Spacebar to fly DOT through it</div>
          )
          : (
            <div>
              <div className={`game-state red`}>Game over! You're awesome for clearing {blocksCleared} blocks!</div>
              <Button variant="primary" className="play-again btn btn-lg" onTouchStart={() => this.playAgain()} onClick={() => this.playAgain()}>Play Again?</Button>
              <Button variant="success" className="report-awesomeness btn btn-lg" onTouchStart={() => this.openModal()} onClick={() => this.openModal()}>Report your awesomeness?</Button>
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
          parentBlockHash={parentBlockHash}
          previousBlockNumber={previousBlockNumber}
          activeAccountIds={activeAccountIds}
        ></P5Wrapper>
        <Modal show={showModal} onHide={() => this.closeModal()}>
          <Form onSubmit={this.handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Share your awesomeness on-chain!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group controlId="formTwitterHandle">
                <h5>Chain Endpoint: {currentEndpoint}</h5>
                <Form.Label>Twitter Handle:</Form.Label>
                <Form.Control type="text" ref={this.twitterHandle} name="twitterHandle" placeholder="Twitter Handle" />
                <Form.Text className="text-muted">
                  Enter your Twitter handle or other form of nickname
                </Form.Text>
              </Form.Group>
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
                      Important: Ensure it has sufficient balance to pay fees for a submission (e.g. >1.000 milli KSM or DOT)
                    </Form.Text>
                  </Form.Group>
                )
                : (
                  <Form.Group controlId="formMnemonicSeed">
                    <Form.Label>Mnemonic Seed:  Public Address (SS58): {accountAddress}</Form.Label>
                    <Form.Control type="text" ref={this.mnemonicSeed} name="mnemonicSeed" placeholder="Account Mnemonic Seed" onChange={() => this.onChangeMnemonic(this)}/>
                    <Form.Text className="text-muted">
                      Enter your secret Mnemonic Seed (Private Key) that you created at https://polkadot.js.org/apps/#/accounts for the chain endpoint shown above.
                      Important: Ensure it has sufficient balance to pay fees for the submission (e.g. 1.000 milli KSM or DOT)
                    </Form.Text>
                  </Form.Group>
                )
              }
              <div>
                After submitting, find your tip <a target="_new" href="https://polkadot.js.org/apps/#/treasury">here</a>
              </div>
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
              <Button variant="success" className="btn btn-primary btn-large mr-auto btn-block" type="submit">Send</Button>
              {/* <Button variant="secondary" className="btn btn-primary btn-large btn-block" onTouchStart={() => this.closeModal()} onClick={() => this.closeModal()} >Close</Button> */}
            </Modal.Footer>
          </Form>
        </Modal>
        <Modal show={!showModalMobile && showModalChain} onHide={() => this.closeModalChain()}>
          <Form onSubmit={this.handleSubmitChain}>
            <Modal.Header closeButton>
              <Modal.Title>{isMobile ? 'FlappyTips on Mobile' : 'FlappyTips on Desktop'}: Choose a blockchain to play!</Modal.Title>
            </Modal.Header>
            {!isMobile
              ? <div><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Extension detected: {extensionAllInjected}</b></div>
              : null
            }
            <Modal.Body>
            <Form.Group controlId="customEndpoint">
              <h5>Chain Endpoint:</h5>
              <Form.Label>Select a chain endpoint</Form.Label>
              <Form.Control as="select" ref={this.customEndpoint} name="customEndpoint">
                {Object.values(ENDPOINTS).map((value, i) => {
                  return (
                    value === 'wss://testnet-harbour.datahighway.com' || value === 'wss://westend-rpc.polkadot.io'
                      ? <option disabled="disabled" key={i} value={value}>{value}</option>
                      : <option key={i} value={value}>{value}</option>
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

        <Modal show={extensionNotInstalled && !isMobile} onHide={() => console.log('Polkadot.js Extension required on Desktop')}>
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

        <Modal show={showModalMobile && extensionNotInstalled && isMobile} onHide={() => console.log('Mobile device detected')}>
          <Modal.Header closeButton>
            <Modal.Title>FlappyTips Mobile</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h3>Mobile users</h3>
            <p><b>WARNING</b> To share your Flappy on Mobile game results, only loading your account by
            entering your private key is currently supported. Only FlappyTips on Desktop supports loading
            accounts using the Polkadot.js Extension.</p>
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
