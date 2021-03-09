import { ProvidersService } from './../services/providers.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingsService } from './../services/settings.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent{

  @Output() changeSettings = new EventEmitter();

  constructor(public dialog: MatDialog) {}

  openDialog() {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {width: '400px'});

    dialogRef.afterClosed().subscribe(result => {
      this.changeSettings.emit(null);
    });
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
    {value: 3, name: 'ROPSTEN'}
  ]

  constructor(private settingsService: SettingsService, private providerService: ProvidersService){}

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
      this.settings.network.chainId = await this.providerService.getChainId(this.settings.network.nodeAddress);

      if(this.settings.network.chainId){
        const { name } = this.networks.find((net) => net.value == this.settings.network.chainId);
        this.settings.network.name = name || 'unknown network';
        this.settingsService.setSettings(this.settings);
      } else {
        console.log('Invalid node address');
        // TODO: add eror boundary
      }
    }

    if(this.settings.privateKey){
      this.settingsService.setSettings(this.settings);
    }

  }
}
