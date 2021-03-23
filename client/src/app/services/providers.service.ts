import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import Web3 from './../../assets/web3.min.js';
import { ethers, providers } from 'ethers';

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {

  web3: Web3;
  ethers: ethers.providers.BaseProvider;

  getProvider(){
    return this.web3;
  }

  async setProvider(network){
    const dotsIndex = network.indexOf('://');
    const httpsFromWss = 'https' + network.slice(dotsIndex);

    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(network),
      new Web3.providers.HttpProvider(
        httpsFromWss, {
        headers: [{
          name: 'Access-Control-Allow-Origin',
          value: httpsFromWss
        }],
        mode: "no-cors",
      })
    );

    this.web3.eth.net.isListening().then(res => console.log('Connected to ' + network))
    this.ethers = ethers.getDefaultProvider(network, {
      infura: environment.INFURA_PROJECT_ID,
      etherscan: environment.ETHERSCAN_API_KEY,
      alchemy: environment.ALCHEMY_API_KEY
    });
  }

  async getChainId(network){
    try {
      const web3 = new Web3(network);
      const chainId = await web3.eth.getChainId();
      return chainId;
    } catch (error) {
      return false;
    }
  }

  getEthersProvider(){
    return this.ethers;
  }
}
