const { Router } = require('express');
const router = Router();

const getTrade = require('../api/getTrade');
const initTransaction = require('../api/initTransaction');
const getExactTokenLiquidityTransactions = require('../api/getExactTokenLiquidityTransactions');
const getLiquidityTransactions = require('../api/getLiquidityTransactions');
const getPairLiquidity = require('../api/getPairLiquidity');
const getBalance = require('../api/getBalance');

router.get('/getExactTokenLiquidityTransactions', async (req, res) => {
  try {
    res.json(await getExactTokenLiquidityTransactions(req.query.token));
  } catch (e) {
    res.status(500).json({
      message: e,
    });
  }
});

router.get('/getPairLiquidity', async (req, res) => {
  try {
    res.json(await getPairLiquidity(req.query.tokenAddress));
  } catch (e) {
    res.status(500).json({
      message: e,
    });
  }
});

router.get('/getLiquidityTransactions', async (req, res) => {
  try {
    res.json(await getLiquidityTransactions(req.query.number));
  } catch (e) {
    res.status(500).json({
      message: e,
    });
  }
});

router.get('/getBalance', async (req, res) => {
  try {
    res.json(await getBalance(req.query.address));
  } catch (e) {
    res.status(500).json({
      message: e,
    });
  }
});

router.get('/getTrade', async (req, res) => {
  try {
    res.json(await getTrade(req.query.tokenB, req.query.count));
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

router.get('/getTransaction', async (req, res) => {
  try {
    res.json(await initTransaction(req.query.tokenA, req.query.tokenB, req.query.count, req.query.slippage, req.query.deadline))
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: e.message,
    });
  }
});

module.exports = router;
