// TO DO: Remove this file and replace with the one in the models folder

export interface Recipe {
  id: string;
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

export interface InstructionStep {
  text: string;
  showNumber: boolean;
  isTitle: boolean;
  stepNumber?: number;
}