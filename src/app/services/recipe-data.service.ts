import { Injectable, signal } from '@angular/core';
import { Recipe } from '../recipe.model';

@Injectable({
  providedIn: 'root',
})
export class RecipeDataService {
  private apiUrl = 'https://www.themealdb.com/api/json/v1/1';
  private localStorageKey = 'recipes';
  recipes = signal<Recipe[]>([]);

  constructor() {
    this.loadRecipesFromStorage();
  }

  private loadRecipesFromStorage() {
    const storedRecipes = localStorage.getItem(this.localStorageKey);
    if (storedRecipes) {
      this.recipes.set(JSON.parse(storedRecipes));
    }
  }

  async getRecipes(): Promise<void> {
    if (this.recipes().length > 0) {
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/search.php?s=`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      const recipes: Recipe[] = data.meals.map((meal: any) => {
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

        return {
          name: meal.strMeal,
          instructions: meal.strInstructions,
          ingredients: ingredients,
          image: meal.strMealThumb,
          area: meal.strArea,
          category: meal.strCategory
        };
      });

      localStorage.setItem(this.localStorageKey, JSON.stringify(recipes));
      this.recipes.set(recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  }
}
