import { Injectable, signal, computed } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { Subject, BehaviorSubject } from 'rxjs';
import { DataService } from './data.service';
import { DataProviderService } from './data-provider.service';
import { FavoriteSyncService } from './favorite-sync.service';

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
  private favoritesSubject = new BehaviorSubject<{ [key: string]: Recipe }>({});
  favorites$ = this.favoritesSubject.asObservable();
  private favorites = signal<{ [key: string]: Recipe }>(this.favoritesSubject.value);
  private lastRefreshTime = signal<number>(Date.now());
  private readonly REFRESH_INTERVAL = 24 * 60 * 60 * 1000;
  private favoriteRemovedSubject = new Subject<string>();
  private favoriteAddedSubject = new Subject<Recipe>();
  favoriteRemoved$ = this.favoriteRemovedSubject.asObservable();
  favoriteAdded$ = this.favoriteAddedSubject.asObservable();
  isClearingSearch = signal(false);

  constructor(
    private dataService: DataService,
    private dataProviderService: DataProviderService,
    private favoriteSyncService: FavoriteSyncService
  ) {
    this.loadRecipes();
    this.initializeFavorites();
    this.checkAndRefreshIfNeeded();
    
    this.dataProviderService.providerChanged$.subscribe(async (provider) => {
      console.log(`Data provider changed to ${provider}, syncing favorites...`);
      await this.favoriteSyncService.syncFavorites();
      this.initializeFavorites();
    });
  }

  private async loadRecipes() {
    await this.checkAndRefreshIfNeeded();
    this.isLoading.set(true);
    try {
      await this.dataService.getRecipes();
      this.allRecipes.set(this.dataService.recipes());
      this.totalCount.set(this.dataService.recipes().length);
      
      if (this.dataService.recipes().length === 0) {
        this.filteredRecipes.set([]);
        this.searchPerformed.set(true);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      this.allRecipes.set([]);
      this.filteredRecipes.set([]);
      this.totalCount.set(0);
      this.searchPerformed.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  private initializeFavorites() {
    const favoritesObs = this.dataService.fetchFavorites();
    favoritesObs.subscribe({
      next: (favorites) => {
        if (favorites) {
          this.favoritesSubject.next(favorites);
          this.favorites.set(favorites);
        } else {
          this.favoritesSubject.next({});
          this.favorites.set({});
        }
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.favoritesSubject.next({});
        this.favorites.set({});
      }
    });
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
    
    if (this.ingredients().length < 2) {
      this.filteredRecipes.set([]);
      this.totalCount.set(this.allRecipes().length);
      this.currentIndex.set(0);
      this.searchPerformed.set(false);
    } else {
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
    this.isClearingSearch.set(true);
    this.checkAndRefreshIfNeeded();
    setTimeout(() => {
      this.ingredients.set([]);
      this.filteredRecipes.set([]);
      this.totalCount.set(this.allRecipes().length);
      this.currentIndex.set(0);
      this.searchPerformed.set(false);
      this.isClearingSearch.set(false);
    }, 1000);
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
      const removeObs = this.dataService.removeFavoriteRecipe(recipe.id);
      removeObs.subscribe({
        next: () => {
          const newFavs = { ...this.favorites() };
          delete newFavs[recipe.id];
          this.favoritesSubject.next(newFavs);
          this.favorites.set(newFavs);
          this.favoriteRemovedSubject.next(recipe.id);
          
          this.favoriteSyncService.markAsDeleted(recipe.id);
        },
        error: (error) => {
          console.error('Error removing favorite:', error);
        }
      });
    } else {
      const storeObs = this.dataService.storeFavoriteRecipe(recipe);
      storeObs.subscribe({
        next: () => {
          const newFavs = {
            ...this.favorites(),
            [recipe.id]: recipe
          };
          this.favoritesSubject.next(newFavs);
          this.favorites.set(newFavs);
          this.favoriteAddedSubject.next(recipe);
        },
        error: (error) => {
          console.error('Error adding favorite:', error);
        }
      });
    }
  }

  isFavorite(recipeId: string): boolean {
    return !!this.favorites()[recipeId];
  }

  getFavorites() {
    return this.dataService.fetchFavorites();
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
      await this.dataService.clearCache();
      await this.dataService.getRecipes(true);
      this.allRecipes.set(this.dataService.recipes());
      this.totalCount.set(this.dataService.recipes().length);
      this.currentIndex.set(0);
      this.filteredRecipes.set([]);
      this.ingredients.set([]);
      this.searchPerformed.set(false);
    } catch (error) {
      console.error('Error refreshing recipes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  getRecipeById(id: string): Recipe | null {
    const fromFavorites = this.favorites()[id];
    if (fromFavorites) return fromFavorites;

    const fromAll = this.allRecipes().find(recipe => recipe.id === id);
    if (fromAll) return fromAll;

    return null;
  }
}

