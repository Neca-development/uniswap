const getLiquidityTransactions = require('./getLiquidityTransactions');

async function getExactTokenLiquidityTransactions(tokenAddress) {
  const liquidityTransactions = await getLiquidityTransactions();
  
  const filteredByToken = liquidityTransactions.filter((tx) => tx.token == tokenAddress);

  return filteredByToken;
}

module.exports = getExactTokenLiquidityTransactions;