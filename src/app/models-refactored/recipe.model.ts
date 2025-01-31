import { InstructionStep } from "./instruction.model";
import { Ingredient } from "./ingredient.model";

export interface Recipe {
  id: string;
  name: string;
  instructions: string;
  ingredients: Ingredient[];
  image: string;
  area: string;
  category: string;
}

export interface RecipeDetails extends Recipe {
  formattedInstructions: InstructionStep[];
  isFavorite: boolean;
} 