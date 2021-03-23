const path = require('path');
const InputDataDecoder = require('ethereum-input-data-decoder');
const decoder = new InputDataDecoder(path.resolve(__dirname, '../abis/abi.json'));

async function getDataIfLiquidityTransaction(web3, transactionHash){
  try {
    const transaction = await web3.eth.getTransaction(transactionHash);
    
    if(transaction?.to == '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'){
      const decodedData = decoder.decodeData(transaction.input);

      if (decodedData.method == 'addLiquidityETH'){
        return {
          hash: transactionHash,
          token: '0x' + decodedData.inputs[0]
        }
      }
    }

    return false
  } catch (error) {
    throw new Error(error);
  } 
}

module.exports = getDataIfLiquidityTransaction;