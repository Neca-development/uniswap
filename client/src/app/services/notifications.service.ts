import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  constructor(private snackBar: MatSnackBar){}

  openSnackBar(message: string, action?: string) {
    this.snackBar.open(message, action || 'Close', {
      duration: 0,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
