import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import Web3 from 'web3';

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {

  web3: Web3;

  getProvider(){
    return this.web3;
  }

  //TODO: add network switcher
  async setProvider(network?){
    const web3 = await new Web3(environment.INFURA_WSS_ROPSTEN);
    this.web3 = web3;
  }
}
