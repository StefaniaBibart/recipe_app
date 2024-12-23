import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../recipe.model';

@Injectable({
  providedIn: 'root',
})
export class RecipeDataService {
  jsonUrl = '/assets/recipes.json';

  constructor(private http: HttpClient) {}

  getRecipesFromJson() {
    return this.http.get<Recipe[]>(this.jsonUrl);
  }
}
