import { Injectable, signal, computed } from '@angular/core';
import { RecipeDataService } from './recipe-data.service';
import { Recipe } from '../recipe.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private allRecipes = signal<Recipe[]>([]);

  private filteredRecipes = signal<Recipe[]>([]);
  private currentIndex = signal(0);

  ingredients = signal<string[]>([]);

  constructor(private recipeDataService: RecipeDataService) {
    this.loadRecipes();
  }

  private loadRecipes() {
    this.recipeDataService.getRecipesFromJson().subscribe({
      next: (recipes) => this.allRecipes.update(() => recipes),
      error: (err) => console.error('Error loading recipes:', err),
    });
  }

  currentRecipe = computed(() => {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    return recipes[this.currentIndex()];
  });

  addIngredient(ingredient: string) {
    this.ingredients.update(ingredients => [...ingredients, ingredient]);
  }

  removeIngredient(ingredient: string) {
    this.ingredients.update(ingredients => ingredients.filter(i => i !== ingredient));
  }

  searchRecipes() {
    this.isLoading.set(true);
    setTimeout(() => {
      const searchIngredients = this.ingredients();
      if (searchIngredients.length === 0) {
        this.filteredRecipes.set([]);
      } else {
        const filtered = this.allRecipes().filter(recipe =>
          searchIngredients.every(ingredient =>
            recipe.ingredients.includes(ingredient)
          )
        );
        this.filteredRecipes.set(filtered);
      }
      this.currentIndex.set(0);
      this.isLoading.set(false);
    }, 1000); // Simulate a delay for the search
  }

  nextRecipe() {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    this.currentIndex.update(index => (index + 1) % recipes.length);
  }

  previousRecipe() {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    this.currentIndex.update(index => (index - 1 + recipes.length) % recipes.length);
  }

  isLoading = signal(false);
  noRecipesFound = computed(() => this.filteredRecipes().length === 0 && this.ingredients().length > 0);

  clearSearch() {
    this.ingredients.set([]);
    this.filteredRecipes.set([]);
    this.currentIndex.set(0);
  }
}

