export interface InstructionStep {
  text: string;
  showNumber: boolean;
  isTitle: boolean;
  stepNumber?: number;
}

export interface ProcessedInstructions {
  steps: InstructionStep[];
  totalSteps: number;
} 