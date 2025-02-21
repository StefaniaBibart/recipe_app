import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { RecipeCardComponent } from './components/recipe-card/recipe-card.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { AuthService } from './services/auth.service';
import { UiService } from './services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, RecipeCardComponent, SidebarComponent, FavoritesComponent,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'recipe-app';
  private router = inject(Router);
  private authService = inject(AuthService);
  private uiService = inject(UiService);
  sidebarHidden = this.uiService.sidebarHidden;

  ngOnInit() {
    this.authService.autoLogin();
  }

  toggleSidebar() {
    this.uiService.toggleSidebar();
  }

  isHomeRoute() {
    return this.router.url === '/home' || this.router.url === '/';
  }
}
