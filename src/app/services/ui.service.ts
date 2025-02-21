import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  sidebarHidden = signal(false);

  toggleSidebar() {
    this.sidebarHidden.update(value => !value);
  }

  setSidebarHidden(hidden: boolean) {
    this.sidebarHidden.set(hidden);
  }
} 