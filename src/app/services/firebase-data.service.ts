import { Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { getDatabase, ref, get, set, child, remove } from 'firebase/database';
import { DataService } from './data.service';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class FirebaseDataService extends DataService {
  private baseUrl = 'https://recipe-app-44ea7-default-rtdb.europe-west1.firebasedatabase.app';
  private dbPath = 'mealdb/meals';
  private dbPaths = {
    categories: 'mealdb/categories',
    areas: 'mealdb/areas',
    ingredients: 'mealdb/ingredients',
    meals: 'mealdb/meals',
    lastSync: 'mealdb/lastSync',
  };

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    super();
    this.loadRecipesFromFirebase();
  }

  async getRecipes(forceRefresh = false): Promise<void> {
    if (forceRefresh || this.recipes().length === 0) {
      await this.loadRecipesFromFirebase();
    }
  }

  async clearCache(): Promise<void> {
    this.recipes.set([]);
  }

  async storeData(path: string, data: any): Promise<void> {
    try {
      const db = getDatabase();
      const dataRef = ref(db, path);
      await set(dataRef, data);
    } catch (error) {
      console.error(`Error storing data to Firebase at ${path}:`, error);
      throw error;
    }
  }

  async getData(path: string): Promise<any> {
    try {
      const db = getDatabase();
      const dataRef = ref(db, path);
      const snapshot = await get(dataRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`Error getting data from Firebase at ${path}:`, error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<number> {
    try {
      const lastSync = await this.getData(this.dbPaths.lastSync);
      return lastSync || 0;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return 0;
    }
  }

  async updateLastSyncTime(timestamp: number): Promise<void> {
    await this.storeData(this.dbPaths.lastSync, timestamp);
  }

  async clearStoredData(): Promise<void> {
    try {
      const db = getDatabase();
      const dbRef = ref(db, 'mealdb');
      await set(dbRef, null);
    } catch (error) {
      console.error('Error clearing Firebase data:', error);
      throw error;
    }
  }

  async getDataCounts(): Promise<{ categories: number; areas: number; ingredients: number; meals: number; }> {
    try {
      const db = getDatabase();
      const dbRef = ref(db);
      
      const [categoriesSnapshot, areasSnapshot, ingredientsSnapshot, mealsSnapshot] = await Promise.all([
        get(child(dbRef, this.dbPaths.categories)),
        get(child(dbRef, this.dbPaths.areas)),
        get(child(dbRef, this.dbPaths.ingredients)),
        get(child(dbRef, this.dbPaths.meals))
      ]);
      
      const categories = categoriesSnapshot.exists() ? categoriesSnapshot.val() : [];
      const areas = areasSnapshot.exists() ? areasSnapshot.val() : [];
      const ingredients = ingredientsSnapshot.exists() ? ingredientsSnapshot.val() : [];
      const meals = mealsSnapshot.exists() ? Object.keys(mealsSnapshot.val()).length : 0;

      return {
        categories: Array.isArray(categories) ? categories.length : 0,
        areas: Array.isArray(areas) ? areas.length : 0,
        ingredients: Array.isArray(ingredients) ? ingredients.length : 0,
        meals,
      };
    } catch (error) {
      console.error('Error getting data counts:', error);
      return { categories: 0, areas: 0, ingredients: 0, meals: 0 };
    }
  }

  private async loadRecipesFromFirebase() {
    try {
      const db = getDatabase();
      const mealsRef = ref(db, this.dbPath);
      const snapshot = await get(mealsRef);
      
      if (snapshot.exists()) {
        const mealsObject = snapshot.val();
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
      }
    } catch (error) {
      console.error('Error loading recipes from Firebase:', error);
    }
  }

  async hasStoredData(): Promise<boolean> {
    try {
      const db = getDatabase();
      const mealsRef = ref(db, this.dbPath);
      const snapshot = await get(mealsRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking for stored data:', error);
      return false;
    }
  }

  fetchFavorites(): Observable<{ [key: string]: Recipe }> {
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of({});
        }
        
        return this.http.get<{ [key: string]: Recipe }>(
          `${this.baseUrl}/favorites/${user.id}.json?auth=${user.token}`
        ).pipe(
          map(recipes => recipes || {}),
          catchError(error => {
            console.error('Error fetching favorites:', error);
            return of({});
          })
        );
      })
    );
  }

  storeFavoriteRecipe(recipe: Recipe): Observable<void> {
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }
        
        return this.http.put(
          `${this.baseUrl}/favorites/${user.id}/${recipe.id}.json?auth=${user.token}`,
          recipe
        ).pipe(
          map(() => undefined),
          catchError(error => {
            console.error('Error storing favorite:', error);
            return of(undefined);
          })
        );
      })
    );
  }

  removeFavoriteRecipe(recipeId: string): Observable<void> {
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }
        
        return this.http.delete(
          `${this.baseUrl}/favorites/${user.id}/${recipeId}.json?auth=${user.token}`
        ).pipe(
          map(() => undefined),
          catchError(error => {
            console.error('Error removing favorite:', error);
            return of(undefined);
          })
        );
      })
    );
  }

  clearAllFavorites(): Observable<void> {
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }
        
        return this.http.delete(
          `${this.baseUrl}/favorites/${user.id}.json?auth=${user.token}`
        ).pipe(
          map(() => undefined),
          catchError(error => {
            console.error('Error clearing all favorites:', error);
            return of(undefined);
          })
        );
      })
    );
  }
}
