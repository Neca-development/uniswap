async function getTransactionStatus(web3, txHash){
  const receipt = await web3.eth.getTransactionReceipt(txHash);
  return receipt?.status || null;
}

module.exports = getTransactionStatus;