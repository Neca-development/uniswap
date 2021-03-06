import { SettingsService } from './../services/settings.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-settings-form',
  templateUrl: './settings-form.component.html',
  styleUrls: ['./settings-form.component.scss']
})
export class SettingsFormComponent{

  constructor(public dialog: MatDialog) {}

  openDialog() {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {width: '400px'});

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
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
    console.log(this.settings);

    this.settingsService.setSettings(this.settings);
  }
}
