import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { RecipeCardComponent } from './components/recipe-card/recipe-card.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { AuthService } from './services/auth.service';
import { ByIngredientsComponent } from './components/by-ingredients/by-ingredients.component';
import { ByAreaComponent } from './components/by-area/by-area.component';
import { ByCategoryComponent } from './components/by-category/by-category.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, RecipeCardComponent, SidebarComponent, FavoritesComponent, ByIngredientsComponent, ByAreaComponent, ByCategoryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'recipe-app';
  sidebarHidden = signal(false);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.authService.autoLogin();
  }

  toggleSidebar() {
    this.sidebarHidden.update(value => !value);
  }

  isHomeRoute() {
    return this.router.url === '/home' || this.router.url === '/';
  }
}
