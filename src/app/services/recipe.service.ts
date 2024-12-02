import { Injectable, signal, computed } from '@angular/core';

interface Recipe {
  name: string;
  ingredients: string[];
  instructions: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private allRecipes = signal<Recipe[]>([
    {
      name: 'Pasta Carbonara',
      ingredients: ['spaghetti', 'eggs', 'bacon', 'parmesan cheese'],
      instructions: 'Cook pasta, fry bacon, mix eggs and cheese, combine all ingredients.'
    },
    {
      name: 'Chicken Stir Fry',
      ingredients: ['chicken', 'vegetables', 'soy sauce', 'oil'],
      instructions: 'Cut chicken and vegetables, stir fry in oil, add soy sauce.'
    },
    {
      name: 'Vegetable Soup',
      ingredients: ['carrots', 'celery', 'onions', 'vegetable broth'],
      instructions: 'Chop vegetables, sauté in pot, add broth, simmer until vegetables are tender.'
    }
  ]);

  private filteredRecipes = signal<Recipe[]>([]);
  private currentIndex = signal(0);

  ingredients = signal<string[]>([]);

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

