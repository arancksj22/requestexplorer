import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ApiRequestDto {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ApiResponseDto {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly BACKEND_URL = 'http://localhost:3000/api/proxy';

  constructor(private http: HttpClient) {}

  async send(request: ApiRequestDto): Promise<ApiResponseDto> {
    const start = performance.now();
    
    console.log('🚀 Sending request to backend:', this.BACKEND_URL);
    console.log('📦 Request payload:', {
      url: request.url,
      method: request.method,
      headers: request.headers || {},
      body: request.body
    });
    
    try {
      // Send request to backend proxy
      const resp = await firstValueFrom(
        this.http.post<any>(this.BACKEND_URL, {
          url: request.url,
          method: request.method,
          headers: request.headers || {},
          body: request.body
        })
      );

      console.log('✅ Backend response received:', resp);
      const durationMs = Math.round(performance.now() - start);

      return {
        ok: resp.status >= 200 && resp.status < 300,
        status: resp.status,
        statusText: resp.statusText || 'OK',
        headers: resp.headers || {},
        body: resp.body,
        durationMs: resp.duration || durationMs,
      };
    } catch (error: any) {
      console.error('❌ Backend request failed:', error);
      const durationMs = Math.round(performance.now() - start);
      const status = error.status ?? 0;
      const statusText = error.statusText ?? 'Network error';
      const headersObj: Record<string, string> = {};
      if (error.headers && typeof error.headers.keys === 'function') {
        error.headers.keys().forEach((k: string) => (headersObj[k] = error.headers.get(k) || ''));
      }
      let body = error.error;
      try {
        body = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {}
      return { ok: false, status, statusText, headers: headersObj, body, durationMs };
    }
  }
}
