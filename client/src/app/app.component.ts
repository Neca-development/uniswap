import { ProvidersService } from './services/providers.service';
import { TradingService } from './services/trading.service';
import { Component, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'client';

  swapInitValues = {
    tokenAddress: '',
    tokenSymbol: 'tokenX',
    isTokenValid: false,
    tokenAmount: '1',
    gasVariant: false,
    gasPrice: '',
    active: false,
  }

  dataInitValues = {
    balance: {
      eth: '0',
      tokenX: 0
    },
    liquidity: {
      loading: false,
      weth: 0,
      tokenX: 0
    },
    currentBlock: 0,
    status: 'waiting for liquidity'
  }

  swap;
  data;
  settings;

  constructor(private settingsService: SettingsService, private tradingService: TradingService, private providersService: ProvidersService){}

  ngOnInit(): void {
    this.updateComponent();

    setInterval(async () => {
      this.data.currentBlock = await this.tradingService.getCurrentBlockNumber();

      if(this.settings.address){
        this.data.balance.eth = await this.tradingService.getBalance(this.settings.address);
      }
    }, 2000)

    // setInterval(async() => {
    //   await this.tradingService.getLiquidityTransactions();
    // }, 5000)

  }

  async changeHandler(field, { target }){
    this.swap[field] = target.value;

    if(field == 'tokenAddress'){
      this.data.liquidity.loading = true;
      const response = await this.tradingService.getPairLiquidity(target.value);

      if(this.settings.address){
        this.data.balance.tokenX = await this.tradingService.getTokenXBalance(target.value, this.settings.address);
      }

      const { error, weth, tokenX } = response;

      if(error){
        console.log('Invalid token');
        //TODO: add error boundary
      }

      this.data.liquidity = { loading: false,  weth, tokenX };
    }
  }

  async changeGasTypeHandler({value}){
    this.swap.gasVariant = value == 'default'? false : true;
  }

  async updateComponent(){
    console.log('update');

    this.swap = this.swapInitValues;
    this.data = this.dataInitValues;
    this.settings = this.settingsService.getSettings();
    this.providersService.setProvider(this.settings.network.nodeAddress);

    if(this.settings.privateKey){
      this.settings.address = await this.tradingService.getAddressFromPrivateKey(this.settings.privateKey);
    }
  }

  async submitSwap(){
    if(this.settings.address){
      this.swap.active = true;
      this.data.status = "Waiting for liquidity to be added";
      this.data.status = 'Liquidity tx in the pending block';
      await this.tradingService.initTransaction(this.swap.tokenAddress, this.swap.tokenAmount, this.settings.address, this.settings.privateKey);
      this.data.status = `Swap executed in block ${this.data.currentBlock + ''}`;
      // this.swap.active = false;
    } else {
      console.log('enter private key');

      //TODO: add error boundary
    }
  }
}
