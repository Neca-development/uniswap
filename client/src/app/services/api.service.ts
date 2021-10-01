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

  async post<T>(url, data = {}){
    return await this.request<T>(url, 'POST', data);
  }

  private async request<T>(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data: any = null
  ): Promise<T> {
    let body;

    const headers = {
      authorization: localStorage.getItem('token') || '',
    };

    if (data) {
      (headers as any)['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }
    try {
      const response = await this.http
        .request<T>(method, url, {
          headers,
          body,
        })
        .toPromise();
      return response;
    } catch (e) {
      throw e;
    }
  }
}
