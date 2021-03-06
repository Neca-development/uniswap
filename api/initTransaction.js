const { Percent } = require('@uniswap/sdk');
const { ethers } = require('ethers');
const Web3 = require('web3');

const [ getBipsFromPercent ] = require('../utils');
const getTrade = require('./getTrade');

async function initTransaction(inputTokenB, inputCount, walletAddress, privateKey, inputSlippage = 0.5, inputDeadline = 20){
  const web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);
  const provider = require('../network/provider');
  const getAccount = require('../network/account');
  
  const { tokenA, tokenB, trade } = await getTrade(inputTokenB, inputCount);

  // TRANSACTION VALUES
  const slippageTolerance = new Percent((inputSlippage * 10).toString(), '1000'); //(делимое, делитель) // bip = 0.001

  const amountOutMin = web3.utils.numberToHex(trade.minimumAmountOut(slippageTolerance).raw.toString());
  const path = [tokenA.address, tokenB.address];
  const to = walletAddress;
  const deadline = Math.floor(Date.now() / 1000) + 60 * inputDeadline;
  const value = web3.utils.numberToHex(trade.inputAmount.raw.toString());

  const gasLimit = web3.utils.numberToHex('300000');
  const gasPrice = web3.utils.numberToHex(await provider.getGasPrice());

  // CONTRACT INIT (we may add other contracts)
  const uniswap = new ethers.Contract(process.env.ROUTER_ADDRESS, [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'
  ], getAccount(privateKey));
  
  // TRANSACTION INIT
  const tx = await uniswap.swapExactETHForTokens(amountOutMin, path, to, deadline, {value, gasPrice, gasLimit});
  
  console.log(`Transaction hash ${tx.hash}`);

  const receipt = await tx.wait();

  console.log(`Transaction was mined in block ${receipt.blockNumber}`);

  return {hash: tx.hash, blockNumber: receipt.blockNumber};
}

module.exports = initTransaction;