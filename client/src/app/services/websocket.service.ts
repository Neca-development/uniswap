import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  _ws = webSocket('ws://localhost:3000');
  _liquidityObservable: Observable<any>;
  _swapObservable: Observable<any>;

  observableFactory(type, params){
    return this._ws.multiplex(
      () => ({type, ...params}),
      () => ({type: 'unsubscribe'}),
      message => true
    );
  }

  startWatchingLiquidity(tokenAddress, nodeAddress){
    this._liquidityObservable = this.observableFactory('subscribeLiquidity', { tokenAddress, nodeAddress: nodeAddress || environment.INFURA_WSS_ROPSTEN });
  }

  startWatchingSwap(liquidityHash, swapHash, nodeAddress){
    this._swapObservable = this.observableFactory('subscribeSwap', { liquidityHash, swapHash, nodeAddress: nodeAddress || environment.INFURA_WSS_ROPSTEN });
  }

  getLiquidityOservable(){
    return this._liquidityObservable;
  }

  getSwapObservable(){
    return this._swapObservable;
  }
}
