import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeDataService } from '../../services/recipe-data.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RecipeCardComponent, RouterModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent implements OnInit, OnDestroy {
  private recipeService = inject(RecipeService);
  private destroy$ = new Subject<void>();
  public recipeDataService = inject(RecipeDataService);
  favoriteRecipes = signal<Recipe[]>([]);
  selectedRecipeId = signal<string>('');
  removedRecipeId = signal<string | null>(null);

  ngOnInit() {
    this.recipeService.favorites$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(favorites => {
      const recipesArray = Object.values(favorites);
      this.favoriteRecipes.set(recipesArray);
      
      if (!this.selectedRecipeId() && recipesArray.length > 0) {
        this.selectedRecipeId.set(recipesArray[0].id);
      }
    });

    this.recipeService.favoriteRemoved$.subscribe(recipeId => {
      this.removedRecipeId.set(recipeId);
      this.favoriteRecipes.update(recipes => 
        recipes.filter(recipe => recipe.id !== recipeId)
      );
    });

    this.recipeService.favoriteAdded$.subscribe(recipe => {
      if (recipe.id === this.removedRecipeId()) {
        this.favoriteRecipes.update(recipes => [...recipes, recipe]);
        this.removedRecipeId.set(null);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectRecipe(recipe: Recipe) {
    this.selectedRecipeId.set(recipe.id);
  }
}
