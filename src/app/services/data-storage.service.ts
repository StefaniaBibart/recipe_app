import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, take } from 'rxjs';
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
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        return this.http.put(
          `${this.baseUrl}/favorites/${user.id}/${recipe.id}.json?auth=${user.token}`,
          recipe
        );
      })
    );
  }

  removeFavoriteRecipe(recipeId: string) {
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        return this.http.delete(
          `${this.baseUrl}/favorites/${user.id}/${recipeId}.json?auth=${user.token}`
        );
      })
    );
  }

  fetchFavorites(): Observable<{ [key: string]: Recipe }> {
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        return this.http.get<{ [key: string]: Recipe }>(
          `${this.baseUrl}/favorites/${user.id}.json?auth=${user.token}`
        ).pipe(
          map(recipes => recipes || {})
        );
      })
    );
  }
}