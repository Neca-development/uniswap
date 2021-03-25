import { ApiService } from './api.service';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  constructor(private apiService: ApiService) {}

  async writeLog(message){
    console.log('writeLog', environment.serverUrl + '/api/writeLog');
    const response = await this.apiService.post(environment.serverUrl + '/api/writeLog', message);
    await response.toPromise();
  }
}
