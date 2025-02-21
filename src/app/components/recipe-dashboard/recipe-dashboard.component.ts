import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { RecipeDataService } from '../../services/recipe-data.service';
import { MultiselectComponent } from '../multiselect/multiselect.component';
import { SelectComponent } from '../select/select.component';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';

@Component({
  selector: 'app-recipe-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiselectComponent, SelectComponent, RecipeCardComponent],
  templateUrl: './recipe-dashboard.component.html',
  styleUrls: ['./recipe-dashboard.component.css']
})
export class RecipeDashboardComponent implements OnInit {
  private recipeService = inject(RecipeService);
  public recipeDataService = inject(RecipeDataService);
  
  selectedCategory = signal<string>('');
  selectedArea = signal<string>('');
  selectedIngredients = signal<string[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = 25;
  
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

  paginatedRecipes = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRecipes().slice(startIndex, endIndex);
  });

  totalPages = computed(() => 
    Math.ceil(this.filteredRecipes().length / this.itemsPerPage)
  );

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Always add current page
    pages.push(current);
    
    // Add up to 5 previous pages
    for (let i = 1; i <= 5; i++) {
      const prevPage = current - i;
      if (prevPage >= 1) {
        pages.unshift(prevPage);
      }
    }
    
    // Add up to 5 next pages
    for (let i = 1; i <= 5; i++) {
      const nextPage = current + i;
      if (nextPage <= total) {
        pages.push(nextPage);
      }
    }
    
    return pages;
  });

  hasActiveFilters = computed(() => 
    !!this.selectedCategory() || 
    !!this.selectedArea() || 
    this.selectedIngredients().length > 0
  );

  selectedRecipeId = signal<string>('');
  showModal = signal(false);

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

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  openRecipeDetails(recipe: Recipe) {
    this.selectedRecipeId.set(recipe.id);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedRecipeId.set('');
  }

  resetAllFilters() {
    this.selectedCategory.set('');
    this.selectedArea.set('');
    this.selectedIngredients.set([]);
    this.currentPage.set(1);
  }
} 