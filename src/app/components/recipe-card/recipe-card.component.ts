import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';
import { InstructionStep } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.css'
})
export class RecipeCardComponent {
  public recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  showRecipeDetails = signal(false);
  // currentRecipe = this.recipeService.currentRecipe();

  isAuthenticated() {
    return this.authService.user.getValue() !== null;
  }

  toggleRecipeDetails() {
    this.showRecipeDetails.update(value => !value);
  }

  nextRecipe() {
    this.recipeService.nextRecipe();
  }

  previousRecipe() {
    this.recipeService.previousRecipe();
  }

  private isSingleParagraph(instructions: string): boolean {
    return !instructions.includes('Step') && 
           !instructions.match(/\d+[\.\)]/) && 
           !instructions.includes('\n');
  }

  private cleanInstructionsText(text: string): string {
    return text
      .replace(/STEP\s*\d+[\s:\.]*/gi, '')
      .replace(/\d+\.\d+\./g, '')
      .replace(/\d+\./g, '');
  }

  private createStep(text: string, showNumber: boolean, isTitle: boolean, stepNumber?: number): InstructionStep {
    return { text, showNumber, isTitle, stepNumber };
  }

  private processStepWithTitle(step: string, stepCounter: number): { steps: InstructionStep[], newCounter: number } {
    const titleColonMatch = step.match(/^([A-Z\s]+):(.+)/);
    const steps: InstructionStep[] = [];
    let counter = stepCounter;

    if (titleColonMatch) {
      steps.push(this.createStep(titleColonMatch[1], false, true));
      
      if (titleColonMatch[2].trim()) {
        counter++;
        steps.push(this.createStep(titleColonMatch[2].trim(), true, false, counter));
      }
    } else {
      const isFullTitle = /^[A-Z\s]+$/.test(step);
      if (isFullTitle) {
        steps.push(this.createStep(step, false, true));
      } else {
        counter++;
        steps.push(this.createStep(step, true, false, counter));
      }
    }

    return { steps, newCounter: counter };
  }

  formatInstructions(instructions: string): InstructionStep[] {
    if (this.isSingleParagraph(instructions)) {
      return [this.createStep(instructions, false, false)];
    }

    const cleanText = this.cleanInstructionsText(instructions);
    const steps = cleanText
      .split(/\n+/)
      .map(step => step.trim())
      .filter(step => step.length > 0);

    let formattedSteps: InstructionStep[] = [];
    let stepCounter = 0;

    steps.forEach(step => {
      const { steps: processedSteps, newCounter } = this.processStepWithTitle(step, stepCounter);
      formattedSteps = [...formattedSteps, ...processedSteps];
      stepCounter = newCounter;
    });

    return formattedSteps;
  }

  isFavorite() {
    return this.recipeService.isFavorite(this.recipeService.currentRecipe()?.id || '');
  }

  toggleFavorite() {
    const currentRecipe = this.recipeService.currentRecipe();
    if (currentRecipe) {
      this.recipeService.toggleFavorite(currentRecipe);
    }
  }
}
