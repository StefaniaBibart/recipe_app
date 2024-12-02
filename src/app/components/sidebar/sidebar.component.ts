import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  public recipeService = inject(RecipeService);
  ingredients = this.recipeService.ingredients;
  newIngredient = '';

  addIngredient() {
    if (this.newIngredient.trim()) {
      this.recipeService.addIngredient(this.newIngredient.trim());
      this.newIngredient = '';
    }
  }

  removeIngredient(ingredient: string) {
    this.recipeService.removeIngredient(ingredient);
  }

  searchRecipes() {
    this.recipeService.searchRecipes();
  }

  clearSearch() {
    this.recipeService.clearSearch();
  }
}
