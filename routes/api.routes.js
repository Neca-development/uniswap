const { Router } = require('express');
const router = Router();

const getTrade = require('../api/getTrade');
const initTransaction = require('../api/initTransaction');
const getExactTokenLiquidityTransactions = require('../api/getExactTokenLiquidityTransactions');
const getLiquidityTransactions = require('../api/getLiquidityTransactions');
const getPairLiquidity = require('../api/getPairLiquidity');
const getBalance = require('../api/getBalance');
const getCurrentBlockNumber = require('../api/getCurrentBlockNumber');

router.get('/getCurrentBlockNumber', async (req, res) => {
  try {
    res.json(await getCurrentBlockNumber());
  } catch (e) {
    res.status(500).json({
      message: e,
    });
  }
});

router.get('/getExactTokenLiquidityTransactions', async (req, res) => {
  if(req.query.tokenAddress){
    try {
      res.json(await getExactTokenLiquidityTransactions(req.query.tokenAddress));
    } catch (e) {
      res.status(500).json({
        message: e,
      });
    }
  } else {
    res.status(500).json({
      message: 'Add token address to request'
    });
  }
});

router.get('/getPairLiquidity', async (req, res) => {
  if(req.query.tokenAddress){
    try {
      res.json(await getPairLiquidity(req.query.tokenAddress));
    } catch (e) {
      res.status(500).json({
        message: e,
      });
    }
  } else {
    res.status(500).json({
      message: 'Add token address to request'
    });
  }
});

router.get('/getLiquidityTransactions', async (req, res) => {
  try {
    res.json(await getLiquidityTransactions(req.query.blockNumber));
  } catch (e) {
    res.status(500).json({
      message: e,
    });
  }
});

router.get('/getBalance', async (req, res) => {
  if(req.query.walletAddress){
    try {
      res.json(await getBalance(req.query.walletAddress));
    } catch (e) {
      res.status(500).json({
        message: e,
      });
    }
  } else {
    res.status(500).json({
      message: 'Add wallet address to request'
    });
  }
});

router.get('/getTrade', async (req, res) => {
  if(req.query.tokenAddress && req.query.count){
    try {
      res.json(await getTrade(req.query.tokenAddress, req.query.count));
    } catch (e) {
      res.status(500).json({
        message: e.message,
      });
    }
  } else {
    res.status(500).json({
      message: 'Add token address and ETH count to request'
    });
  }
});

router.get('/getTransaction', async (req, res) => {
  if(req.query.tokenAddress && req.query.count && req.query.slippage && req.query.deadline){
    try {
      res.json(await initTransaction(req.query.tokenAddress, req.query.count, req.query.slippage, req.query.deadline))
    } catch (e) {
      console.log(e);
      res.status(500).json({
        message: e.message,
      });
    }
  } else {
    res.status(500).json({
      message: 'Add token address, ETH count, slippage in percents and deadline in minutes to request'
    });
  }
});

module.exports = router;
