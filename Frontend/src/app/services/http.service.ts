import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  private url(path: string): string {
    if (!path) return this.baseUrl;
    if (/^https?:\/\//i.test(path)) return path; // allow absolute URLs
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  get<T = any>(path: string, params?: any): Observable<T> {
    return this.http.get<T>(this.url(path), { 
      params, 
      headers: this.getHeaders() 
    });
  }

  post<T = any>(path: string, body?: any): Observable<T> {
    return this.http.post<T>(this.url(path), body, { 
      headers: this.getHeaders() 
    });
  }

  put<T = any>(path: string, body?: any): Observable<T> {
    return this.http.put<T>(this.url(path), body, { 
      headers: this.getHeaders() 
    });
  }

  patch<T = any>(path: string, body?: any): Observable<T> {
    return this.http.patch<T>(this.url(path), body, { 
      headers: this.getHeaders() 
    });
  }

  delete<T = any>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path), { 
      headers: this.getHeaders() 
    });
  }
}
