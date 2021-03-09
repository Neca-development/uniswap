const { Router } = require('express');
const router = Router();

const getTrade = require('../api/getTrade');
const initTransaction = require('../api/initTransaction');
const getExactTokenLiquidityTransactions = require('../api/getExactTokenLiquidityTransactions');
const getLiquidityTransactions = require('../api/getLiquidityTransactions');
const getPairLiquidity = require('../api/getPairLiquidity');
const getBalance = require('../api/getBalance');
const getCurrentBlockNumber = require('../api/getCurrentBlockNumber');
const getAddressFromPrivateKey = require('../api/getAddressFromPrivateKey');

router.get('/getAddressFromPrivateKey', async (req, res) => {
  try {
    res.json({data: await getAddressFromPrivateKey(req.query.privateKey)});
  } catch (e) {
    res.status(500).json({
      error: "1",
    });
  }
});

router.get('/getCurrentBlockNumber', async (req, res) => {
  try {
    res.json({data: await getCurrentBlockNumber()});
  } catch (e) {
    res.status(500).json({
      error: JSON.stringify(e)
    });
  }
});

router.get('/getExactTokenLiquidityTransactions', async (req, res) => {
  if(req.query.tokenAddress){
    try {
      res.json({data: await getExactTokenLiquidityTransactions(req.query.tokenAddress)});
    } catch (e) {
      res.status(500).json({
        error: "3",
      });
    }
  } else {
    res.status(400).json({
      error: 'Add token address to request'
    });
  }
});

router.get('/getPairLiquidity', async (req, res) => {
  if(req.query.tokenAddress){
    try {
      res.json({data: await getPairLiquidity(req.query.tokenAddress)});
    } catch (e) {
      res.status(500).json({
        error: "4",
      });
    }
  } else {
    res.status(400).json({
      error: 'Add token address to request'
    });
  }
});

router.get('/getLiquidityTransactions', async (req, res) => {
  try {
    res.json({data: await getLiquidityTransactions(req.query.blockNumber)});
  } catch (e) {
    res.status(500).json({
      error: "5",
    });
  }
});

router.get('/getBalance', async (req, res) => {
  if(req.query.walletAddress){
    try {
      res.json({data: await getBalance(req.query.walletAddress)});
    } catch (e) {
      res.status(500).json({
        error: "6",
      });
    }
  } else {
    res.status(400).json({
      error: 'Add wallet address to request'
    });
  }
});

router.get('/getTrade', async (req, res) => {
  if(req.query.tokenAddress && req.query.count){
    try {
      res.json({data: await getTrade(req.query.tokenAddress, req.query.count)});
    } catch (e) {
      res.status(500).json({
        error: e.message,
      });
    }
  } else {
    res.status(400).json({
      error: 'Add token address and ETH count to request'
    });
  }
});

router.get('/getTransaction', async (req, res) => {
  const {
    tokenAddress,
    count,
    slippage,
    deadline,
    walletAddress,
    privateKey
  } = req.query;

  if(tokenAddress && count && walletAddress && privateKey){
    try {
      res.json({data: await initTransaction(tokenAddress, count, walletAddress, privateKey, slippage, deadline)})
    } catch (e) {
      console.log(e);
      res.status(500).json({
        error: e.message,
      });
    }
  } else {
    res.status(400).json({
      error: 'Add token address, ETH count, slippage in percents and deadline in minutes to request'
    });
  }
});

module.exports = router;
