// SHOWS COUNTER OF LIQUIDITY TRANSACTIONS
const getExactTokenLiquidityTransactions = require('./api/getExactTokenLiquidityTransactions');

let store = new Set();
let counter = 0;
console.log(new Date().toTimeString());

setInterval(async () => {
  const results = await getExactTokenLiquidityTransactions('0xad6d458402f60fd3bd25163575031acdce07538d');

  results.map((tx) => store.add(tx.hash));

  if(store.size > counter){
    console.log(store.size);
    counter = store.size;
  }
}, 2000);