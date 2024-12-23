import { Injectable, signal, computed } from '@angular/core';
import { RecipeDataService } from './recipe-data.service';
import { Recipe } from '../recipe.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private allRecipes = signal<Recipe[]>([]);

  private filteredRecipes = signal<Recipe[]>([]);
  currentIndex = signal(0);
  totalCount = signal(0);

  ingredients = signal<string[]>([]);

  searchPerformed = signal(false);
  isLoading = signal(false);

  constructor(private recipeDataService: RecipeDataService) {
    this.loadRecipes();
  }

  private loadRecipes() {
    this.recipeDataService.getRecipesFromJson().subscribe({
        next: (recipes) => {
            this.allRecipes.update(() => recipes);
            this.totalCount.set(recipes.length);
        },
        error: (err) => console.error('Error loading recipes:', err),
    });
  }

  currentRecipe = computed(() => {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    return recipes.length > 0 ? recipes[this.currentIndex()] : null;
  });

  noRecipesFound = computed(() => {
    return this.searchPerformed() && this.filteredRecipes().length === 0 && this.ingredients().length > 0;
  });
  
  addIngredient(ingredient: string) {
    this.ingredients.update(ingredients => [...ingredients, ingredient]);
  }

  removeIngredient(ingredient: string) {
    this.ingredients.update(ingredients => ingredients.filter(i => i !== ingredient));
  }

  searchRecipes() {
    this.isLoading.set(true);
    this.searchPerformed.set(true);
    setTimeout(() => {
      const searchIngredients = this.ingredients();
      if (searchIngredients.length === 0) {
        this.filteredRecipes.set([]);
        this.totalCount.set(0);
      } else {
        const filtered = this.allRecipes().filter(recipe =>
          searchIngredients.every(ingredient =>
            recipe.ingredients.includes(ingredient)
          )
        );
        this.filteredRecipes.set(filtered);
        this.totalCount.set(filtered.length);
      }
      this.currentIndex.set(0);
      this.isLoading.set(false);
    }, 1000);
  }

  nextRecipe() {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    this.currentIndex.update(index => (index + 1) % recipes.length);
  }

  previousRecipe() {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    this.currentIndex.update(index => (index - 1 + recipes.length) % recipes.length);
  }
  
  clearSearch() {
    this.ingredients.set([]);
    this.filteredRecipes.set([]);
    this.totalCount.set(this.allRecipes().length);
    this.currentIndex.set(0);
  }
}

