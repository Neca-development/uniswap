import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { ISettings } from './../models/model';
import { environment } from "./../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  _settingsStorage: ISettings = {
    privateKey: '',
    network: {
      chainId: 3,
      nodeAddress: environment.INFURA_WSS_ROPSTEN,
      name: "ROPSTEN"
    },
    address: '',
  }

  getSettings(){
    const localStorageSettings = localStorage.getItem('settings');

    if(localStorageSettings){
      this._settingsStorage = JSON.parse(localStorageSettings);
    }

    return cloneDeep(this._settingsStorage);
  }

  setSettings(value){
    localStorage.setItem('settings', JSON.stringify(value));
    this._settingsStorage = value;
  }

  setAddress(value){
    this._settingsStorage.address = value;
    localStorage.setItem('settings', JSON.stringify(this._settingsStorage));
  }

  setPrivateKey(value){
    this._settingsStorage.privateKey = value;
    localStorage.setItem('settings', JSON.stringify(this._settingsStorage));
  }

}
