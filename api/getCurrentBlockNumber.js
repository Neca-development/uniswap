const Web3 = require('web3');

async function getCurrentBlockNumber(){
  const web3 = new Web3("wss://ropsten.infura.io/ws/v3/b701310dbaa544e787aeead2e1535bdb");
  const blockInfo = await web3.eth.getBlock('latest');

  return blockInfo.number;
}

module.exports = getCurrentBlockNumber;