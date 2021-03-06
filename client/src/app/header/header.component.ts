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

  constructor(private settingsService: SettingsService){}

  ngOnInit(){
    this.settings = this.settingsService.getSettings();
  }

  changeHandler(field, { target }){
    this.settings[field] = target.value;
  }

  saveClick(){
    this.settingsService.setSettings(this.settings);
  }
}
