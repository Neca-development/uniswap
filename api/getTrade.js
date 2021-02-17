const UNISWAP = require('@uniswap/sdk');
const ETHERS = require('ethers');

const [getCountWithDecimals] = require('./utils');

async function getTrade(inputTokenA, inputTokenB, count){
  const chainId = UNISWAP.ChainId.MAINNET;

  const tokenAAddress = ETHERS.ethers.utils.getAddress(inputTokenA);
  const tokenA = await UNISWAP.Fetcher.fetchTokenData(chainId, tokenAAddress);

  const tokenBAddress = ETHERS.ethers.utils.getAddress(inputTokenB);
  const tokenB = await UNISWAP.Fetcher.fetchTokenData(chainId, tokenBAddress);

  const pair = await UNISWAP.Fetcher.fetchPairData(tokenA, tokenB);
  
  const route = new UNISWAP.Route([pair], tokenA);
  const amountIn = getCountWithDecimals(count || 1, tokenA.decimals);

  const trade = new UNISWAP.Trade(route, new UNISWAP.TokenAmount(tokenA, amountIn), UNISWAP.TradeType.EXACT_INPUT);

  return {tokenA, tokenB, midPrice: route.midPrice.toSignificant(6), executionPrice: trade.executionPrice.toSignificant(6), trade}
}

module.exports = getTrade;