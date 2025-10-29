import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, HistoryEntry } from '../../features/history/history.service';

@Component({
  selector: 'app-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  allEntries: HistoryEntry[] = [];
  entries: HistoryEntry[] = [];
  loading = false;
  
  // Filter properties
  searchQuery = '';
  selectedMethod = 'All Methods';
  selectedStatus = 'All Status';

  constructor(private history: HistoryService) {}

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    this.loading = true;
    try {
      this.allEntries = await this.history.list();
      this.applyFilters();
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.allEntries];

    // Filter by search query (URL)
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.url.toLowerCase().includes(query));
    }

    // Filter by method
    if (this.selectedMethod !== 'All Methods') {
      filtered = filtered.filter(e => e.method === this.selectedMethod);
    }

    // Filter by status
    if (this.selectedStatus !== 'All Status') {
      filtered = filtered.filter(e => {
        const status = e.status;
        if (this.selectedStatus === '2xx Success') return status >= 200 && status < 300;
        if (this.selectedStatus === '3xx Redirect') return status >= 300 && status < 400;
        if (this.selectedStatus === '4xx Client Error') return status >= 400 && status < 500;
        if (this.selectedStatus === '5xx Server Error') return status >= 500 && status < 600;
        return true;
      });
    }

    this.entries = filtered;
  }

  async clear() {
    if (confirm('Are you sure you want to clear all history?')) {
      await this.history.clear();
      await this.refresh();
    }
  }

  async deleteEntry(id: number | undefined) {
    if (id && confirm('Delete this entry?')) {
      await this.history.deleteEntry(id);
      await this.refresh();
    }
  }
}
