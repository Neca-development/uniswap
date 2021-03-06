const Web3 = require('web3');
const path = require('path');
const InputDataDecoder = require('ethereum-input-data-decoder');
const decoder = new InputDataDecoder(path.resolve(__dirname, '../abi.json'));

async function getLiquidityTransactions(blockNumber = 'pending') {
  const web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);

  const blockInfo = await web3.eth.getBlock(blockNumber, true);
  const transactionsToRouter = blockInfo.transactions.filter((tx) => tx.to == process.env.ROUTER_ADDRESS);

  const addLiquidityTransactions = transactionsToRouter.filter((tx) => {
    const decodedData = decoder.decodeData(tx.input);

    if (decodedData.method == 'addLiquidityETH'){
      return true;
    }
  });

  const output = addLiquidityTransactions.map((tx) => {
    const decodedData = decoder.decodeData(tx.input);

    return {
      hash: tx.hash,
      token: '0x' + decodedData.inputs[0]
    }
  })

  return output;
}

module.exports = getLiquidityTransactions;