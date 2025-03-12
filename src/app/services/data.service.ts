import { Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';

@Injectable()
export abstract class DataService {
  recipes = signal<Recipe[]>([]);

  abstract getRecipes(forceRefresh?: boolean): Promise<void>;
  abstract clearCache(): Promise<void>;
  abstract hasStoredData(): Promise<boolean>;
  
  abstract storeData(path: string, data: any): Promise<void>;
  abstract getData(path: string): Promise<any>;
  abstract getLastSyncTime(): Promise<number>;
  abstract updateLastSyncTime(timestamp: number): Promise<void>;
  abstract clearStoredData(): Promise<void>;
  abstract getDataCounts(): Promise<{
    categories: number;
    areas: number;
    ingredients: number;
    meals: number;
  }>;
  
  protected extractIngredients(meal: any): { name: string; measure: string }[] {
    const ingredients: { name: string; measure: string }[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() && measure && measure.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          measure: measure.trim()
        });
      }
    }
    return ingredients;
  }
} 