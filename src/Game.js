import React, { Component } from 'react';
import P5Wrapper from 'react-p5-wrapper';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { bufferToU8a, u8aToBuffer, u8aToString } from '@polkadot/util';
import sketch from './sketches/sketch';
import { ENDPOINTS } from './constants';
import merge from './helpers/merge';

class Game extends Component {
  constructor(){
    super();
    this.state = {
      activeAccountIds: {},
      chain: '',
      currentBlockNumber: '',
      currentBlockHash: '',
      currentBlockAuthors: [],
      parentBlockHash: '',
      birdColor: 255,
      api: undefined,
      provider: undefined
    };
  }

  async componentDidMount() {
    const provider = new WsProvider(ENDPOINTS.westendW3F);
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
      api,
      provider
    });
  }

  handleReceiveNewHead = (currentBlockNumber, currentBlockHash, currentBlockAuthors, parentBlockHash, newActiveAccountIds) => {
    this.setState({
      currentBlockNumber,
      currentBlockHash,
      currentBlockAuthors,
      parentBlockHash,
      activeAccountIds: newActiveAccountIds
    });
  }

  randomColor = () => {
    this.setState({ birdColor: [Math.random()*255, Math.random()*255, Math.random()*255] })
  }

  render() {
    const { activeAccountIds, birdColor, chain, currentBlockNumber, currentBlockHash, currentBlockAuthors, parentBlockHash } = this.state;

    return (
      <div>
        {/* <button onClick={this.randomColor}>Random Color</button> */}
        <div className="brandname">FlappyTips</div>
        <div className="instructions">Tap screen or press Spacebar to fly the DOT through block obstacles</div>
        <P5Wrapper
          sketch={sketch}
          color={birdColor}
          chain={chain}
          currentBlockNumber={currentBlockNumber}
          currentBlockHash={currentBlockHash}
          currentBlockAuthors={currentBlockAuthors}
          parentBlockHash={parentBlockHash}
          activeAccountIds={activeAccountIds}
        ></P5Wrapper>
      </div>
    );
  }
}

export default Game;
