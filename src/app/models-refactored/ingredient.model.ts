export interface Ingredient {
  name: string;
  measure: string;
}

export interface NormalizedIngredient extends Ingredient {
  normalizedMeasure: string;
}

export interface IngredientSearchParams {
  searchTerm: string;
  minQuantity?: number;
} 