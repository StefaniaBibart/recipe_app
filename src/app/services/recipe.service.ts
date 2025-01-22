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

  private async loadRecipes() {
    this.isLoading.set(true);
    try {
      await this.recipeDataService.getRecipes();
      this.allRecipes.set(this.recipeDataService.recipes());
      this.totalCount.set(this.recipeDataService.recipes().length);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  currentRecipe = computed(() => {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    return recipes.length > 0 ? recipes[this.currentIndex()] : null;
  });

  noRecipesFound = computed(() => {
    return this.searchPerformed() && this.filteredRecipes().length === 0 && this.ingredients().length > 0;
  });

  canSearch = computed(() => this.ingredients().length >= 2);
  
  addIngredient(ingredient: string) {
    if (!this.ingredients().includes(ingredient.toLowerCase())) {
      this.ingredients.update(ingredients => [...ingredients, ingredient.toLowerCase()]);
    }
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
          searchIngredients.every(searchIngredient =>
            recipe.ingredients.some(ri => 
              ri.name.toLowerCase().includes(searchIngredient)
            )
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

