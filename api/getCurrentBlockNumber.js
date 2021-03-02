const Web3 = require('web3');

async function getCurrentBlockNumber(){
  const web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);
  const blockInfo = await web3.eth.getBlock('latest');

  return blockInfo.number;
}

module.exports = getCurrentBlockNumber;