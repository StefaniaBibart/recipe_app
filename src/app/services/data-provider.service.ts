import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum DataProviderType {
  FIREBASE = 'firebase',
  LOCALSTORAGE = 'localstorage'
}

@Injectable({
  providedIn: 'root'
})
export class DataProviderService {
  private providerType: DataProviderType = DataProviderType.FIREBASE; // Default provider
  private providerChanged = new BehaviorSubject<DataProviderType>(this.providerType);
  
  providerChanged$ = this.providerChanged.asObservable();

  setProvider(type: DataProviderType) {
    const oldType = this.providerType;
    this.providerType = type;
    
    if (oldType !== type) {
      this.providerChanged.next(type);
    }
  }

  getProviderType(): DataProviderType {
    return this.providerType;
  }
} 