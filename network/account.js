const { ethers } = require('ethers');
const provider = require('./provider');

// WALLET SETTINGS
const getAccount = (privateKey) => {
  const signer = new ethers.Wallet(privateKey);
  const account = signer.connect(provider);

  return account;
}

module.exports = getAccount;