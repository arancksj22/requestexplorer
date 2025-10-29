import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiRequestDto, ApiResponseDto, HttpMethod } from '../api.service';
import { HistoryService } from '../../history/history.service';
import { ApiResponseComponent } from '../api-response/api-response.component';

@Component({
  selector: 'app-api-request',
  imports: [CommonModule, FormsModule, ApiResponseComponent],
  templateUrl: './api-request.component.html',
  styleUrl: './api-request.component.css'
})
export class ApiRequestComponent implements OnInit {
  methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  request: ApiRequestDto = {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    headers: {},
    body: undefined,
  };
  headerEntries: Array<{ key: string; value: string }> = [];
  bodyText = '';
  loading = false;
  response: ApiResponseDto | null = null;
  errorText = '';

  ngOnInit(): void {
    this.loadLast();
  }

  addHeader() {
    this.headerEntries.push({ key: '', value: '' });
  }

  removeHeader(i: number) {
    this.headerEntries.splice(i, 1);
  }

  private headersFromEntries(): Record<string, string> {
    const h: Record<string, string> = {};
    for (const e of this.headerEntries) {
      if (e.key.trim()) h[e.key.trim()] = e.value;
    }
    return h;
  }

  async send() {
    this.loading = true;
    this.errorText = '';
    this.response = null;
    let body: any = undefined;
    if (this.bodyText.trim()) {
      try {
        body = JSON.parse(this.bodyText);
      } catch {
        body = this.bodyText; // send as text
      }
    }
    const req: ApiRequestDto = {
      method: this.request.method,
      url: this.request.url,
      headers: this.headersFromEntries(),
      body,
    };
    try {
      this.response = await this.api.send(req);
      this.saveLast(req);
      
      // Save to backend history (async, don't wait)
      this.history.add({
        ts: Date.now(),
        method: req.method,
        url: req.url,
        status: this.response.status,
        durationMs: this.response.durationMs,
        request: { headers: req.headers, body: req.body },
      }).catch(err => console.error('Failed to save history:', err));
      
    } catch (e: any) {
      this.errorText = e?.message || 'Request failed';
    } finally {
      this.loading = false;
    }
  }

  private saveLast(req: ApiRequestDto) {
    localStorage.setItem('apiTester:last', JSON.stringify({
      ...req,
      headers: req.headers || {},
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2),
    }));
  }

  private loadLast() {
    const raw = localStorage.getItem('apiTester:last');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      this.request.method = data.method || 'GET';
      this.request.url = data.url || '';
      this.headerEntries = Object.entries(data.headers || {}).map(([key, value]) => ({ key, value: String(value) }));
      this.bodyText = data.body || '';
    } catch {}
  }

  constructor(private api: ApiService, private history: HistoryService) {}
}
