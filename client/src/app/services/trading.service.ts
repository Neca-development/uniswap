import { ProvidersService } from './providers.service';
import { Injectable } from '@angular/core';
import { Fetcher, WETH, Route, Trade, TokenAmount, Percent, TradeType } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { environment } from './../../environments/environment';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class TradingService {

  // IDEA: mb should remove settings service
  constructor(private settingsService: SettingsService, private providersService: ProvidersService){}

  getEthersProvider(chainIdInput){
    return ethers.getDefaultProvider(chainIdInput, {
      infura: {
          projectId: environment.INFURA_PROJECT_ID,
          projectSecret: environment.INFURA_PROJECT_SECRET,
      },
      etherscan: environment.ETHERSCAN_API_KEY,
      alchemy: environment.ALCHEMY_API_KEY
    });
  }

  getCountWithDecimals(count, decimal){
    const trueAmount = count * 10 ** decimal;
    return ''+trueAmount;
  }

  async getGasPrice(chainIdInput){
    const gasPrice = await this.getEthersProvider(chainIdInput).getGasPrice();
    return gasPrice;
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

  async getTokenXBalance(tokenAddress, walletAddress){
    const web3 = this.providersService.getProvider();

    const tokenABI = require('../../assets/abi-token.json');

    const contract = new web3.eth.Contract(tokenABI, tokenAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const decimals = await contract.methods.decimals().call();

    return balance/10**decimals;
  }

  async getTokenXSymbol(tokenAddress){
    const web3 = this.providersService.getProvider();

    const tokenABI = require('../../assets/abi-token.json');

    const contract = new web3.eth.Contract(tokenABI, tokenAddress);
    const symbol = await contract.methods.symbol().call();

    return symbol;
  }

  async getCurrentBlockNumber(){
    const web3 = this.providersService.getProvider();
    const blockInfo = await web3.eth.getBlock('latest');

    return blockInfo.number;
  }

  getAccount(privateKey, chainIdInput){
    const signer = new ethers.Wallet(privateKey);
    const account = signer.connect(this.getEthersProvider(chainIdInput));

    return account;
  }

  async getToken(tokenAddress, chainIdInput){
    const web3 = this.providersService.getProvider();
    const chainId = chainIdInput;

    try {
      const tokenChecksummedAddress = web3.utils.toChecksumAddress(tokenAddress);
      const tokenB = await Fetcher.fetchTokenData(chainId, tokenChecksummedAddress);
      return tokenB
    } catch (error) {
      return false
    }
  }

  async getPairLiquidity (tokenAddress, chainIdInput){
    const web3 = this.providersService.getProvider();
    const chainId = chainIdInput;

    const tokenB = await this.getToken(tokenAddress, chainId);

    if(!tokenB){
      return {
        error: true,
        weth: 0,
        tokenX: 0
      };
    }

    const pair = await Fetcher.fetchPairData(WETH[chainId], tokenB);

    const tokenABI = require('../../assets/abi-token.json');

    async function getTokenAmountByAddress(tokenAddress, token = WETH[chainId]){
      const contract = new web3.eth.Contract(tokenABI, tokenAddress);
      const balance = await contract.methods.balanceOf(pair.liquidityToken.address).call();
      const decimals = await contract.methods.decimals().call();
      return balance/10**decimals;
    }

    return {
      error: false,
      pairAddress: pair.liquidityToken.address,
      weth: await getTokenAmountByAddress(WETH[chainId].address),
      tokenX: await getTokenAmountByAddress(tokenAddress, tokenB),
      tokenSymbol: await this.getTokenXSymbol(tokenAddress)
    }
  }

  async getTrade(inputTokenB, count, chainIdInput){
    let web3 = this.providersService.getProvider();
    const chainId =  chainIdInput;

    const tokenBAddress = web3.utils.toChecksumAddress(inputTokenB);
    const tokenB = await Fetcher.fetchTokenData(chainId, tokenBAddress);

    const pair = await Fetcher.fetchPairData(WETH[chainId], tokenB);

    const route = new Route([pair], WETH[chainId]);
    const amountIn = this.getCountWithDecimals(+count || 1, WETH[chainId].decimals);

    const trade = new Trade(route, new TokenAmount(WETH[chainId], amountIn), TradeType.EXACT_INPUT);

    return { tokenA: WETH[chainId], tokenB, midPrice: route.midPrice.toSignificant(6), executionPrice: trade.executionPrice.toSignificant(6), trade }
  }

  async initTransaction(inputTokenB, inputCount, walletAddress, privateKey, chainIdInput, inputSlippage = 0.5, inputDeadline = 20){
    const web3 = this.providersService.getProvider();

    const signer = new ethers.Wallet(privateKey, this.getEthersProvider(chainIdInput));
    const account = signer.connect(this.getEthersProvider(chainIdInput));


    // TODO: move out getTrage (?)
    const { tokenA, tokenB, trade } = await this.getTrade(inputTokenB, inputCount, chainIdInput);

    // TRANSACTION VALUES
    const slippageTolerance = new Percent((inputSlippage * 10).toString(), '1000'); //(делимое, делитель) // bip = 0.001

    const amountOutMin = web3.utils.numberToHex(trade.minimumAmountOut(slippageTolerance).raw.toString());
    const path = [tokenA.address, tokenB.address];
    const to = walletAddress;
    const deadline = Math.floor(Date.now() / 1000) + 60 * inputDeadline;
    const value = web3.utils.numberToHex(trade.inputAmount.raw.toString());

    const gasLimit = web3.utils.numberToHex('300000');
    const gasPrice = web3.utils.numberToHex((await web3.eth.getGasPrice()).toString());

    // CONTRACT INIT (we may add other contracts)
    const uniswap = new ethers.Contract(environment.ROUTER_ADDRESS, [
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
