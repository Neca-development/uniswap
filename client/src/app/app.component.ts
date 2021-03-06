import { Component, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'client';

  swap = {
    tokenAddress: '',
    tokenAmount: '1',
    gasVariant: false,
    gasPrice: '',
    active: false
  }

  data = {
    balance: {
      eth: '0',
      tokenX: '0'
    },
    liquidity: {
      weth: '0',
      tokenX: '0'
    },
    currentBlock: '1234567',
    status: 'waiting for liquidity'
  }

  settings;

  constructor(private settingsService: SettingsService, private apiService: ApiService){}

  ngOnInit(): void {
    this.updateSettings();

    setInterval(async () => {
      this.data.currentBlock = await this.apiService.get('/api/getCurrentBlockNumber');
      if(this.settings.address){
        this.data.balance.eth = await this.apiService.get('/api/getBalance', {walletAddress: this.settings.address});
      }
    }, 2000)
  }

  changeHandler(field, { target }){
    this.swap[field] = target.value;

    if(field == 'tokenAddress'){
      this.getLiquidity(target.value);
    }
  }

  changeGasTypeHandler({value}){
    this.swap.gasVariant = value == 'default'? false : true;
  }

  async getAddress(){
    if(this.settings.privateKey){
      this.settingsService.setAddress(await this.apiService.get('/api/getAddressFromPrivateKey', {privateKey: this.settings.privateKey}));
    }
  }

  async getLiquidity(address){
    if(address){
      const liquidity = await this.apiService.get('/api/getPairLiquidity', {tokenAddress: address});
      const { weth, tokenX } = liquidity;
      this.data.liquidity = { weth, tokenX };
    }
  }

  updateSettings(){
    this.settings = this.settingsService.getSettings();
    this.getAddress();
  }

  async initTransaction(){
    if(this.swap.tokenAddress && this.swap.tokenAmount && this.settings.address && this.settings.privateKey){
      this.swap.active = true;

      const params = {
        tokenAddress: this.swap.tokenAddress,
        count: this.swap.tokenAmount,
        walletAddress: this.settings.address,
        privateKey: this.settings.privateKey,
      };

      const receipt = await this.apiService.get('/api/getTransaction', params);

      this.swap.active = false;
    } else {
      //TODO: add alert
    }
  }
}
