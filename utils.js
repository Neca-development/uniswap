function getCountWithDecimals(count, decimal){
  const trueAmount = (count + '000000000000000000').slice(0, decimal+1);
  return trueAmount;
}

function getIntFromPercent(percent){
  return percent * 10;
}

module.exports = [getCountWithDecimals, getIntFromPercent];