import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.css'
})
export class RecipeCardComponent {
  public recipeService = inject(RecipeService);
  // currentRecipe = this.recipeService.currentRecipe();

  nextRecipe() {
    this.recipeService.nextRecipe();
  }

  previousRecipe() {
    this.recipeService.previousRecipe();
  }
}
