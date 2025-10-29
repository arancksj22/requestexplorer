import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, HistoryEntry } from '../../../features/history/history.service';

@Component({
  selector: 'app-api-analytics',
  imports: [CommonModule, FormsModule],
  templateUrl: './api-analytics.component.html',
  styleUrl: './api-analytics.component.css'
})
export class ApiAnalyticsComponent implements OnInit {
  methodColor(method: string) {
    const map: Record<string,string> = { GET:'var(--method-get)', POST:'var(--method-post)', PUT:'var(--method-put)', PATCH:'var(--method-patch)', DELETE:'var(--method-delete)' };
    return map[method] || 'var(--muted)';
  }

  successRateColor(rate: number){
    if (rate >= 99) return 'var(--status-success)';
    if (rate >= 95) return 'var(--method-put)';
    return 'var(--status-client-error)';
  }

  formatTime(ms: number){
    return ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${ms}ms`;
  }

  // derived from history
  all: HistoryEntry[] = [];
  rows: Array<{ endpoint:string; method:string; totalRequests:number; successRate:number; avgResponseTime:number; p95ResponseTime:number; errorCount:number; lastCalled:string }>=[];

  // summary (computed from current rows)
  summary = {
    avgSuccessRate: 0,
    avgResponseTime: 0,
    p95ResponseTime: 0,
    errorRatePercent: 0,
    totalErrors: 0,
    totalRequests: 0,
  };

  // filters
  q = '';
  method = 'all';
  perf = 'all';
  range: '1d'|'7d'|'30d'|'all' = '7d';

  // selected endpoint details
  selectedEndpoint: {
    endpoint: string;
    method: string;
    requests: HistoryEntry[];
    statusDistribution: { status: number; count: number; percentage: number }[];
    timeSeriesData: { timestamp: string; responseTime: number }[];
  } | null = null;

  constructor(private history: HistoryService){}

  ngOnInit(){ this.recompute(); }

  private rangeStartMs(){
    const now = Date.now();
    switch(this.range){
      case '1d': return now - 24*3600_000;
      case '7d': return now - 7*24*3600_000;
      case '30d': return now - 30*24*3600_000;
      default: return 0;
    }
  }

  async recompute(){
    this.all = (await this.history.list()).filter((e: HistoryEntry) => e.ts >= this.rangeStartMs());
    // group by endpoint+method
    const groups = new Map<string, HistoryEntry[]>();
    for (const e of this.all){
      let path = e.url; try { path = new URL(e.url).pathname; } catch {}
      const key = `${path}__${e.method}`;
      const arr = groups.get(key) || []; arr.push(e); groups.set(key, arr);
    }
    const toAgo = (ts:number)=>{
      const d = Math.max(0, Date.now()-ts); const m = Math.floor(d/60000);
      if (m < 1) return 'just now'; if (m < 60) return `${m} minute${m===1?'':'s'} ago`;
      const h=Math.floor(m/60); if (h<24) return `${h} hour${h===1?'':'s'} ago`;
      const days=Math.floor(h/24); return `${days} day${days===1?'':'s'} ago`;
    };
    const avg = (a:number[])=> a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
    const p95 = (nums:number[])=>{
      if (!nums.length) return 0; const sorted=[...nums].sort((a,b)=>a-b); const idx=Math.floor(0.95*(sorted.length-1)); return sorted[idx];
    };

    let rows = Array.from(groups.entries()).map(([key, arr])=>{
      let path = key.split('__')[0];
      const method = arr[0]?.method || 'GET';
      const total = arr.length;
      const successes = arr.filter((e: HistoryEntry)=>e.status>=200&&e.status<300).length;
      const errors = arr.filter((e: HistoryEntry)=>e.status>=400&&e.status<600).length;
      const avgMs = avg(arr.map((e: HistoryEntry)=>e.durationMs));
      const p95Ms = p95(arr.map((e: HistoryEntry)=>e.durationMs));
      const lastTs = arr.reduce((m,e)=> Math.max(m,e.ts), 0);
      return { endpoint: path, method, totalRequests: total, successRate: total? +(successes/total*100).toFixed(1) : 0, avgResponseTime: Math.round(avgMs), p95ResponseTime: p95Ms, errorCount: errors, lastCalled: toAgo(lastTs) };
    });

    // filters
    if (this.q.trim()) rows = rows.filter(r => r.endpoint.toLowerCase().includes(this.q.trim().toLowerCase()));
    if (this.method !== 'all') rows = rows.filter(r => r.method === this.method);
    if (this.perf !== 'all'){
      if (this.perf === 'fast') rows = rows.filter(r => r.avgResponseTime < 200);
      if (this.perf === 'medium') rows = rows.filter(r => r.avgResponseTime >= 200 && r.avgResponseTime <= 500);
      if (this.perf === 'slow') rows = rows.filter(r => r.avgResponseTime > 500);
    }

    // sort default by requests desc
    this.rows = rows.sort((a,b)=> b.totalRequests - a.totalRequests);

    // compute summary across shown rows
    const totalEndpoints = this.rows.length || 0;
    const sumSuccess = this.rows.reduce((a,r)=>a + r.successRate, 0);
    const sumAvgTime = this.rows.reduce((a,r)=>a + r.avgResponseTime, 0);
    const sumP95Time = this.rows.reduce((a,r)=>a + r.p95ResponseTime, 0);
    const totalErrors = this.rows.reduce((a,r)=>a + r.errorCount, 0);
    const totalRequests = this.rows.reduce((a,r)=>a + r.totalRequests, 0);

    this.summary = {
      avgSuccessRate: totalEndpoints ? sumSuccess / totalEndpoints : 0,
      avgResponseTime: totalEndpoints ? sumAvgTime / totalEndpoints : 0,
      p95ResponseTime: totalEndpoints ? sumP95Time / totalEndpoints : 0,
      errorRatePercent: totalRequests ? (totalErrors / totalRequests) * 100 : 0,
      totalErrors,
      totalRequests,
    };
  }

  selectEndpoint(row: { endpoint: string; method: string }) {
    // Find all requests for this endpoint
    const requests = this.all.filter((e: HistoryEntry) => {
      let path = e.url;
      try { path = new URL(e.url).pathname; } catch {}
      return path === row.endpoint && e.method === row.method;
    });

    if (requests.length === 0) {
      this.selectedEndpoint = null;
      return;
    }

    // Calculate status distribution
    const statusMap = new Map<number, number>();
    requests.forEach((r: HistoryEntry) => {
      statusMap.set(r.status, (statusMap.get(r.status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: +(count / requests.length * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    // Create time series data (last 20 requests)
    const timeSeriesData = requests
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 20)
      .reverse()
      .map((r: HistoryEntry) => ({
        timestamp: new Date(r.ts).toLocaleTimeString(),
        responseTime: r.durationMs
      }));

    this.selectedEndpoint = {
      endpoint: row.endpoint,
      method: row.method,
      requests,
      statusDistribution,
      timeSeriesData
    };
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    if (status >= 500) return 'status-server-error';
    return 'status-info';
  }

  getAvgResponseTime(): number {
    if (!this.selectedEndpoint || this.selectedEndpoint.requests.length === 0) return 0;
    const sum = this.selectedEndpoint.requests.reduce((acc, r) => acc + r.durationMs, 0);
    return sum / this.selectedEndpoint.requests.length;
  }

  getSuccessRate(): number {
    if (!this.selectedEndpoint || this.selectedEndpoint.requests.length === 0) return 0;
    const successCount = this.selectedEndpoint.requests.filter(r => r.status >= 200 && r.status < 300).length;
    return (successCount / this.selectedEndpoint.requests.length * 100);
  }

  getMaxResponseTime(): number {
    if (!this.selectedEndpoint || this.selectedEndpoint.timeSeriesData.length === 0) return 1;
    return Math.max(...this.selectedEndpoint.timeSeriesData.map(p => p.responseTime));
  }
}
