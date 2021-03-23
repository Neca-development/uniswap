function getPendingSubscription(web3){
  try {
    return web3.eth.subscribe('pendingTransactions');
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = getPendingSubscription;