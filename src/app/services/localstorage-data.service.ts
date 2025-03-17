import { Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { DataService } from './data.service';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';

@Injectable()
export class LocalstorageDataService extends DataService {
  private storageKey = 'mealdb_meals';
  private storagePaths = {
    categories: 'mealdb_categories',
    areas: 'mealdb_areas',
    ingredients: 'mealdb_ingredients',
    meals: 'mealdb_meals',
    lastSync: 'mealdb_lastSync',
  };

  constructor(private authService: AuthService) {
    super();
  }

  async getRecipes(forceRefresh = false): Promise<void> {
    if (forceRefresh || this.recipes().length === 0) {
      this.loadRecipesFromStorage();
    }
  }

  async clearCache(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    this.recipes.set([]);
  }

  async storeData(path: string, data: any): Promise<void> {
    try {
      const storageKey = this.getStorageKeyFromPath(path);
      
      if (path.startsWith('mealdb/meals/')) {
        const mealId = path.split('/').pop();
        const existingMeals = await this.getData(this.storagePaths.meals) || {};
        
        existingMeals[mealId as string] = data;
        
        localStorage.setItem(this.storagePaths.meals, JSON.stringify(existingMeals));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Error storing data to localStorage at ${path}:`, error);
      throw error;
    }
  }

  async getData(path: string): Promise<any> {
    try {
      const storageKey = this.getStorageKeyFromPath(path);
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting data from localStorage at ${path}:`, error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<number> {
    try {
      const lastSync = await this.getData(this.storagePaths.lastSync);
      return lastSync || 0;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return 0;
    }
  }

  async updateLastSyncTime(timestamp: number): Promise<void> {
    await this.storeData(this.storagePaths.lastSync, timestamp);
  }

  async clearStoredData(): Promise<void> {
    try {
      Object.values(this.storagePaths).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage data:', error);
      throw error;
    }
  }

  async getDataCounts(): Promise<{ categories: number; areas: number; ingredients: number; meals: number; }> {
    try {
      const categories = await this.getData(this.storagePaths.categories) || [];
      const areas = await this.getData(this.storagePaths.areas) || [];
      const ingredients = await this.getData(this.storagePaths.ingredients) || [];
      const meals = await this.getData(this.storagePaths.meals) || {};
      
      return {
        categories: Array.isArray(categories) ? categories.length : 0,
        areas: Array.isArray(areas) ? areas.length : 0,
        ingredients: Array.isArray(ingredients) ? ingredients.length : 0,
        meals: Object.keys(meals).length,
      };
    } catch (error) {
      console.error('Error getting data counts:', error);
      return { categories: 0, areas: 0, ingredients: 0, meals: 0 };
    }
  }

  async hasStoredData(): Promise<boolean> {
    return !!localStorage.getItem(this.storageKey);
  }

  private loadRecipesFromStorage() {
    const storedRecipes = localStorage.getItem(this.storagePaths.meals);
    if (storedRecipes) {
      try {
        const mealsObject = JSON.parse(storedRecipes);
        const recipesArray = Object.values(mealsObject).map((meal: any) => ({
          id: meal.idMeal,
          name: meal.strMeal,
          instructions: meal.strInstructions,
          ingredients: this.extractIngredients(meal),
          image: meal.strMealThumb,
          area: meal.strArea,
          category: meal.strCategory
        }));
        this.recipes.set(recipesArray);
        console.log(`Loaded ${recipesArray.length} recipes from localStorage`);
      } catch (error) {
        console.error('Error parsing recipes from localStorage:', error);
        this.recipes.set([]);
      }
    } else {
      this.recipes.set([]);
    }
  }

  private getStorageKeyFromPath(path: string): string {
    if (path.startsWith('mealdb/')) {
      return path.replace('mealdb/', 'mealdb_');
    }
    if (path.startsWith('mealdb/meals/')) {
      return this.storagePaths.meals;
    }
    
    return path;
  }

  fetchFavorites(): Observable<{ [key: string]: Recipe }> {
    const user = this.authService.user.getValue();
    if (!user) {
      return of({});
    }

    const favoritesKey = `favorites_${user.id}`;
    const storedFavorites = localStorage.getItem(favoritesKey);
    
    try {
      if (storedFavorites) {
        return of(JSON.parse(storedFavorites));
      }
      return of({});
    } catch (error) {
      console.error('Error parsing favorites from localStorage:', error);
      return of({});
    }
  }

  storeFavoriteRecipe(recipe: Recipe): Observable<void> {
    const user = this.authService.user.getValue();
    if (!user) {
      return of(undefined);
    }

    try {
      const favoritesKey = `favorites_${user.id}`;
      const storedFavorites = localStorage.getItem(favoritesKey);
      let favorites: { [key: string]: Recipe } = {};
      
      if (storedFavorites) {
        favorites = JSON.parse(storedFavorites);
      }
      
      favorites[recipe.id] = recipe;
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
      
      return of(undefined);
    } catch (error) {
      console.error('Error storing favorite in localStorage:', error);
      return of(undefined);
    }
  }

  removeFavoriteRecipe(recipeId: string): Observable<void> {
    const user = this.authService.user.getValue();
    if (!user) {
      return of(undefined);
    }

    try {
      const favoritesKey = `favorites_${user.id}`;
      const storedFavorites = localStorage.getItem(favoritesKey);
      
      if (storedFavorites) {
        const favorites = JSON.parse(storedFavorites);
        delete favorites[recipeId];
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
      }
      
      return of(undefined);
    } catch (error) {
      console.error('Error removing favorite from localStorage:', error);
      return of(undefined);
    }
  }

  clearAllFavorites(): Observable<void> {
    const user = this.authService.user.getValue();
    if (!user) {
      return of(undefined);
    }

    try {
      const favoritesKey = `favorites_${user.id}`;
      localStorage.setItem(favoritesKey, JSON.stringify({}));
      return of(undefined);
    } catch (error) {
      console.error('Error clearing all favorites from localStorage:', error);
      return of(undefined);
    }
  }
}