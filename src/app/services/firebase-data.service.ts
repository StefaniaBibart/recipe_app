import { Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { getDatabase, ref, get } from 'firebase/database';
import { DataService } from './data.service';

@Injectable()
export class FirebaseDataService extends DataService {
  private dbPath = 'mealdb/meals';

  constructor() {
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
}
