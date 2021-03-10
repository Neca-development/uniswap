import { ProvidersService } from './services/providers.service';
import { TradingService } from './services/trading.service';
import { Component, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';
import { webSocket } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'client';

  swap = {
    tokenAddress: '',
    tokenSymbol: 'tokenX',
    isTokenValid: false,
    tokenAmount: '1',
    gasVariant: false,
    gasPrice: '',
    active: false,
  };

  data  = {
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
  };

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

    // this.swap = this.swapInitValues;
    // this.data = this.dataInitValues;
    this.settings = this.settingsService.getSettings();
    this.providersService.setProvider(this.settings.network.nodeAddress);

    if(this.settings.privateKey){
      this.settings.address = await this.tradingService.getAddressFromPrivateKey(this.settings.privateKey);
    }
  }

  async submitSwap(){
    const ws = webSocket('ws://localhost:3000');
    this.data.status = "Waiting for liquidity to be added";

    const observableA = ws.multiplex(
      () => ({type: 'subscribeLiquidity', tokenAddress: this.swap.tokenAddress, nodeAddress: this.settings.network.nodeAddress || environment.INFURA_WSS_ROPSTEN}),
      () => ({type: 'unsubscribe'}), // ...and when gets this one, it will stop.
      message => true // If the function returns `true` message is passed down the stream. Skipped if the function returns false.
    );


    const subA = observableA.subscribe(async message => {
      console.log(message);
      this.swap.active = true;

      if(message.type == 'success' || message.type == 'error'){
        subA.unsubscribe();

        if(message.type == 'success' && this.settings.address){
          this.data.status = 'Liquidity tx in the pending block';
          try {
            await this.tradingService.initTransaction(this.swap.tokenAddress, this.swap.tokenAmount, this.settings.address, this.settings.privateKey);
            this.data.status = `Swap executed in block ${this.data.currentBlock + ''}`;
          } catch (error) {
            this.data.status = 'Swap failed to execute';
          }
        } else {
          // TODO: error boundary
        }
      }
    });
  }
}
