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
    currentBlock: 0,
    status: 'waiting for liquidity'
  }

  settings;

  constructor(private settingsService: SettingsService, private tradingService: TradingService, private providersService: ProvidersService){}

  ngOnInit(): void {
    this.updateSettings();
    // this.providersService.setProvider();

    setInterval(async () => {
      // this.data.currentBlock = await this.tradingService.getCurrentBlockNumber();

    }, 2000)
  }

  changeHandler(field, { target }){
    this.swap[field] = target.value;

    if(field == 'tokenAddress'){
      this.tradingService.getPairLiquidity(target.value);
    }
  }

  changeGasTypeHandler({value}){
    this.swap.gasVariant = value == 'default'? false : true;
  }

  updateSettings(){
    this.settings = this.settingsService.getSettings();
    this.settings.address = this.tradingService.getAddressFromPrivateKey(this.settings.privateKey);
  }
}
