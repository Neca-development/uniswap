import { WebsocketService } from './services/websocket.service';
import { ProvidersService } from './services/providers.service';
import { TradingService } from './services/trading.service';
import { Component, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  swap = {
    tokenAddress: '',
    isTokenValid: false,
    tokenAmount: '0.01',
    gasVariant: false,
    gasPrice: '',
    active: false,
  };

  data  = {
    tokenSymbol: 'tokenX',
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
  subscription;

  constructor(
    private settingsService: SettingsService,
    private tradingService: TradingService,
    private providersService: ProvidersService,
    private websocketService: WebsocketService,
    private snackBar: MatSnackBar
  ){}

  ngOnInit(): void {
    this.updateComponent();

    setInterval(async () => {
      this.data.currentBlock = await this.tradingService.getCurrentBlockNumber();

      if(this.settings.address){
        this.data.balance.eth = await this.tradingService.getBalance(this.settings.address);

        if(this.swap.isTokenValid){
          this.data.balance.tokenX = await this.tradingService.getTokenXBalance(this.swap.tokenAddress, this.settings.address);
        }
      }
    }, 2000);

    setInterval(async () => {
      if(this.swap.tokenAddress && this.swap.isTokenValid){
        this.updateLiquidity(this.swap.tokenAddress);
      }
    }, 10000)
  }

  async changeHandler(field, { target }){
    this.swap[field] = target.value;

    if(field == 'tokenAddress'){
      this.data.liquidity.loading = true;
      await this.updateLiquidity(target.value);
    }
  }

  async changeGasTypeHandler({value}){
    this.swap.gasVariant = value == 'default'? false : true;
  }

  async updateComponent(){
    this.settings = this.settingsService.getSettings();

    this.providersService.setProvider(this.settings.network.nodeAddress);

    if(this.settings.privateKey){
      try {
        this.settings.address = await this.tradingService.getAddressFromPrivateKey(this.settings.privateKey);
      } catch (error) {
        this.openSnackBar('Check your Private Key');
      }
    }
  }

  async updateLiquidity(tokenAddress){
    const response = await this.tradingService.getPairLiquidity(tokenAddress, this.settings.network.chainId);

    const { error, weth, tokenX, tokenSymbol } = response;

    if(error){
      console.log('Invalid token');
      this.swap.isTokenValid = false;
      this.data.liquidity.loading = false;
      this.data.tokenSymbol = 'tokenX';
      // this.openSnackBar('Invalid token', 'Close');
    } else {
      this.data.liquidity = { loading: false,  weth, tokenX };
      this.data.tokenSymbol = tokenSymbol || 'tokenX';
      this.swap.isTokenValid = true;

      if(this.settings.address){
        this.data.balance.tokenX = await this.tradingService.getTokenXBalance(tokenAddress, this.settings.address);
      }
    }
  }

  async submitSwap(){
    if(this.settings.address){
      this.openSnackBar('Check your Private Key');
      return;
    }

    if(this.swap.isTokenValid){
      this.openSnackBar('Check token address');
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
              this.settings.network.chainId
            );
            console.log(receipt);
            this.data.status = `Swap executed in block ${receipt.blockNumber}`;
          } catch (error) {
            this.data.status = 'Swap failed to execute';
            this.openSnackBar('Swap failed to execute');
          }
        }
      }
    });
  }

  async cancelSwap(){
    this.subscription.unsubscribe();
    this.openSnackBar('Swap canceled by user');
    this.swap.active = false;
  }

  openSnackBar(message: string, action?: string) {
    this.snackBar.open(message, action || 'Close', {
      duration: 0,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
