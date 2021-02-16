const { Router } = require('express');
const router = Router();

const UNISWAP = require('@uniswap/sdk');

router.get('/:code', async (req, res) => {
  try {
    res.json({ message: `The chainId of mainnet is ${UNISWAP.ChainId.MAINNET}` });
  } catch (e) {
    res.status(500).json({
      message: 'Что-то пошло не так, попробуйте снова',
    });
  }
});

module.exports = router;
