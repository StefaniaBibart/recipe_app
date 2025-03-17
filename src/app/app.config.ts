import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { DataService } from './services/data.service';
import { FirebaseDataService } from './services/firebase-data.service';
import { LocalstorageDataService } from './services/localstorage-data.service';
import { DataProviderType, DataProviderService } from './services/data-provider.service';
import { FavoriteSyncService } from './services/favorite-sync.service';

const firebaseConfig = {
  databaseURL: "https://recipe-app-44ea7-default-rtdb.europe-west1.firebasedatabase.app",
};

// Initialize Firebase
initializeApp(firebaseConfig);

// Set which data provider to use
const DATA_PROVIDER = DataProviderType.FIREBASE;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Register both service implementations
    FirebaseDataService,
    LocalstorageDataService,
    FavoriteSyncService,
    // Configure the DataProviderService
    {
      provide: DataProviderService,
      useFactory: () => {
        const service = new DataProviderService();
        service.setProvider(DATA_PROVIDER);
        return service;
      }
    },
    // Use factory to provide the correct implementation based on configuration
    {
      provide: DataService,
      useFactory: (
        firebaseService: FirebaseDataService,
        localStorageService: LocalstorageDataService,
        providerService: DataProviderService
      ) => {
        const providerType = providerService.getProviderType();
        return providerType === DataProviderType.FIREBASE
          ? firebaseService
          : localStorageService;
      },
      deps: [FirebaseDataService, LocalstorageDataService, DataProviderService]
    }
  ]
};
