import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.css'
})
export class RecipeCardComponent {
  public recipeService = inject(RecipeService);
  // currentRecipe = this.recipeService.currentRecipe();

  nextRecipe() {
    this.recipeService.nextRecipe();
  }

  previousRecipe() {
    this.recipeService.previousRecipe();
  }

  formatInstructions(instructions: string): { text: string; showNumber: boolean; isTitle: boolean; stepNumber?: number }[] {
    // First, check if it's a single paragraph without clear steps
    if (!instructions.includes('Step') && 
        !instructions.match(/\d+[\.\)]/) && 
        !instructions.includes('\n')) {
      return [{ text: instructions, showNumber: false, isTitle: false }];
    }

    // Remove "STEP X" prefixes and clean up the text
    let cleanText = instructions
      .replace(/STEP\s*\d+[\s:\.]*/gi, '')
      .replace(/\d+\.\d+\./g, '')  // Remove X.X. format
      .replace(/\d+\./g, '');      // Remove X. format

    // Split into steps
    let steps = cleanText
      .split(/\n+/)
      .map(step => step.trim())
      .filter(step => step.length > 0);

    // Process steps and identify titles
    let formattedSteps: { text: string; showNumber: boolean; isTitle: boolean; stepNumber?: number }[] = [];
    let stepCounter = 0;
    
    steps.forEach(step => {
      // Split step if it contains a title with colon
      const titleColonMatch = step.match(/^([A-Z\s]+):(.+)/);
      if (titleColonMatch) {
        // Add the title part
        formattedSteps.push({
          text: titleColonMatch[1],
          showNumber: false,
          isTitle: true
        });
        // Add the instruction part if it exists
        if (titleColonMatch[2].trim()) {
          stepCounter++;
          formattedSteps.push({
            text: titleColonMatch[2].trim(),
            showNumber: true,
            isTitle: false,
            stepNumber: stepCounter
          });
        }
      } else {
        // Check if the entire step is in uppercase
        const isFullTitle = /^[A-Z\s]+$/.test(step);
        if (isFullTitle) {
          formattedSteps.push({
            text: step,
            showNumber: false,
            isTitle: true
          });
        } else {
          stepCounter++;
          formattedSteps.push({
            text: step,
            showNumber: steps.length > 1,
            isTitle: false,
            stepNumber: stepCounter
          });
        }
      }
    });

    return formattedSteps;
  }
}
