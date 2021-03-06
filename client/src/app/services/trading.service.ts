import { ProvidersService } from './providers.service';
import { Injectable } from '@angular/core';
import { Fetcher, ChainId, WETH, Route, Trade, TokenAmount, Percent, TradeType  } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { environment } from './../../environments/environment';
// import InputDataDecoder from 'ethereum-input-data-decoder';
// const decoder = new InputDataDecoder('../../assets/abi.json');

@Injectable({
  providedIn: 'root'
})
export class TradingService {

  provider = ethers.getDefaultProvider('ropsten', {
    infura: {
        projectId: environment.INFURA_PROJECT_ID,
        projectSecret: environment.INFURA_PROJECT_SECRET,
    },
    etherscan: environment.ETHERSCAN_API_KEY,
    alchemy: environment.ALCHEMY_API_KEY
  });

  constructor(private providersService: ProvidersService){}

  getCountWithDecimals(count, decimal){
    const trueAmount = count * 10 ** decimal;
    return ''+trueAmount;
  }

  async getAddressFromPrivateKey(privateKey){
    const web3 = this.providersService.getProvider();
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    return account.address;
  }

  async getBalance(address){
    const web3 = this.providersService.getProvider();
    const amount = await web3.eth.getBalance(address);

    return web3.utils.fromWei(amount, 'ether');
  }

  async getCurrentBlockNumber(){
    const web3 = this.providersService.getProvider();
    const blockInfo = await web3.eth.getBlock('latest');

    return blockInfo.number;
  }

  getAccount(privateKey){
    const signer = new ethers.Wallet(privateKey);
    const account = signer.connect(this.provider);

    return account;
  }


// async getLiquidityTransactions(blockNumber = 'pending') {
//   const web3 = this.providersService.getProvider();

//   const blockInfo = await web3.eth.getBlock(blockNumber, true);
//   const transactionsToRouter = blockInfo.transactions.filter((tx) => tx.to == process.env.ROUTER_ADDRESS);

//   const addLiquidityTransactions = transactionsToRouter.filter((tx) => {
//     const decodedData = decoder.decodeData(tx.input);

//     if (decodedData.method == 'addLiquidityETH'){
//       return true;
//     }
//   });

//   const output = addLiquidityTransactions.map((tx) => {
//     const decodedData = decoder.decodeData(tx.input);

//     return {
//       hash: tx.hash,
//       token: '0x' + decodedData.inputs[0]
//     }
//   })

//   return output;
// }

  // async getExactTokenLiquidityTransactions(tokenAddress) {
  //   const liquidityTransactions = await this.getLiquidityTransactions();

  //   const filteredByToken = liquidityTransactions.filter((tx) => tx.token == tokenAddress);

  //   return filteredByToken;
  // }


  // TODO: fix chain id
  async getPairLiquidity (tokenAddress){
    const web3 = this.providersService.getProvider();
    const chainId = ChainId.ROPSTEN;

    const tokenChecksummedAddress = web3.utils.toChecksumAddress(tokenAddress);
    const tokenB = await Fetcher.fetchTokenData(chainId, tokenChecksummedAddress);
    const pair = await Fetcher.fetchPairData(WETH[chainId], tokenB);

    const tokenABI: any = [
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
      },
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

  async getTrade(inputTokenB, count){
    let web3 = this.providersService.getProvider();
    const chainId =  ChainId.ROPSTEN;

    const tokenBAddress = web3.utils.toChecksumAddress(inputTokenB);
    const tokenB = await Fetcher.fetchTokenData(chainId, tokenBAddress);

    const pair = await Fetcher.fetchPairData(WETH[chainId], tokenB);

    const route = new Route([pair], WETH[chainId]);
    const amountIn = this.getCountWithDecimals(+count || 1, WETH[chainId].decimals);

    const trade = new Trade(route, new TokenAmount(WETH[chainId], amountIn), TradeType.EXACT_INPUT);

    return { tokenA: WETH[chainId], tokenB, midPrice: route.midPrice.toSignificant(6), executionPrice: trade.executionPrice.toSignificant(6), trade }
  }

  async initTransaction(inputTokenB, inputCount, walletAddress, privateKey, inputSlippage = 0.5, inputDeadline = 20){
    const web3 = this.providersService.getProvider();

    const signer = new ethers.Wallet(privateKey);
    const account = signer.connect(this.provider);


    // TODO: move out getTrage
    const { tokenA, tokenB, trade } = await this.getTrade(inputTokenB, inputCount);

    // TRANSACTION VALUES
    const slippageTolerance = new Percent((inputSlippage * 10).toString(), '1000'); //(делимое, делитель) // bip = 0.001

    const amountOutMin = web3.utils.numberToHex(trade.minimumAmountOut(slippageTolerance).raw.toString());
    const path = [tokenA.address, tokenB.address];
    const to = walletAddress;
    const deadline = Math.floor(Date.now() / 1000) + 60 * inputDeadline;
    const value = web3.utils.numberToHex(trade.inputAmount.raw.toString());

    const gasLimit = web3.utils.numberToHex('300000');
    const gasPrice = web3.utils.numberToHex((await this.provider.getGasPrice()).toString());

    // CONTRACT INIT (we may add other contracts)
    const uniswap = new ethers.Contract(process.env.ROUTER_ADDRESS, [
      'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'
    ], account);

    // TRANSACTION INIT
    const tx = await uniswap.swapExactETHForTokens(amountOutMin, path, to, deadline, {value, gasPrice, gasLimit});

    console.log(`Transaction hash ${tx.hash}`);

    const receipt = await tx.wait();

    console.log(`Transaction was mined in block ${receipt.blockNumber}`);

    return {hash: tx.hash, blockNumber: receipt.blockNumber};
  }
}
