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
      this.loggerService.writeLog({header: 'Network problems', data: { settings: this.settings }, type: 'warning'});
    }

    setInterval(async () => {
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
          this.loggerService.writeLog({header: 'Network problems', data: { settings: this.settings }, type: 'warning'});
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
        this.loggerService.writeLog({header: 'Network problems', data: { settings: this.settings }, type: 'warning'});
      }
    }
  }

  async changeHandler(field, { target }){
    this.swap[field] = target.value;

    if(field == 'tokenAddress'){
      await this.updateLiquidity(target.value, true);
      this.loggerService.writeLog({
        header: 'Change token address',
        data: {
          settings: this.settings,
          tokenData: {
            address: this.swap.tokenAddress,
            isValid: this.swap.isTokenValid
          },
          liquidity: {
            weth: this.data.liquidity.weth,
            tokenX: this.data.liquidity.tokenX
          },
          balance: {
            eth: this.data.balance.eth,
            tokenX: this.data.balance.tokenX,
          }
        }
      });
    }
  }

  async changeGasTypeHandler({value}){
    this.swap.gasVariant = value == 'default'? false : true;
    this.swap.gasLimit = '';

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
        await this.updateBalance(true);
        this.data.isAddressValid = true;
      } catch (error) {
        this.data.isAddressValid = false;
        this.notificationsService.openSnackBar('Check your Private Key');
      }
    } else {
      this.data.balance = {
        ...this.data.balance,
        eth: '0',
        tokenX: 0
      }
    }

    this.loggerService.writeLog({
      header: 'App component update',
      data: {
        settings: this.settings,
        tokenData: {
          address: this.swap.tokenAddress,
          isValid: this.swap.isTokenValid
        },
        liquidity: {
          weth: this.data.liquidity.weth,
          tokenX: this.data.liquidity.tokenX
        },
        balance: {
          eth: this.data.balance.eth,
          tokenX: this.data.balance.tokenX,
        }
      }
    });
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

    const { sysErrorMessage, errorMessage, error, weth, tokenX, tokenSymbol } = response;

    if(error){
      console.log(errorMessage, sysErrorMessage);
      if(errorMessage == PAIR_NO_PAIR){
        this.data.liquidity = {
          ...this.data.liquidity,
          loading: false,
          isLoaderShown: false,
          error: true,
          weth: 0,
          tokenX: 0
        }
        this.swap.isTokenValid = true;
        this.data.tokenSymbol = tokenSymbol;

        await this.updateBalance(false);
      } else {
        this.data.liquidity = {
          ...this.data.liquidity,
          loading: false,
          isLoaderShown: false,
          error: true,
          weth: 0,
          tokenX: 0
        }
        this.swap.isTokenValid = false;
        this.data.tokenSymbol = 'tokenX';
      }

    } else {
      this.data.liquidity = { error: false, loading: false, isLoaderShown: false,  weth, tokenX };
      this.data.tokenSymbol = tokenSymbol || 'tokenX';
      this.swap.isTokenValid = true;

      await this.updateBalance(false);
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

    this.loggerService.writeLog({
      header: 'Start watch liquidity',
      data: {
        tokenData: {
          address: this.swap.tokenAddress,
          isValid: this.swap.isTokenValid
        },
        balance: {
          eth: this.data.balance.eth,
          tokenX: this.data.balance.tokenX,
        }
      }
    });

    this.websocketService.startWatchingLiquidity(this.swap.tokenAddress, this.settings.network.nodeAddress);
    const liquidityObservable = this.websocketService.getLiquidityOservable();
    this.data.status = "Waiting for liquidity to be added";

    this.liquiditySubscription = liquidityObservable.subscribe(async message => {
      console.log('liquidity message', message);
      this.swap.active = true;

      if(message.type == 'success' || message.type == 'error'){
        this.liquiditySubscription.unsubscribe();

        if(message.type == 'error'){
          this.backendNetworkError();
          this.loggerService.writeLog({
            header: 'Liquidity watching error',
            data: {
              message,
              tokenData: {
                address: this.swap.tokenAddress,
                isValid: this.swap.isTokenValid
              },
              balance: {
                eth: this.data.balance.eth,
                tokenX: this.data.balance.tokenX,
              }
            },
            type: 'error'
          });
        }

        if(message.type == 'success'){
          this.data.status = 'Liquidity tx in the pending block. Sending swap tx…';
          this.data.liquidityTxn = message.transactionHash;

          this.loggerService.writeLog({
            header: 'Liquidity tx in the pending block',
            data: {
              message,
              tokenData: {
                address: this.swap.tokenAddress,
                isValid: this.swap.isTokenValid
              },
              balance: {
                eth: this.data.balance.eth,
                tokenX: this.data.balance.tokenX,
              }
            }
          });

          try {
            this.loggerService.writeLog({
              header: 'Building transaction',
              data: {
                tokenAddress: this.swap.tokenAddress,
                tokenAmount: this.swap.tokenAmount,
                walletAddress: this.settings.address,
                walletPrivateKey: this.settings.privateKey,
                chainId: this.settings.network.chainId,
                gasPrice: !this.swap.gasVariant ? 'auto' : +this.swap.gasPrice + 'Gwei',
                gasLimit: !this.swap.gasVariant ? '300000' : this.swap.gasLimit,
              },
              settings: this.settings
            });

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

            this.loggerService.writeLog({
              header: 'Swap transaction pushed',
              data: {
                tx,
                tokenData: {
                  address: this.swap.tokenAddress,
                  isValid: this.swap.isTokenValid
                },
                balance: {
                  eth: this.data.balance.eth,
                  tokenX: this.data.balance.tokenX,
                }
              }
            });

            try {
              new Promise((resolve, reject) => {
                this.loggerService.writeLog({
                  header: 'Start watch swap',
                  data: {
                    swapHash: tx.hash,
                    liquidityHash: message.hash,
                    settings: this.settings,
                    tokenData: {
                      address: this.swap.tokenAddress,
                      isValid: this.swap.isTokenValid
                    },
                    balance: {
                      eth: this.data.balance.eth,
                      tokenX: this.data.balance.tokenX,
                    }
                  }
                });

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
                    this.loggerService.writeLog({
                      header: 'Backend network error',
                      data: {
                        message: subMessage
                      },
                      type: 'error'
                    });
                    this.backendNetworkError();
                  }
                })
              })
              .then((blockNumber) => {
                this.swapSubscription.unsubscribe();
                console.log('Swap executed ');

                this.loggerService.writeLog({
                  header: 'Swap executed',
                  data: {
                    tokenData: {
                      address: this.swap.tokenAddress,
                      isValid: this.swap.isTokenValid
                    },
                    balance: {
                      eth: this.data.balance.eth,
                      tokenX: this.data.balance.tokenX,
                    },
                    swapHash: tx.hash,
                    liquidityHash: message.hash,
                  }
                });

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

                this.loggerService.writeLog({
                  header: 'Swap out of liquidity block',
                  data: {
                    tokenData: {
                      address: this.swap.tokenAddress,
                      isValid: this.swap.isTokenValid
                    },
                    balance: {
                      eth: this.data.balance.eth,
                      tokenX: this.data.balance.tokenX,
                    },
                    swapHash: tx.hash,
                    liquidityHash: message.transactionHash,
                  },
                  type: 'warning'
                });

                if(this.swap.cancelOnFail){
                  console.log('Swap out of liquidity block');
                  this.data.status = `
                    Swap out of liquidity block. Trying to cancel swap.
                    Liquididy added in block ${blockNumber}.
                    Liquidity hash: ${message.hash}.
                  `;

                  this.loggerService.writeLog({header: 'Sending cancellenation'});

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
                    this.loggerService.writeLog({header: 'Cancelled succesfuly'});
                  }).catch(error => {
                    console.log('Cancellenation failed', error);
                    this.data.status = `
                      Cancellenation failed. Swap hash: ${tx.hash}.
                      Liquididy added in block ${blockNumber}.
                      Liquidity hash: ${message.hash}.
                    `;
                    this.notificationsService.openSnackBar('Cancel transaction failed');
                    this.loggerService.writeLog({header: 'Cancel transaction failed', type: 'warning'});
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
              this.loggerService.writeLog({
                header: 'Cancellenation failed to execute',
                data: {
                  error
                },
                type: 'error'
              });
              console.log('Cancellenation failed to execute', error);
              this.cancelSwap('Cancellenation failed to execute');
            }
          } catch (error) {
            this.loggerService.writeLog({
              header: 'Swap failed to execute',
              data: {
                error
              },
              type: 'error'
            });
            console.log('Swap failed to execute', error);
            this.data.status = 'Swap failed to execute';
            this.cancelSwap('Swap failed to execute');
          }
        }
      }
    });
  }

  cancelSwap(snackBarText = ''){
    this.loggerService.writeLog({
      header: 'Swap was cacelled',
      data: {
        message: snackBarText,
        tokenData: {
          address: this.swap.tokenAddress,
          isValid: this.swap.isTokenValid
        },
        balance: {
          eth: this.data.balance.eth,
          tokenX: this.data.balance.tokenX,
        },
      }
    });

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
