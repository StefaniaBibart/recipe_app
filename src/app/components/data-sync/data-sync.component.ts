import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataSyncService } from '../../services/data-sync.service';
import { getDatabase, ref, set } from 'firebase/database';

@Component({
  selector: 'app-data-sync',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-sync.component.html',
  styleUrls: ['./data-sync.component.css']
})
export class DataSyncComponent {
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
    this.dataSyncService['updateDataCounts']();
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

    await this.dataSyncService.syncAll();
    this.updateLastSyncTime();
    this.isSyncing = false;
  }

  async clearStorage() {
    if (confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
      try {
        const db = getDatabase();
        const dbRef = ref(db, 'mealdb');
        await set(dbRef, null);
        
        this.dataSyncService['updateDataCounts']();
        this.error = '';
        this.lastSyncTime = 'Never synced';
      } catch (err) {
        this.error = 'Error clearing storage. Please try again.';
        console.error(err);
      }
    }
  }
} 