import { Injectable, signal, computed } from '@angular/core';
import { RecipeDataService } from './recipe-data.service';
import { Recipe } from '../models/recipe.model';
import { DataStorageService } from './data-storage.service';

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
  private favorites = signal<{ [key: string]: Recipe }>({});
  private lastRefreshTime = signal<number>(Date.now());
  private readonly REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

  constructor(
    private recipeDataService: RecipeDataService,
    private dataStorageService: DataStorageService
  ) {
    this.loadRecipes();
    this.loadFavorites();
    this.checkAndRefreshIfNeeded();
  }

  private async loadRecipes() {
    await this.checkAndRefreshIfNeeded();
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

  private loadFavorites() {
    const favoritesObs = this.dataStorageService.fetchFavorites();
    if (favoritesObs) {
      favoritesObs.subscribe(favorites => {
        this.favorites.set(favorites);
      });
    }
  }

  currentRecipe() {
    const recipes = this.filteredRecipes().length > 0 ? this.filteredRecipes() : this.allRecipes();
    if (recipes.length === 0) return null;
    
    const recipe = recipes[this.currentIndex()];
    return {
      ...recipe,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        measure: this.normalizeFraction(ing.measure)
      }))
    };
  }

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
    
    // If less than 2 ingredients left, show all recipes
    if (this.ingredients().length < 2) {
      this.filteredRecipes.set([]);
      this.totalCount.set(this.allRecipes().length);
      this.currentIndex.set(0);
      this.searchPerformed.set(false);
    } else {
      // Re-run search with remaining ingredients if we still have 2 or more
      this.searchRecipes();
    }
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
    this.checkAndRefreshIfNeeded();
    this.ingredients.set([]);
    this.filteredRecipes.set([]);
    this.totalCount.set(this.allRecipes().length);
    this.currentIndex.set(0);
  }

  private normalizeFraction(measure: string): string {
    const fractionMap: { [key: string]: string } = {
      '1/2': '½',
      '1/3': '⅓',
      '2/3': '⅔',
      '1/4': '¼',
      '3/4': '¾',
      '1/8': '⅛',
      '3/8': '⅜',
      '5/8': '⅝',
      '7/8': '⅞'
    };

    return measure.replace(/(\d+)\/(\d+)/g, (match) => {
      return fractionMap[match] || match;
    });
  }

  setFavorites(favorites: { [key: string]: Recipe }) {
    this.favorites.set(favorites);
  }

  toggleFavorite(recipe: Recipe) {
    if (this.isFavorite(recipe.id)) {
      const removeObs = this.dataStorageService.removeFavoriteRecipe(recipe.id);
      if (removeObs) {
        removeObs.subscribe(() => {
          this.favorites.update(favs => {
            const newFavs = { ...favs };
            delete newFavs[recipe.id];
            return newFavs;
          });
        });
      }
    } else {
      const storeObs = this.dataStorageService.storeFavoriteRecipe(recipe);
      if (storeObs) {
        storeObs.subscribe(() => {
          this.favorites.update(favs => ({
            ...favs,
            [recipe.id]: recipe
          }));
        });
      }
    }
  }

  isFavorite(recipeId: string): boolean {
    return !!this.favorites()[recipeId];
  }

  getFavorites() {
    return this.favorites();
  }

  async checkAndRefreshIfNeeded() {
    const now = Date.now();
    if (now - this.lastRefreshTime() > this.REFRESH_INTERVAL) {
      await this.refreshRecipes();
      this.lastRefreshTime.set(now);
    }
  }

  async refreshRecipes() {
    this.isLoading.set(true);
    try {
      await this.recipeDataService.clearCache();
      await this.recipeDataService.getRecipes(true);
      this.allRecipes.set(this.recipeDataService.recipes());
      this.totalCount.set(this.recipeDataService.recipes().length);
      this.currentIndex.set(0);
      this.filteredRecipes.set([]); // Reset filtered recipes
      this.ingredients.set([]); // Reset ingredients
      this.searchPerformed.set(false); // Reset search state
    } catch (error) {
      console.error('Error refreshing recipes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}

