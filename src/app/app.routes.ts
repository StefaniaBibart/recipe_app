import { Routes } from '@angular/router';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { RecipeCardComponent } from './components/recipe-card/recipe-card.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { AuthGuard } from './components/authentication/auth.guard';
import { DataSyncComponent } from './components/data-sync/data-sync.component';
import { RecipeDashboardComponent } from './components/recipe-dashboard/recipe-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: RecipeCardComponent },
  { path: 'auth', component: AuthenticationComponent },
  { 
    path: 'favorites', 
    component: FavoritesComponent,
    canActivate: [AuthGuard]
  },
  { path: 'data-sync', component: DataSyncComponent },
  { path: 'dashboard', component: RecipeDashboardComponent }
];
