const Web3 = require('web3');

function getCurrentBlockSubscription(nodeAddress){
  const web3 = new Web3(nodeAddress);
  return web3.eth.subscribe('newBlockHeaders');
}

module.exports = getCurrentBlockSubscription;