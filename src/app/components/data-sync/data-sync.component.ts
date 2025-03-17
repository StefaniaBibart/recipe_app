import { Component, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataSyncService } from '../../services/data-sync.service';

@Component({
  selector: 'app-data-sync',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-sync.component.html',
  styleUrls: ['./data-sync.component.css']
})
export class DataSyncComponent implements OnInit, OnDestroy {
  private dataSyncService = inject(DataSyncService);
  isSyncing = false;
  error = '';
  lastSyncTime = 'Never synced';
  private intervalId: any;
  progress = computed(() => this.dataSyncService.getProgress());
  dataCounts = computed(() => this.dataSyncService.getDataCounts());

  ngOnInit() {
    this.updateLastSyncTime();
    this.intervalId = setInterval(() => this.updateLastSyncTime(), 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateLastSyncTime() {
    this.dataSyncService.getTimeSinceLastSync().then(time => {
      this.lastSyncTime = time;
    });
  }

  async startSync() {
    this.isSyncing = true;
    this.error = '';
    
    try {
      await this.dataSyncService.syncAll();
      this.updateLastSyncTime();
    } catch (err) {
      this.error = 'Error during sync. Please try again.';
      console.error(err);
    } finally {
      this.isSyncing = false;
    }
  }

  async clearStorage() {
    if (confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
      try {
        await this.dataSyncService.clearStorage();
        this.error = '';
        this.lastSyncTime = 'Never synced';
      } catch (err) {
        this.error = 'Error clearing storage. Please try again.';
        console.error(err);
      }
    }
  }
} 