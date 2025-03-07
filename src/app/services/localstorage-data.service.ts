import { Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { DataService } from './data.service';

@Injectable()
export class LocalstorageDataService extends DataService {
  private storageKey = 'mealdb_meals';

  constructor() {
    super();
    this.loadRecipesFromStorage();
  }

  async getRecipes(forceRefresh = false): Promise<void> {
    if (!forceRefresh) {
      this.loadRecipesFromStorage();
    }
  }

  async clearCache(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    this.recipes.set([]);
  }

  async hasStoredData(): Promise<boolean> {
    return !!localStorage.getItem(this.storageKey);
  }

  private loadRecipesFromStorage() {
    const storedRecipes = localStorage.getItem(this.storageKey);
    if (storedRecipes) {
      const mealsObject = JSON.parse(storedRecipes);
      // Convert object of meals to array
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
  }
}