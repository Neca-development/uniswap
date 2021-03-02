const { Percent } = require('@uniswap/sdk');
const { ethers } = require('ethers');

const [ getIntFromPercent ] = require('../utils');
const getTrade = require('./getTrade');

async function initTransaction(inputTokenB, inputCount, inputSlippage, inputDeadline){
  const { tokenA, tokenB, trade } = await getTrade(inputTokenB, inputCount);
  const provider = require('../network/provider');
  const account = require('../network/account');

  // TRANSACTION VALUES
  const slippageTolerance = new Percent(getIntFromPercent(inputSlippage).toString(), '1000');

  const amountOutMin = ethers.BigNumber.from(trade.minimumAmountOut(slippageTolerance).raw.toString()).toHexString();
  const path = [tokenA.address, tokenB.address];
  const to = process.env.PUBLIC_KEY;
  const deadline = Math.floor(Date.now() / 1000) + 60 * inputDeadline;
  const value = ethers.BigNumber.from(trade.inputAmount.raw.toString()).toHexString();

  const gasLimit = ethers.BigNumber.from('300000').toHexString();
  const gasPrice = (await provider.getGasPrice()).toHexString();

  // CONTRACT INIT (we may add other contracts)
  const uniswap = new ethers.Contract(process.env.ROUTER_ADDRESS, [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'
  ], account);
  
  // TRANSACTION INIT
  const tx = await uniswap.swapExactETHForTokens(amountOutMin, path, to, deadline, {value, gasPrice, gasLimit});
  
  console.log(`Transaction hash ${tx.hash}`);

  const receipt = await tx.wait();

  console.log(`Transaction was mined in block ${receipt.blockNumber}`);
}

module.exports = initTransaction;