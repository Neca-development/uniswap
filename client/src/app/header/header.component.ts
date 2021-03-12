import { ProvidersService } from './../services/providers.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SettingsService } from './../services/settings.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent{

  @Output() changeSettings = new EventEmitter();

  constructor(public dialog: MatDialog) {}

  async openDialog() {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {width: '400px'});

    const result = await dialogRef.afterClosed().toPromise();
    this.changeSettings.emit(result);
  }
}

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.html',
})
export class SettingsDialogComponent implements OnInit {
  settings;

  networks = [
    {value: 1, name: 'MAINNET'},
    {value: 3, name: 'ROPSTEN'},
    {value: 4, name: 'RINKEBY'},
    {value: 5, name: 'GOERLI'},
    {value: 42, name: 'KOVAN'}
  ]

  constructor(private _dialog: MatDialogRef<SettingsDialogComponent>, private settingsService: SettingsService, private providerService: ProvidersService){}

  ngOnInit(){
    this.settings = this.settingsService.getSettings();
  }

  changeHandler(field, { target }){
    this.settings[field] = target.value;
  }

  changeNetworkHandler({ target }){
    this.settings.network.nodeAddress = target.value;
  }

  async saveClick(){
    if(this.settings.network.nodeAddress){
      try {
        this.settings.network.chainId = await this.providerService.getChainId(this.settings.network.nodeAddress);

        const { name } = this.networks.find((net) => net.value == this.settings.network.chainId);

        this.settings.network.name = name || 'UNKNOWN';
        this.settingsService.setSettings(this.settings);
      } catch (error) {
        this.settings.network = {
          name: 'ROPSTEN',
          nodeAddress: '',
          chainId: 3
        };
        this.settingsService.setSettings(this.settings);
      }
    } else {
      this.settings.network = {
        name: 'ROPSTEN',
        nodeAddress: '',
        chainId: 3
      };
      this.settingsService.setSettings(this.settings);
    }

    if(this.settings.privateKey){
      this.settingsService.setSettings(this.settings);
    }

    this._dialog.close(true);
  }
}
