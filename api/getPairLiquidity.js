const Web3 = require('web3');
const { WETH, ChainId, Fetcher } = require('@uniswap/sdk');


async function getPairLiquidity (tokenAddress){
  const web3 = new Web3(process.env.INFURA_WSS_ROPSTEN);
  const chainId = ChainId.ROPSTEN;

  const tokenChecksummedAddress = web3.utils.toChecksumAddress(tokenAddress);
  const tokenB = await Fetcher.fetchTokenData(chainId, tokenChecksummedAddress);
  const pair = await Fetcher.fetchPairData(WETH[chainId], tokenB);
  
  const tokenABI = [
    {
      "constant":true,
      "inputs":[{"name":"_owner","type":"address"}],
      "name":"balanceOf",
      "outputs":[{"name":"balance","type":"uint256"}],
      "type":"function"
    },
    {
      "constant":true,
      "inputs":[],
      "name":"decimals",
      "outputs":[{"name":"","type":"uint8"}],
      "type":"function"
    }
  ];

  async function getTokenAmountByAddress(tokenAddress){
    const contract = new web3.eth.Contract(tokenABI, tokenAddress);  
    const balance = await contract.methods.balanceOf(pair.liquidityToken.address).call();
    const decimals = getDecimals(tokenAddress);
    return balance/10**decimals;
  }

  function getDecimals(tokenAddress){
    if(tokenAddress != WETH[chainId].address){
      const { decimals } = tokenB;
      return decimals;
    }

    return WETH[chainId].decimals;
  }

  return {
    pairAddress: pair.liquidityToken.address,
    wethAddress: WETH[chainId].address,
    tokenXAddress: tokenChecksummedAddress,
    weth: await getTokenAmountByAddress(WETH[chainId].address),
    tokenX: await getTokenAmountByAddress(tokenAddress)
  }
}

module.exports = getPairLiquidity;