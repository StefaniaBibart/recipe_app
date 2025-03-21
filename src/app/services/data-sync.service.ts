import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { signal } from '@angular/core';
import { DataService } from './data.service';

interface Category {
  strCategory: string;
}

interface Area {
  strArea: string;
}

interface Ingredient {
  idIngredient: string;
  strIngredient: string;
  strDescription: string | null;
  strType: string | null;
}

interface MealPreview {
  strMeal: string;
  strMealThumb: string;
  idMeal: string;
}

interface MealDetail {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  [key: string]: any; // For dynamic ingredient/measure properties
}

interface SyncOperation {
  name: string;
  current: number;
  total: number;
  subOperations: {
    name: string;
    current: number;
    total: number;
  }[];
}

interface SyncProgress {
  currentOperation: string;
  operations: SyncOperation[];
}

interface DataCounts {
  categories: number;
  areas: number;
  ingredients: number;
  meals: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataSyncService {
  private apiUrl = 'https://www.themealdb.com/api/json/v1/1';
  private dbPaths = {
    categories: 'mealdb/categories',
    areas: 'mealdb/areas',
    ingredients: 'mealdb/ingredients',
    meals: 'mealdb/meals',
    lastSync: 'mealdb/lastSync',
  };
  private progress = signal<SyncProgress>({
    currentOperation: '',
    operations: [],
  });
  private dataCounts = signal<DataCounts>({
    categories: 0,
    areas: 0,
    ingredients: 0,
    meals: 0,
  });

  constructor(
    private http: HttpClient,
    private dataService: DataService
  ) {
    this.updateDataCounts();
  }

  async syncAll(): Promise<void> {
    try {
      // Initialize progress with empty operations
      this.progress.set({
        currentOperation: 'Initializing...',
        operations: [],
      });

      // Fetch initial lists
      const [categories, areas, ingredients] = await Promise.all([
        this.fetchCategories(),
        this.fetchAreas(),
        this.fetchIngredients(),
      ]);

      // Store and update counts
      await Promise.all([
        this.dataService.storeData(this.dbPaths.categories, categories),
        this.dataService.storeData(this.dbPaths.areas, areas),
        this.dataService.storeData(this.dbPaths.ingredients, ingredients),
      ]);
      
      await this.updateDataCounts();

      // Add categories operation
      this.progress.update((p) => ({
        ...p,
        operations: [
          {
            name: 'Categories',
            current: 0,
            total: categories.length,
            subOperations: [],
          },
          ...p.operations,
        ],
      }));

      // Process categories
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const meals = await this.rateLimitedRequest(
          this.fetchMealsByCategory(category.strCategory),
          `Fetching meals for category: ${category.strCategory}`,
          true
        );

        // Add new sub-operation for current category
        this.progress.update((p) => {
          const categoryOp = p.operations[0];
          categoryOp.current = i + 1;
          categoryOp.subOperations = [
            {
              name: `Meals for ${category.strCategory}`,
              current: 0,
              total: meals.length,
            },
            ...categoryOp.subOperations,
          ];
          return { ...p };
        });

        // Process meals for this category
        for (let j = 0; j < meals.length; j++) {
          await this.rateLimitedRequest(
            this.fetchAndStoreMealDetails(meals[j].idMeal),
            `Fetching details for: ${meals[j].strMeal}`,
            true
          );

          // Update progress for the current category's meals
          this.progress.update((p) => {
            const categoryOp = p.operations[0];
            if (categoryOp.subOperations[0]) {
              categoryOp.subOperations[0].current = j + 1;
            }
            return { ...p };
          });
        }
      }

      // Process areas
      this.progress.update((p) => ({
        ...p,
        operations: [
          {
            name: 'Processing Areas',
            current: 0,
            total: areas.length,
            subOperations: [],
          },
          ...p.operations,
        ],
      }));

      for (let i = 0; i < areas.length; i++) {
        const area = areas[i];
        const meals = await this.rateLimitedRequest(
          this.fetchMealsByArea(area.strArea),
          `Fetching meals for area: ${area.strArea}`,
          true
        );

        // Add new sub-operation for current area
        this.progress.update((p) => {
          const areaOp = p.operations[0];
          areaOp.current = i + 1;
          areaOp.subOperations = [
            {
              name: `Meals for ${area.strArea}`,
              current: 0,
              total: meals.length,
            },
            ...areaOp.subOperations,
          ];
          return { ...p };
        });

        // Process meals for this area
        for (let j = 0; j < meals.length; j++) {
          await this.rateLimitedRequest(
            this.fetchAndStoreMealDetails(meals[j].idMeal),
            `Fetching details for: ${meals[j].strMeal}`,
            true
          );

          // Update progress for the current area's meals
          this.progress.update((p) => {
            const areaOp = p.operations[0];
            if (areaOp.subOperations[0]) {
              areaOp.subOperations[0].current = j + 1;
            }
            return { ...p };
          });
        }
      }

      // Process ingredients
      this.progress.update((p) => ({
        ...p,
        operations: [
          {
            name: 'Processing Ingredients',
            current: 0,
            total: ingredients.length,
            subOperations: [],
          },
          ...p.operations,
        ],
      }));

      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        const meals = await this.rateLimitedRequest(
          this.fetchMealsByIngredient(ingredient.strIngredient),
          `Fetching meals for ingredient: ${ingredient.strIngredient}`,
          true
        );

        // Add new sub-operation for current ingredient
        this.progress.update((p) => {
          const ingredientOp = p.operations[0];
          ingredientOp.current = i + 1;
          ingredientOp.subOperations = [
            {
              name: `Meals for ${ingredient.strIngredient}`,
              current: 0,
              total: meals.length,
            },
            ...ingredientOp.subOperations,
          ];
          return { ...p };
        });

        // Process meals
        for (let j = 0; j < meals.length; j++) {
          await this.rateLimitedRequest(
            this.fetchAndStoreMealDetails(meals[j].idMeal),
            `Fetching details for: ${meals[j].strMeal}`,
            true
          );

          // Update the first sub-operation (current ingredient)
          this.progress.update((p) => {
            const ingredientOp = p.operations[0];
            if (ingredientOp.subOperations[0]) {
              ingredientOp.subOperations[0].current = j + 1;
            }
            return { ...p };
          });
        }
      }

      // Make sure to update data counts at the end
      await this.updateDataCounts();
      
      // Force a refresh of the recipes in the data service
      await this.dataService.getRecipes(true);
      
      await this.updateLastSyncTime();
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    }
  }

  private async fetchCategories(): Promise<Category[]> {
    const response = await firstValueFrom(
      this.http.get<{ meals: Category[] }>(`${this.apiUrl}/list.php?c=list`)
    );
    return response.meals;
  }

  private async fetchAreas(): Promise<Area[]> {
    const response = await firstValueFrom(
      this.http.get<{ meals: Area[] }>(`${this.apiUrl}/list.php?a=list`)
    );
    return response.meals;
  }

  private async fetchIngredients(): Promise<Ingredient[]> {
    const response = await firstValueFrom(
      this.http.get<{ meals: Ingredient[] }>(`${this.apiUrl}/list.php?i=list`)
    );
    return response.meals;
  }

  private async fetchMealsByCategory(category: string): Promise<MealPreview[]> {
    const response = await this.rateLimitedRequest(
      firstValueFrom(
        this.http.get<{ meals: MealPreview[] }>(
          `${this.apiUrl}/filter.php?c=${encodeURIComponent(category)}`
        )
      ),
      `Fetching meals for category: ${category}`,
      true
    );
    return response.meals || [];
  }

  private async fetchMealsByArea(area: string): Promise<MealPreview[]> {
    const response = await this.rateLimitedRequest(
      firstValueFrom(
        this.http.get<{ meals: MealPreview[] }>(
          `${this.apiUrl}/filter.php?a=${encodeURIComponent(area)}`
        )
      ),
      `Fetching meals for area: ${area}`,
      true
    );
    return response.meals || [];
  }

  private async fetchMealsByIngredient(
    ingredient: string
  ): Promise<MealPreview[]> {
    const response = await firstValueFrom(
      this.http.get<{ meals: MealPreview[] }>(
        `${this.apiUrl}/filter.php?i=${encodeURIComponent(ingredient)}`
      )
    );
    return response.meals || [];
  }

  private async getStoredMeals(): Promise<{ [key: string]: MealDetail }> {
    try {
      const meals = await this.dataService.getData(this.dbPaths.meals);
      return meals || {};
    } catch (error) {
      console.error('Error getting stored meals:', error);
      return {};
    }
  }

  private async fetchAndStoreMealDetails(mealId: string): Promise<MealDetail> {
    const storedMeals = await this.getStoredMeals();

    // Skip API call if meal already exists
    if (storedMeals[mealId]) {
      // Pass skipRateLimit as true since we're not making an API call
      return this.rateLimitedRequest(
        Promise.resolve(storedMeals[mealId]),
        `Loading stored meal: ${storedMeals[mealId].strMeal}`,
        true
      );
    }

    const response = await this.rateLimitedRequest(
      firstValueFrom(
        this.http.get<{ meals: MealDetail[] }>(
          `${this.apiUrl}/lookup.php?i=${mealId}`
        )
      ),
      `Fetching meal details: ${mealId}`,
      false
    );

    const mealDetail = response.meals[0];
    
    // Store the updated meal
    await this.dataService.storeData(`${this.dbPaths.meals}/${mealId}`, mealDetail);
    await this.updateDataCounts();

    return mealDetail;
  }

  private async updateLastSyncTime(): Promise<void> {
    const timestamp = Date.now();
    await this.dataService.updateLastSyncTime(timestamp);
  }

  async getLastSyncTime(): Promise<number> {
    return this.dataService.getLastSyncTime();
  }

  async getTimeSinceLastSync(): Promise<string> {
    const lastSync = await this.getLastSyncTime();
    if (!lastSync) return 'Never synced';

    const diff = Date.now() - lastSync;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s ago`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async rateLimitedRequest<T>(
    request: Promise<T>,
    operation: string,
    skipRateLimit = false
  ): Promise<T> {
    this.progress.update((p) => ({ ...p, currentOperation: operation }));
    try {
      const result = await request;
      // Only wait if rate limit is not skipped
      if (!skipRateLimit) {
        await this.delay(1100);
      }
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 5 seconds...');
        await this.delay(5000);
        return this.rateLimitedRequest(request, operation);
      }
      throw error;
    }
  }

  getProgress(): SyncProgress {
    return this.progress();
  }

  getDataCounts() {
    return this.dataCounts();
  }

  private async updateDataCounts() {
    try {
      const counts = await this.dataService.getDataCounts();
      this.dataCounts.set(counts);
    } catch (error) {
      console.error('Error updating data counts:', error);
    }
  }

  async clearStorage() {
    await this.dataService.clearStoredData();
    await this.updateDataCounts();
  }
}
