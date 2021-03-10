import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  _ws = webSocket('ws://localhost:3000');
  _observable: Observable<any>;

  async startWatching(tokenAddress, nodeAddress){
    this._observable = this._ws.multiplex(
      () => ({type: 'subscribeLiquidity', tokenAddress, nodeAddress: nodeAddress || environment.INFURA_WSS_ROPSTEN}),
      () => ({type: 'unsubscribe'}),
      message => true
    );
  }

  getOservable(){
    return this._observable;
  }
}
