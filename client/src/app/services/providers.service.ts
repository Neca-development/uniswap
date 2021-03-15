import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import Web3 from './../../assets/web3.min.js';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {

  web3: Web3;

  getProvider(){
    return this.web3;
  }

  async setProvider(network?){
    const web3 = new Web3(network? network : environment.INFURA_WSS_ROPSTEN);
    this.web3 = web3;
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

  getEthersProvider(chainIdInput){
    const provider = ethers.getDefaultProvider(chainIdInput, {
      infura: {
          projectId: environment.INFURA_PROJECT_ID,
          projectSecret: environment.INFURA_PROJECT_SECRET,
      },
      etherscan: environment.ETHERSCAN_API_KEY,
      alchemy: environment.ALCHEMY_API_KEY
    });

    return provider;
  }
}
