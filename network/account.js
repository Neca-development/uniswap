const { ethers } = require('ethers');
const provider = require('./provider');

// WALLET SETTINGS
const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
const account = signer.connect(provider);

module.exports = account;