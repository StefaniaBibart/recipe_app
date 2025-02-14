import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { RecipeDataService } from '../../services/recipe-data.service';

@Component({
  selector: 'app-recipe-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-dashboard.component.html',
  styleUrls: ['./recipe-dashboard.component.css']
})
export class RecipeDashboardComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private recipeDataService = inject(RecipeDataService);
  
  selectedCategory = signal<string>('');
  selectedArea = signal<string>('');
  selectedIngredients = signal<string[]>([]);
  searchTerm = signal<string>('');
  
  categories = computed(() => {
    const recipes = this.recipeDataService.recipes();
    return [...new Set(recipes.map((r: Recipe) => r.category))].sort();
  });

  areas = computed(() => {
    const recipes = this.recipeDataService.recipes();
    return [...new Set(recipes.map((r: Recipe) => r.area))].sort();
  });

  ingredients = computed(() => {
    const recipes = this.recipeDataService.recipes();
    const allIngredients = recipes.flatMap(recipe => 
      recipe.ingredients.map(ing => ing.name.toLowerCase())
    );
    return [...new Set(allIngredients)].sort();
  });

  filteredRecipes = computed(() => {
    const recipes = this.recipeDataService.recipes();
    return recipes.filter((recipe: Recipe) => {
      const categoryMatch = !this.selectedCategory() || recipe.category === this.selectedCategory();
      const areaMatch = !this.selectedArea() || recipe.area === this.selectedArea();
      const ingredientsMatch = this.selectedIngredients().length === 0 || 
        this.selectedIngredients().every(ing => 
          recipe.ingredients.some(ri => ri.name.toLowerCase() === ing.toLowerCase())
        );
      return categoryMatch && areaMatch && ingredientsMatch;
    });
  });

  hasActiveFilters = computed(() => 
    !!this.selectedCategory() || 
    !!this.selectedArea() || 
    this.selectedIngredients().length > 0
  );

  ngOnInit() {
    if (!this.recipeService.currentRecipe()) {
      this.recipeService.searchRecipes();
    }
  }

  updateCategory(category: string) {
    this.selectedCategory.set(category);
  }

  updateArea(area: string) {
    this.selectedArea.set(area);
  }

  updateIngredients(ingredients: string[]) {
    this.selectedIngredients.set(ingredients);
  }

  clearCategory() {
    this.selectedCategory.set('');
  }

  clearArea() {
    this.selectedArea.set('');
  }

  removeIngredient(ingredient: string) {
    this.selectedIngredients.update(ingredients => 
      ingredients.filter(i => i !== ingredient)
    );
  }
} 