import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptorService } from './components/authentication/auth-interceptor.service';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  databaseURL: "https://recipe-app-44ea7-default-rtdb.europe-west1.firebasedatabase.app",
};

initializeApp(firebaseConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true
    }
  ]
};
