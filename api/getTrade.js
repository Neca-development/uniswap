const { WETH, ChainId, Fetcher, Route, Trade, TokenAmount, TradeType } = require('@uniswap/sdk');

const Web3 = require('web3');
const [ getCountWithDecimals ] = require('../utils');

async function getTrade(inputTokenB, count){
  let web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);
  const chainId =  ChainId.ROPSTEN;

  const tokenBAddress = web3.utils.toChecksumAddress(inputTokenB);
  const tokenB = await Fetcher.fetchTokenData(chainId, tokenBAddress);

  const pair = await Fetcher.fetchPairData(WETH[chainId], tokenB);
  
  const route = new Route([pair], WETH[chainId]);

  const amountIn = getCountWithDecimals(count || 1, WETH[chainId].decimals);

  const trade = new Trade(route, new TokenAmount(WETH[chainId], amountIn), TradeType.EXACT_INPUT);

  return { tokenA: WETH[chainId], tokenB, midPrice: route.midPrice.toSignificant(6), executionPrice: trade.executionPrice.toSignificant(6), trade }
}

module.exports = getTrade;