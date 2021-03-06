import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from '../../environments/environment';

import { IAPIResponse } from '../models/model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(public _snackBar: MatSnackBar, public http: HttpClient) {}

  get<T>(url: string, params?: any): Promise<any> {
    return this.request(url, 'GET', params);
  }

  //TODO: How it works...
  private async request<T>(
    url,
    method: 'GET',
    params = null,
  ): Promise<any> {
    try {
      const response = await this.http
        .request<IAPIResponse<T>>(method, environment.serverUrl + url, {
          params
        })
        .toPromise();

      return response.data;
    } catch (e) {
      const errorObject = e as HttpErrorResponse;
      const errorData = errorObject.error as IAPIResponse<any>;
      if (
        errorData != null &&
        errorData.errorMessage != null &&
        errorData.errorMessage != ''
      ) {
        this.openSnackBar(errorData.errorMessage, 'error');
      } else {
        this.openSnackBar(errorObject.message, 'error');
      }

      throw e;
    }
  }

  private openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: 'top',
    });
  }
}
