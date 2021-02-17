const { ChainId, Fetcher, Route, Trade, TokenAmount, TradeType } = require('@uniswap/sdk');
const { ethers } = require('ethers');

const [getCountWithDecimals] = require('./utils');

async function getTrade(inputTokenA, inputTokenB, count){
  const chainId =  ChainId.ROPSTEN;

  const tokenAAddress = ethers.utils.getAddress(inputTokenA);
  const tokenA = await Fetcher.fetchTokenData(chainId, tokenAAddress);

  const tokenBAddress = ethers.utils.getAddress(inputTokenB);
  const tokenB = await Fetcher.fetchTokenData(chainId, tokenBAddress);

  const pair = await Fetcher.fetchPairData(tokenA, tokenB);
  
  const route = new Route([pair], tokenA);
  const amountIn = getCountWithDecimals(count || 1, tokenA.decimals);

  const trade = new Trade(route, new TokenAmount(tokenA, amountIn), TradeType.EXACT_INPUT);

  return {tokenA, tokenB, midPrice: route.midPrice.toSignificant(6), executionPrice: trade.executionPrice.toSignificant(6), trade}
}

module.exports = getTrade;