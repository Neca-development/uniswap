const { Router } = require('express');
const router = Router();

const UNISWAP = require('@uniswap/sdk');
const ETHERS = require('ethers');

router.get('/test', async (req, res) => {
  try {
    //paste your test code
    res.json({ message: 'test' });
  } catch (e) {
    res.status(500).json({
      message: 'Что-то пошло не так, попробуйте снова',
    });
  }
});

router.post('/getPrice', async (req, res) => {
  function getCountWithDecimals(count, decimal){
    const trueAmount = (count + '000000000000000000').slice(0, decimal+1);
    return trueAmount;
  }

  try {
    function getCountWithDecimals(count, decimal){
      const trueAmount = (count + '000000000000000000').slice(0, decimal);
      return trueAmount;
    }

    const chainId = UNISWAP.ChainId.MAINNET;

    const tokenAAddress = ETHERS.ethers.utils.getAddress(req.query.tokenA);
    const tokenA = await UNISWAP.Fetcher.fetchTokenData(chainId, tokenAAddress);

    const tokenBAddress = ETHERS.ethers.utils.getAddress(req.query.tokenB);
    const tokenB = await UNISWAP.Fetcher.fetchTokenData(chainId, tokenBAddress);

    const pair = await UNISWAP.Fetcher.fetchPairData(tokenA, tokenB);
    
    const route = new UNISWAP.Route([pair], tokenA);
    const amountIn = getCountWithDecimals(req.query.count || 1, tokenA.decimals);

    const trade = new UNISWAP.Trade(route, new UNISWAP.TokenAmount(tokenA, amountIn), UNISWAP.TradeType.EXACT_INPUT);

    res.json({ tokenA, tokenB, midPrice: `${route.midPrice.toSignificant(6)}`, executionPrice: trade.executionPrice.toSignificant(6) });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
})

module.exports = router;
