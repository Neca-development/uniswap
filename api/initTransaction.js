const { Percent } = require('@uniswap/sdk');
const { ethers } = require('ethers');

const [ getIntFromPercent ] = require('./utils');
const getTrade = require('./getTrade');

async function initTransaction(inputTokenA, inputTokenB, inputCount, inputSlippage, inputDeadline){
  const { tokenA, tokenB, trade} = await getTrade(inputTokenA, inputTokenB, inputCount);

  // TRANSACTION VALUES
  const slippageTolerance = new Percent(getIntFromPercent(inputSlippage).toString(), '1000');

  const amountOutMin = ethers.BigNumber.from(trade.minimumAmountOut(slippageTolerance).raw.toString()).toHexString();
  const path = [tokenA.address, tokenB.address];
  const to = process.env.PUBLIC_KEY;
  const deadline = Math.floor(Date.now() / 1000) + 60 * inputDeadline;
  const value = ethers.BigNumber.from(trade.inputAmount.raw.toString()).toHexString();

  // PROVIDER SETTINGS
  const provider = ethers.getDefaultProvider('ropsten', {
    infura: {
        projectId: process.env.INFURA_PROJECT_ID,
        projectSecret: process.env.INFURA_PROJECT_SECRET,
    }, 
    etherscan: process.env.ETHERSCAN_API_KEY
  });

  const gasLimit = ethers.BigNumber.from(300000).toHexString();
  const gasPrice = (await provider.getGasPrice()).toHexString();

  // WALLET SETTINGS
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
  const account = signer.connect(provider);

  // CONTRACT INIT (we may add other contracts)
  const uniswap = new ethers.Contract('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'], account);
  
  
  // TRANSACTION INIT
  const tx = await uniswap.swapExactETHForTokens(amountOutMin, path, to, deadline, {value, gasPrice, gasLimit});

  console.log(`Transaction hash ${tx.hash}`);

  const receipt = await tx.wait();

  console.log(`Transaction was mined in block ${receipt.blockNumber}`);
}

module.exports = initTransaction;