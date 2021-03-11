const getLiquidityTransactions = require('./getLiquidityTransactions');

async function getExactTokenLiquidityTransactions(tokenAddress, nodeAddress) {
  const liquidityTransactions = await getLiquidityTransactions(nodeAddress);

  const filteredByToken = liquidityTransactions.filter((tx) => tx.token == tokenAddress);

  return filteredByToken;
}

module.exports = getExactTokenLiquidityTransactions;