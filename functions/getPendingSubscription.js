const Web3 = require('web3');

function getPendingSubscription(nodeAddress){
  const web3 = new Web3(nodeAddress);
  return web3.eth.subscribe('pendingTransactions');
}

module.exports = getPendingSubscription;