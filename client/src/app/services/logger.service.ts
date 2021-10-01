import { ApiService } from './api.service';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  constructor(private apiService: ApiService) {}

  async writeLog(message){
    try{
      await this.apiService.post(environment.serverUrl + '/api/writeLog', message);
    } catch (e) {
      console.log('Write log error:', e);
    }
  }
}
