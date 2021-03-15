import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient){}

  async get<T>(url, params = {}){
    try {
      return await this.http.get<T>(url, { params });
    } catch (error) {
      throw new Error(error);
    }
  }
}
