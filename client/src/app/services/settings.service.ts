import { Injectable } from '@angular/core';

import { ISettings } from './../models/model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  _settingsStorage: ISettings = {
    privateKey: '',
    network: "ropsten",
    address: ''
  }

  getSettings(){
    return this._settingsStorage;
  }

  setSettings(value){
    this._settingsStorage = value;
  }

  setAddress(value){
    this._settingsStorage.address = value;
  }

  setPrivateKey(value){
    this._settingsStorage.privateKey = value;
  }

}
