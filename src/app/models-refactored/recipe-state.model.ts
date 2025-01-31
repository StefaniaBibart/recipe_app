export interface RecipeState {
  currentIndex: number;
  totalCount: number;
  isLoading: boolean;
  searchPerformed: boolean;
  ingredients: string[];
  favorites: string[];
}

export interface RecipeSearchState {
  ingredients: string[];
  searchPerformed: boolean;
  isLoading: boolean;
} 