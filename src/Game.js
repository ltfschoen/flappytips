import React, { Component } from 'react';
import P5Wrapper from 'react-p5-wrapper';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
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
      isGameStart: false,
      parentBlockHash: '',
      birdColor: 255,
      api: undefined,
      provider: undefined,
      keyring: undefined,
      showModal: false,
      showModalChain: false
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitChain = this.handleSubmitChain.bind(this);
  }

  async componentDidMount() {
    this.setState({
      showModalChain: true
    });
  }

  setup = async (customEndpoint) => {
    const currentEndpoint = customEndpoint || ENDPOINTS.kusamaW3F;
    // Create a keyring instance. https://polkadot.js.org/api/start/keyring.html
    const keyring = new Keyring({ type: 'sr25519' });
    const provider = new WsProvider(currentEndpoint);
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
    const twitterHandle = this.refs.twitterHandle.value;
    const reason = `${twitterHandle} played FlappyTips.herokuapp.com and cleared ${blocksCleared} blocks from ${currentBlockNumber}!`;
    event.preventDefault();

    // Alice
    // const mnemonicSeed = 'fitness brass champion rotate offer oak alarm purchase end mixture tattoo toss';
    const mnemonicSeed = this.refs.mnemonicSeed.value;

    // Add an account to keyring
    const newPair = keyring.addFromUri(mnemonicSeed);
    console.log('keyring pairs', keyring.getPairs());
    // Log some info
    console.log(`Keypair has address ${newPair.address} with publicKey [${newPair.publicKey}]`);

    // Convert reason to message, sign and then verify
    const message = stringToU8a(reason);
    // const signature = newPair.sign(message);
    // const isValid = newPair.verify(message, signature);
    // // Log info
    // console.log(`The signature ${u8aToHex(signature)}, is ${isValid ? '' : 'in'}valid`);

    // let txHash;
    // Note: Nonce is an optional RPC that needs to be explicitly exposed by the chain,
    // otherwise do not use it.
    // // retrieve the nextNonce
    // const nonce = await api.rpc.account.nextNonce(newPair);
    // // Sign and send a report awesome from the keyring pair

    // txHash = await api.tx.balances
    //   .transfer(newPair.address, 0.01)
    //   .signAndSend(newPair);
    //   // .signAndSend(newPair, { nonce });
    // // Show the hash
    // // Note: If returns error `Invalid Transaction: Payment`, then it is because the user is
    // // trying to send from an account without sufficient balance
    // console.log(`Submitted transfer with hash ${txHash.toHex()}`);

    // Sign and send using user account
    // Note: Check the chain that this is supported by
    await api.tx.treasury
      .reportAwesome(u8aToHex(message), newPair.address)
      .signAndSend(newPair, ({ status, events }) => {
        console.log('reportAwesome output: ', status, events);
      });
    console.log('Submitted reportAwesome');
  }

  async handleSubmitChain(event) {
    console.log('handleSubmitChain');
    this.closeModalChainWindow();
    const customEndpoint = this.refs.customEndpoint.value;
    event.preventDefault();
    this.setState({
      currentEndpoint: customEndpoint
    });

    this.setup(customEndpoint);
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
    const mnemonicSeed = event.refs.mnemonicSeed.value;
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
      currentBlockAuthors, currentEndpoint, isGameOver, parentBlockHash, previousBlockNumber } = this.state;

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
              <Button variant="dark" className="play-again btn btn-lg" onTouchStart={() => this.playAgain()} onClick={() => this.playAgain()}>Play Again?</Button>
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
        <Modal show={this.state.showModal} onHide={() => this.closeModal()}>
          <Form onSubmit={this.handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Share your awesomeness on-chain!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group controlId="formTwitterHandle">
                <h5>Chain Endpoint: {currentEndpoint}</h5>
                <Form.Label>Twitter Handle:</Form.Label>
                <Form.Control type="text" ref="twitterHandle" name="twitterHandle" placeholder="Twitter Handle" />
                <Form.Text className="text-muted">
                  Enter your Twitter handle or other form of nickname
                </Form.Text>
              </Form.Group>
              <Form.Group controlId="formMnemonicSeed">
                <Form.Label>Mnemonic Seed:  Public Address (SS58): {accountAddress}</Form.Label>
                <Form.Control type="text" ref="mnemonicSeed" name="mnemonicSeed" placeholder="Account Mnemonic Seed" onChange={() => this.onChangeMnemonic(this)}/>
                <Form.Text className="text-muted">
                  Enter your secret Mnemonic Seed (Private Key) that you created at https://polkadot.js.org/apps/#/accounts for the chain endpoint shown above.
                  Important: Ensure it has sufficient balance to pay fees for the submission (e.g. 1.000 milli KSM or DOT)
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button className="btn btn-primary btn-large centerButton" type="submit">Send</Button>
              <Button onClick={() => this.closeModal()} >Close</Button>
            </Modal.Footer>
          </Form>
        </Modal>
        <Modal show={this.state.showModalChain} onHide={() => this.closeModalChain()}>
          <Form onSubmit={this.handleSubmitChain}>
            <Modal.Header closeButton>
              <Modal.Title>Choose a blockchain to play!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <Form.Group controlId="customEndpoint">
              <h5>Chain Endpoint:</h5>
              <Form.Label>Select a chain endpoint</Form.Label>
              <Form.Control as="select" ref="customEndpoint" name="customEndpoint">
                {Object.values(ENDPOINTS).map((value, i) => {
                  return <option key={i} value={value}>{value}</option>
                })}
              </Form.Control>
            </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button className="btn btn-primary btn-large centerButton" type="submit">Save</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default Game;
