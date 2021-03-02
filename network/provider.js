const { ethers } = require('ethers');

// PROVIDER SETTINGS
const provider = ethers.getDefaultProvider('ropsten', {
  infura: {
      projectId: process.env.INFURA_PROJECT_ID,
      projectSecret: process.env.INFURA_PROJECT_SECRET,
  }, 
  etherscan: process.env.ETHERSCAN_API_KEY,
  alchemy: process.env.ALCHEMY_API_KEY
});

module.exports = provider;