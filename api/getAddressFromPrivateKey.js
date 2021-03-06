const Web3 = require('web3');

async function getAddressFromPrivateKey(privateKey){
  const web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  
  return account.address;
}

module.exports = getAddressFromPrivateKey;