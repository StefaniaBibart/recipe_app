export interface Recipe {
  name: string;
  instructions: string;
  ingredients: {
    name: string;
    measure: string;
  }[];
  image: string;
  area: string;
  category: string;
}