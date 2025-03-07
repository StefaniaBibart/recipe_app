import { Injectable } from '@angular/core';

export enum DataProviderType {
  FIREBASE = 'firebase',
  LOCALSTORAGE = 'localstorage'
}

@Injectable({
  providedIn: 'root'
})
export class DataProviderService {
  private providerType: DataProviderType = DataProviderType.FIREBASE; // Default provider

  setProvider(type: DataProviderType) {
    this.providerType = type;
  }

  getProviderType(): DataProviderType {
    return this.providerType;
  }
} 