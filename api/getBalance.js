const Web3 = require('web3');

async function getBalance(address){
  const web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);
  const amount = await web3.eth.getBalance(address);
  
  return web3.utils.fromWei(amount, 'ether');
}

module.exports = getBalance;