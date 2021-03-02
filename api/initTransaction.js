const { Percent } = require('@uniswap/sdk');
const { ethers } = require('ethers');
const Web3 = require('web3');

const [ getIntFromPercent ] = require('../utils');
const getTrade = require('./getTrade');

async function initTransaction(inputTokenB, inputCount, inputSlippage, inputDeadline){
  const web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);
  const provider = require('../network/provider');
  const account = require('../network/account');
  
  const { tokenA, tokenB, trade } = await getTrade(inputTokenB, inputCount);

  // TRANSACTION VALUES
  const slippageTolerance = new Percent(getIntFromPercent(inputSlippage).toString(), '1000');

  const amountOutMin = web3.utils.numberToHex(trade.minimumAmountOut(slippageTolerance).raw.toString());
  const path = [tokenA.address, tokenB.address];
  const to = process.env.PUBLIC_KEY;
  const deadline = Math.floor(Date.now() / 1000) + 60 * inputDeadline;
  const value = web3.utils.numberToHex(trade.inputAmount.raw.toString());

  const gasLimit = web3.utils.numberToHex('300000');
  const gasPrice = web3.utils.numberToHex(await provider.getGasPrice());

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