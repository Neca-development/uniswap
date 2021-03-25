import { LoggerService } from './services/logger.service';
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
    cancelOnFail: true
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
    liquidityTxn: '',
    swapTxn: '',
    currentBlock: 0,
    status: 'waiting for liquidity',
    isAddressValid: false,
    isNetworkChanging: false,
    isNetworkValid: true,
    isSwapWas: false
  };

  settings;
  liquiditySubscription;
  swapSubscription;

  constructor(
    private settingsService: SettingsService,
    private tradingService: TradingService,
    private providersService: ProvidersService,
    private websocketService: WebsocketService,
    private notificationsService: NotificationsService,
    private loggerService: LoggerService
  ){}

  ngOnInit(): void {
    try {
      this.updateComponent();
    } catch (error) {
      console.log(error);
      this.cancelSwap('Network problems, try to change your node address');
    }

    this.loggerService.writeLog({header: 'App component update', data: this.settings});


    let updateInteraval = setInterval(async () => {
      if(this.data.isNetworkValid){
        try{
          const tempCurrentBlock = await this.tradingService.getCurrentBlockNumber();

          if(tempCurrentBlock != this.data.currentBlock){
            this.data.currentBlock = tempCurrentBlock;

            if(this.swap.tokenAddress && this.swap.isTokenValid){
              this.updateLiquidity(this.swap.tokenAddress, false);
            }

            this.updateBalance(false);
          }
        } catch (error) {
          console.log(error);
          this.cancelSwap('Network problems, try to change your node address');
          clearInterval(updateInteraval);
        }
      }
    }, 2000);
  }

  async checkSaveAction(isSaveAction = false){
    if(isSaveAction){
      try {
        this.updateComponent();
      } catch (error) {
        console.log(error);
        this.cancelSwap('Network problems, try to change your node address');
      }
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

      if(!newSettings.network.nodeAddress){
        this.data.isAddressValid = false;
        this.data.isNetworkValid = false;
        this.swap.tokenAddress = '';
        this.cancelSwap();
        return;
      }

      this.data.isNetworkValid = true;

      if(newSettings.network.chainId !== this.settings.network.chainId){
        this.swap.tokenAddress = '';
        this.swap.gasVariant = false;
        this.data.isSwapWas = false;

        if(this?.liquiditySubscription && this.swap.active){
          this.liquiditySubscription.unsubscribe();
          this.notificationsService.openSnackBar('Swap canceled');
          this.swap.active = false;
        }
      }

      this.settings = newSettings;
    } else {
      this.settings = this.settingsService.getSettings();

      if(!this.settings.network.nodeAddress){
        this.data.isNetworkValid = false;
        return;
      }
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

    this.websocketService.startWatchingLiquidity(this.swap.tokenAddress, this.settings.network.nodeAddress);
    const liquidityObservable = this.websocketService.getLiquidityOservable();

    this.liquiditySubscription = liquidityObservable.subscribe(async message => {
      console.log('liquidity message', message);
      this.swap.active = true;

      if(message.type == 'success' || message.type == 'error'){
        this.liquiditySubscription.unsubscribe();

        if(message.type == 'error'){
          this.backendNetworkError();
        }

        if(message.type == 'success'){
          this.data.status = 'Liquidity tx in the pending block. Sending swap tx…';
          this.data.liquidityTxn = message.transactionHash;
          try {
            let tx = await this.tradingService.initTransaction(
              this.swap.tokenAddress,
              this.swap.tokenAmount,
              this.settings.address,
              this.settings.privateKey,
              this.settings.network.chainId,
              !this.swap.gasVariant ? 0 : +this.swap.gasPrice,
              !this.swap.gasVariant ? '300000' : this.swap.gasLimit,
            );

            this.data.status = `Liquidity tx in the pending block. Swap tx hash: ${tx.hash}`;

            try {
              new Promise((resolve, reject) => {
                this.websocketService.startWatchingSwap(message.hash, tx.hash, this.settings.network.nodeAddress);

                const swapObservable = this.websocketService.getSwapObservable();
                this.swapSubscription = swapObservable.subscribe(async subMessage => {
                  console.log('swapMessage', subMessage);

                  if(subMessage.type == 'success'){
                    resolve(subMessage.blockNumber);
                  }

                  if(subMessage.type == 'fail'){
                    reject(subMessage.blockNumber);
                  }

                  if(subMessage.type == 'error'){
                    this.backendNetworkError();
                  }
                })
              })
              .then((blockNumber) => {
                this.swapSubscription.unsubscribe();
                console.log('Swap executed ');
                this.data.status = `
                  Swap executed in block ${blockNumber}.
                  Swap hash: ${tx.hash}.
                  Liquididy added in block ${blockNumber}.
                  Liquidity hash: ${message.hash}.
                `;
                this.swap.active = false;
                this.data.isSwapWas = true;
                this.notificationsService.openSnackBar('Swap executed succesfuly');
              })
              .catch((blockNumber) => {
                this.swapSubscription.unsubscribe();
                if(this.swap.cancelOnFail){
                  console.log('Swap out of liquidity block');
                  this.data.status = `
                    Swap out of liquidity block. Trying to cancel swap.
                    Liquididy added in block ${blockNumber}.
                    Liquidity hash: ${message.hash}.
                  `;

                  this.tradingService.sendCancelTransaction(
                    this.settings.privateKey,
                    tx.nonce,
                    this.settings.network.chainId,
                    tx.gasPrice.toNumber()
                  ).then(result => {
                    console.log(result);
                    this.data.status = `
                      Swap cancellenation hash: ${result.transactionHash}.
                      Liquididy added in block ${blockNumber}.
                      Liquidity hash: ${message.hash}.
                    `;
                    this.notificationsService.openSnackBar('Swap caneled succesfuly');
                  }).catch(error => {
                    console.log(error);
                    this.data.status = `
                      Cancellenation failed. Swap hash: ${tx.hash}.
                      Liquididy added in block ${blockNumber}.
                      Liquidity hash: ${message.hash}.
                    `;
                    this.notificationsService.openSnackBar('Cancel transaction failed');
                  });
                } else {
                  this.data.status = `
                    Swap out of liquidity block. Swap hash: ${tx.hash}.
                    Liquididy added in block ${blockNumber}.
                    Liquidity hash: ${message.hash}.
                  `;
                  this.notificationsService.openSnackBar('Swap out of liquidity block');
                }

                this.swap.active = false;
                this.data.isSwapWas = true;
                return;
              })
            } catch (error) {
              console.log('Cancellenation failed to execute', error);
              this.cancelSwap('Cancellenation failed to execute');
            }
          } catch (error) {
            console.log('Swap failed to execute', error);
            this.data.status = 'Swap failed to execute';
            this.cancelSwap('Swap failed to execute');
          }
        }
      }
    });
  }

  cancelSwap(snackBarText = ''){
    this.liquiditySubscription?.unsubscribe();
    this.swapSubscription?.unsubscribe();
    if(snackBarText){
      this.notificationsService.openSnackBar(snackBarText);
    }
    this.swap.active = false;
    this.data.isSwapWas = false;
  }

  backendNetworkError(){
    console.log('Node connection error from backend');
    this.cancelSwap('Node connection error from backend');
  }
}
