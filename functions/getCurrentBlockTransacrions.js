const Web3 = require('web3');

async function getCurrentBlockTransacrions(nodeAddress){
  const web3 = new Web3(nodeAddress);

  blockInfo = await web3.eth.getBlock('latest', true);

  return blockInfo.transactions;
}

module.exports = getCurrentBlockTransacrions;