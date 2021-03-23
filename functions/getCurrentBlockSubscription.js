function getCurrentBlockSubscription(web3){
  try {
    return web3.eth.subscribe('newBlockHeaders');
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = getCurrentBlockSubscription;