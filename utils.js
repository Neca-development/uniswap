function getCountWithDecimals(count, decimal){
  const trueAmount = count * 10 ** decimal;
  return ''+trueAmount;
}

function getBipsFromPercent(percent){
  return percent * 10;
}

module.exports = [getCountWithDecimals, getBipsFromPercent];