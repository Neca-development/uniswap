const { Router } = require('express');
const router = Router();

const getTrade = require('../api/getTrade');
const initTransaction = require('../api/initTransaction');

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

router.post('/getTrade', async (req, res) => {
  try {
    res.json(await getTrade(req.query.tokenA, req.query.tokenB, req.query.count));
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
})

router.post('/getTransaction', async (req, res) => {
  try {
    res.json(await initTransaction(req.query.tokenA, req.query.tokenB, req.query.count, req.query.slippage, req.query.deadline))
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: e.message,
    });
  }
})

module.exports = router;
