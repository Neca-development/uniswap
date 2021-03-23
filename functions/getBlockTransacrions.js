async function getBlockTransacrions(web3, blockNumber){
  try {
    blockInfo = await web3.eth.getBlock(blockNumber, true);

    return blockInfo.transactions;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = getBlockTransacrions;