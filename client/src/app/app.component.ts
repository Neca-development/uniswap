import { NotificationsService } from './services/notifications.service';
import { WebsocketService } from './services/websocket.service';
import { ProvidersService } from './services/providers.service';
import { TradingService } from './services/trading.service';
import { Component, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';
import { PAIR_NO_PAIR } from "./errors/errors";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [NotificationsService]
})
export class AppComponent implements OnInit {

  swap = {
    tokenAddress: '',
    isTokenValid: false,
    tokenAmount: '0.01',
    gasVariant: false,
    gasPrice: '',
    gasLimit: '',
    active: false,
  };

  data  = {
    tokenSymbol: 'tokenX',
    balance: {
      isLoaderShown: false,
      loading: false,
      eth: '0',
      tokenX: 0
    },
    liquidity: {
      error: false,
      isLoaderShown: false,
      loading: false,
      weth: 0,
      tokenX: 0
    },
    currentBlock: 0,
    status: 'waiting for liquidity',
    isAddressValid: false,
    isNetworkChanging: false,
    isSwapWas: false
  };

  settings;
  subscription;

  constructor(
    private settingsService: SettingsService,
    private tradingService: TradingService,
    private providersService: ProvidersService,
    private websocketService: WebsocketService,
    private notificationsService: NotificationsService
  ){}

  ngOnInit(): void {
    this.updateComponent();

    setInterval(async () => {
      const tempCurrentBlock = await this.tradingService.getCurrentBlockNumber();

      if(tempCurrentBlock != this.data.currentBlock){
        this.data.currentBlock = tempCurrentBlock;

        if(this.swap.tokenAddress && this.swap.isTokenValid){
          this.updateLiquidity(this.swap.tokenAddress, false);
        }

        this.updateBalance(false);
      }
    }, 2000);
  }

  async checkSaveAction(isSaveAction = false){
    if(isSaveAction){
      this.updateComponent();
    }
  }

  async changeHandler(field, { target }){
    this.swap[field] = target.value;

    if(field == 'tokenAddress'){
      await this.updateLiquidity(target.value, true);
    }
  }

  async changeGasTypeHandler({value}){
    this.swap.gasVariant = value == 'default'? false : true;

    if(this.swap.gasVariant){
      this.swap.gasPrice = await this.tradingService.getGasPrice(this.settings.network.chainId) / 10 ** 9 + '';
    }
  }

  async updateComponent(){
    if(this.settings){
      const newSettings = this.settingsService.getSettings();

      if(newSettings.network.chainId !== this.settings.network.chainId){
        this.swap.tokenAddress = '';
        this.swap.gasVariant = false;
        this.data.isSwapWas = false;

        if(this?.subscription){
          this.subscription.unsubscribe();
          this.notificationsService.openSnackBar('Swap canceled');
          this.swap.active = false;
        }
      }

      this.settings = newSettings;
    } else {
      this.settings = this.settingsService.getSettings();
    }

    this.providersService.setProvider(this.settings.network.nodeAddress);

    if(this.swap.tokenAddress){
      this.updateLiquidity(this.swap.tokenAddress, true);
    }

    if(this.settings.privateKey){
      try {
        this.settings.address = await this.tradingService.getAddressFromPrivateKey(this.settings.privateKey);
        this.updateBalance(true);
        this.data.isAddressValid = true;
      } catch (error) {
        this.data.isAddressValid = false;
        this.notificationsService.openSnackBar('Check your Private Key');
      }
    }
  }

  async updateBalance(isLoaderShown){
    if(this.settings.address){
      this.data.balance.loading = true;
      this.data.balance.isLoaderShown = isLoaderShown;

      this.data.balance.eth = await this.tradingService.getBalance(this.settings.address);

      if(this.swap.isTokenValid){
        try {
          this.data.balance.tokenX = await this.tradingService.getTokenXBalance(this.swap.tokenAddress, this.settings.address);
        } catch (error) {}
      }

      this.data.balance.loading = false;
      this.data.balance.isLoaderShown = false;
    }
  }

  async updateLiquidity(tokenAddress, isLoaderShown){
    this.data.liquidity.loading = true;
    this.data.liquidity.isLoaderShown = isLoaderShown;

    const response = await this.tradingService.getPairLiquidity(tokenAddress, this.settings.network.chainId);

    const { errorMessage, error, weth, tokenX, tokenSymbol } = response;

    if(error){
      console.log(errorMessage);
      if(errorMessage == PAIR_NO_PAIR){
        this.data.liquidity.error = true;
        this.swap.isTokenValid = true;
        this.data.liquidity.loading = false;
        this.data.liquidity.isLoaderShown = false;
        this.data.tokenSymbol = tokenSymbol;

        this.updateBalance(false);
      } else {
        this.data.liquidity.error = true;
        this.swap.isTokenValid = false;
        this.data.liquidity.loading = false;
        this.data.liquidity.isLoaderShown = false;
        this.data.tokenSymbol = 'tokenX';
      }

    } else {
      this.data.liquidity = { error: false, loading: false, isLoaderShown: false,  weth, tokenX };
      this.data.liquidity.isLoaderShown = false;
      this.data.tokenSymbol = tokenSymbol || 'tokenX';
      this.swap.isTokenValid = true;

      this.updateBalance(false);
    }
  }

  async submitSwap(){
    if(!this.settings.address){
      this.notificationsService.openSnackBar('Check your Private Key');
      return;
    }

    if(!this.swap.isTokenValid){
      this.notificationsService.openSnackBar('Check token address');
      return;
    }

    this.data.status = "Waiting for liquidity to be added";

    this.websocketService.startWatching(this.swap.tokenAddress, this.settings.network.nodeAddress);
    const observable = this.websocketService.getOservable();

    this.subscription = observable.subscribe(async message => {
      console.log(message);
      this.swap.active = true;

      if(message.type == 'success' || message.type == 'error'){
        this.subscription.unsubscribe();

        if(message.type == 'success'){
          this.data.status = 'Liquidity tx in the pending block';
          try {
            const receipt = await this.tradingService.initTransaction(
              this.swap.tokenAddress,
              this.swap.tokenAmount,
              this.settings.address,
              this.settings.privateKey,
              this.settings.network.chainId,
              !this.swap.gasVariant ? 0 : +this.swap.gasPrice
            );
            console.log(receipt);
            this.data.status = `
              Swap executed in block ${receipt.blockNumber}.
              Swap hash: ${receipt.hash}.
              Liquididy added in block ${message.blockNumber}.
              Liquidity hash: ${message.hash}.
            `;
            this.swap.active = false;
            this.data.isSwapWas = true;
            this.notificationsService.openSnackBar('Swap executed succesfuly');
          } catch (error) {
            this.data.status = 'Swap failed to execute';
            this.notificationsService.openSnackBar('Swap failed to execute');
          }
        }
      }
    });
  }

  async cancelSwap(){
    this.subscription.unsubscribe();
    this.notificationsService.openSnackBar('Swap canceled by user');
    this.swap.active = false;
    this.data.isSwapWas = false;
  }
}
