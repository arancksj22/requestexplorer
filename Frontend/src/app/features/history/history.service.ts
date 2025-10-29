import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface HistoryEntry {
  id?: number;
  ts: number; // timestamp
  method: string;
  url: string;
  status: number;
  durationMs: number;
  request?: {
    headers?: Record<string, string>;
    body?: any;
  };
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/history';

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  async add(entry: HistoryEntry): Promise<void> {
    try {
      console.log('💾 Saving to backend:', entry);
      const response = await firstValueFrom(
        this.http.post(this.baseUrl, {
          url: entry.url,
          method: entry.method,
          status: entry.status,
          durationMs: entry.durationMs,
          timestamp: entry.ts
        }, { headers: this.getHeaders() })
      );
      console.log('✅ History saved successfully:', response);
    } catch (error) {
      console.error('❌ Failed to save history to backend:', error);
      // Don't use localStorage anymore - just log the error
      throw error;
    }
  }

  async list(): Promise<HistoryEntry[]> {
    try {
      console.log('📥 Fetching history from backend...');
      const response: any = await firstValueFrom(
        this.http.get(this.baseUrl, { headers: this.getHeaders() })
      );
      
      console.log('✅ History response:', response);
      
      // Backend returns array directly
      if (Array.isArray(response)) {
        return response.map((item: any) => ({
          id: item.id,
          ts: item.ts,
          method: item.method,
          url: item.url,
          status: item.status,
          durationMs: item.durationMs
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch history from backend:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      console.log('🗑️ Clearing history...');
      await firstValueFrom(
        this.http.delete(this.baseUrl, { headers: this.getHeaders() })
      );
      console.log('✅ History cleared');
    } catch (error) {
      console.error('❌ Failed to clear history:', error);
      throw error;
    }
  }

  async deleteEntry(id: number): Promise<void> {
    try {
      console.log('🗑️ Deleting history entry:', id);
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/${id}`, { headers: this.getHeaders() })
      );
      console.log('✅ History entry deleted');
    } catch (error) {
      console.error('❌ Failed to delete history entry:', error);
      throw error;
    }
  }
}
