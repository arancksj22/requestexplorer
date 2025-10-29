import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, HistoryEntry } from '../../../features/history/history.service';

@Component({
  selector: 'app-general-analytics',
  imports: [CommonModule, FormsModule],
  templateUrl: './general-analytics.component.html',
  styleUrl: './general-analytics.component.css'
})
export class GeneralAnalyticsComponent implements OnInit {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all' = '30d';
  stats: Array<{title:string; value:string; change:string; trend:'up'|'down'; description:string}> = [];
  statusDistribution: Array<{ status:string; count:number; percentage:number; color:string }> = [];
  topEndpoints: Array<{ endpoint:string; requests:number; avgTime:string; errorRate:string }> = [];

  constructor(private history: HistoryService) {}

  ngOnInit() { this.recompute(); }

  private rangeStartMs(): number {
    const now = Date.now();
    switch (this.timeRange) {
      case '7d': return now - 7*24*3600_000;
      case '30d': return now - 30*24*3600_000;
      case '90d': return now - 90*24*3600_000;
      case '1y': return now - 365*24*3600_000;
      default: return 0;
    }
  }

  async recompute() {
    const all = await this.history.list();
    const start = this.rangeStartMs();
    const current = all.filter((e: HistoryEntry) => e.ts >= start);

    // previous equal window for change calculation
    const windowMs = Math.max(Date.now() - start, 0);
    const prevStart = Math.max(start - windowMs, 0);
    const previous = all.filter((e: HistoryEntry) => e.ts >= prevStart && e.ts < start);

    const fmtPct = (n: number) => `${(isFinite(n)? n : 0).toFixed(1)}%`;
    const fmtMs = (ms: number) => ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
    const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

    const curTotal = current.length;
    const prevTotal = previous.length;
    const curSuccess = current.filter((e: HistoryEntry) => e.status >= 200 && e.status < 300).length;
    const prevSuccess = previous.filter((e: HistoryEntry) => e.status >= 200 && e.status < 300).length;
    const curError = current.filter((e: HistoryEntry) => e.status >= 400 && e.status < 600).length;
    const prevError = previous.filter((e: HistoryEntry) => e.status >= 400 && e.status < 600).length;
    const curAvg = avg(current.map((e: HistoryEntry) => e.durationMs));
    const prevAvg = avg(previous.map((e: HistoryEntry) => e.durationMs));

    const rate = (num:number, den:number) => den ? (num/den)*100 : 0;
    const change = (cur:number, prev:number) => prev ? ((cur - prev) / Math.abs(prev)) * 100 : 0;

    const successRate = rate(curSuccess, curTotal);
    const errorRate = rate(curError, curTotal);

    this.stats = [
      {
        title: 'Total Requests',
        value: curTotal.toLocaleString(),
        change: `${change(curTotal, prevTotal) >= 0 ? '+' : ''}${(change(curTotal, prevTotal)).toFixed(1)}%`,
        trend: change(curTotal, prevTotal) >= 0 ? 'up' : 'down',
        description: this.rangeLabel(),
      },
      {
        title: 'Success Rate',
        value: fmtPct(successRate),
        change: `${change(successRate, rate(prevSuccess, prevTotal)) >= 0 ? '+' : ''}${(change(successRate, rate(prevSuccess, prevTotal))).toFixed(1)}%`,
        trend: change(successRate, rate(prevSuccess, prevTotal)) >= 0 ? 'up' : 'down',
        description: '2xx responses',
      },
      {
        title: 'Avg Response Time',
        value: fmtMs(curAvg),
        change: `${change(curAvg, prevAvg) >= 0 ? '+' : ''}${(change(curAvg, prevAvg)).toFixed(1)}%`,
        trend: change(curAvg, prevAvg) >= 0 ? 'up' : 'down',
        description: this.rangeLabel(),
      },
      {
        title: 'Error Rate',
        value: fmtPct(errorRate),
        change: `${change(errorRate, rate(prevError, prevTotal)) >= 0 ? '+' : ''}${(change(errorRate, rate(prevError, prevTotal))).toFixed(1)}%`,
        trend: change(errorRate, rate(prevError, prevTotal)) >= 0 ? 'up' : 'down',
        description: '4xx & 5xx errors',
      },
    ];

    // Status distribution
    const buckets = [
      { label:'2xx Success', color:'status-success', match:(s:number)=>s>=200&&s<300 },
      { label:'3xx Redirect', color:'status-redirect', match:(s:number)=>s>=300&&s<400 },
      { label:'4xx Client Error', color:'status-client-error', match:(s:number)=>s>=400&&s<500 },
      { label:'5xx Server Error', color:'status-server-error', match:(s:number)=>s>=500&&s<600 },
    ];
    this.statusDistribution = buckets.map(b => {
      const count = current.filter((e: HistoryEntry) => b.match(e.status)).length;
      return { status: b.label, count, percentage: curTotal ? +(count/curTotal*100).toFixed(1) : 0, color: b.color };
    });

    // Top endpoints by pathname
    const map = new Map<string, HistoryEntry[]>();
    for (const e of current) {
      let path = e.url;
      try { path = new URL(e.url).pathname; } catch {}
      const arr = map.get(path) || [];
      arr.push(e); map.set(path, arr);
    }
    const rows = Array.from(map.entries()).map(([endpoint, arr]) => {
      const avgMs = avg(arr.map((a: HistoryEntry)=>a.durationMs));
      const errs = arr.filter((a: HistoryEntry)=>a.status>=400&&a.status<600).length;
      return { endpoint, requests: arr.length, avgTime: fmtMs(avgMs), errorRate: fmtPct(rate(errs, arr.length)) };
    });
    this.topEndpoints = rows.sort((a,b)=> b.requests - a.requests).slice(0,5);
  }

  private rangeLabel(){
    switch(this.timeRange){
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'All time';
    }
  }

  statusColorVar(key: string) { return `var(--${key})`; }
}
