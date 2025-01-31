import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Recipe } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class DataStorageService {
  private baseUrl = 'https://recipe-app-44ea7-default-rtdb.europe-west1.firebasedatabase.app';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  storeFavoriteRecipe(recipe: Recipe) {
    const userId = this.authService.user.getValue()?.id;
    if (!userId) return;

    return this.http
      .put(
        `${this.baseUrl}/favorites/${userId}/${recipe.id}.json`,
        recipe
      );
  }

  removeFavoriteRecipe(recipeId: string) {
    const userId = this.authService.user.getValue()?.id;
    if (!userId) return;

    return this.http
      .delete(
        `${this.baseUrl}/favorites/${userId}/${recipeId}.json`
      );
  }

  fetchFavorites(): Observable<{ [key: string]: Recipe }> | undefined {
    const userId = this.authService.user.getValue()?.id;
    if (!userId) return undefined;

    return this.http
      .get<{ [key: string]: Recipe }>(
        `${this.baseUrl}/favorites/${userId}.json`
      )
      .pipe(
        map(recipes => recipes || {})
      );
  }
} 