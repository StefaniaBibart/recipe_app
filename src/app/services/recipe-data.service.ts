import { Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';

@Injectable({
  providedIn: 'root',
})
export class RecipeDataService {
  private storageKey = 'mealdb_meals';
  recipes = signal<Recipe[]>([]);

  constructor() {
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

  private extractIngredients(meal: any): { name: string; measure: string }[] {
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

  hasStoredData(): boolean {
    return !!localStorage.getItem(this.storageKey);
  }
}
