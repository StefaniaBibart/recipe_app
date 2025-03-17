import { Injectable } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { FirebaseDataService } from './firebase-data.service';
import { LocalstorageDataService } from './localstorage-data.service';
import { DataProviderService, DataProviderType } from './data-provider.service';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteSyncService {
  private recentlyDeletedFavorites: Set<string> = new Set();

  constructor(
    private firebaseDataService: FirebaseDataService,
    private localstorageDataService: LocalstorageDataService,
    private dataProviderService: DataProviderService,
    private authService: AuthService
  ) {}

  markAsDeleted(recipeId: string): void {
    this.recentlyDeletedFavorites.add(recipeId);
    setTimeout(() => {
      this.recentlyDeletedFavorites.delete(recipeId);
    }, 5 * 60 * 1000);
  }

  async syncFavorites(): Promise<void> {
    const user = this.authService.user.getValue();
    if (!user) {
      console.log('No user logged in, skipping favorites sync');
      return;
    }

    try {
      const firebaseFavorites = await firstValueFrom(this.firebaseDataService.fetchFavorites());
      const localStorageFavorites = await firstValueFrom(this.localstorageDataService.fetchFavorites());

      const currentProvider = this.dataProviderService.getProviderType();
      
      const authoritativeProvider = currentProvider;
      const authoritativeFavorites = authoritativeProvider === DataProviderType.FIREBASE 
        ? firebaseFavorites 
        : localStorageFavorites;
      
      await this.syncToFirebase(authoritativeFavorites);
      await this.syncToLocalStorage(authoritativeFavorites);
      
      console.log(`Favorites synchronized using ${authoritativeProvider} as the source of truth`);
    } catch (error) {
      console.error('Error synchronizing favorites:', error);
    }
  }

  private async syncToFirebase(favorites: { [key: string]: Recipe }): Promise<void> {
    const user = this.authService.user.getValue();
    if (!user) return;

    try {
      await firstValueFrom(this.firebaseDataService.clearAllFavorites());
      
      for (const recipeId in favorites) {
        if (!this.recentlyDeletedFavorites.has(recipeId)) {
          await firstValueFrom(this.firebaseDataService.storeFavoriteRecipe(favorites[recipeId]));
        }
      }
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
    }
  }

  private async syncToLocalStorage(favorites: { [key: string]: Recipe }): Promise<void> {
    const user = this.authService.user.getValue();
    if (!user) return;

    try {
      await firstValueFrom(this.localstorageDataService.clearAllFavorites());
      
      for (const recipeId in favorites) {
        if (!this.recentlyDeletedFavorites.has(recipeId)) {
          await firstValueFrom(this.localstorageDataService.storeFavoriteRecipe(favorites[recipeId]));
        }
      }
    } catch (error) {
      console.error('Error syncing to localStorage:', error);
    }
  }
}