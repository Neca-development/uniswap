const Web3 = require('web3');

async function getBlockTransacrions(nodeAddress, blockNumber){
  const web3 = new Web3(nodeAddress);

  blockInfo = await web3.eth.getBlock(blockNumber, true);

  return blockInfo.transactions;
}

module.exports = getBlockTransacrions;