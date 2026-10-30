import { ParsedIngredient } from './ingredient';

export interface TimerInfo {
  id?: string;
  label: string;
  durationSeconds: number;
}

export interface TemperatureInfo {
  value: number;
  unit: 'F' | 'C';
}

export interface Step {
  stepNumber: number;
  instruction: string;
  linkedIngredients?: string[]; // IDs of ingredients mentioned
  timers?: TimerInfo[];
  temperatures?: TemperatureInfo[];
}

export interface Servings {
  amount: number;
  unit: string;
}

export interface RecipeTimes {
  prepMinutes?: number;
  cookMinutes?: number;
  restingMinutes?: number;
}

export interface Recipe {
  id: string;
  schemaVersion: string;
  title: string;
  subtitle?: string;
  servings: Servings;
  times: RecipeTimes;
  tags: string[];
  ingredients: ParsedIngredient[];
  steps: Step[];
  notes?: string;
  sourceUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ActiveTimer {
  id: string;
  label: string;
  stepNumber?: number;
  timerKey?: string;
  recipeId?: string;
  recipeTitle?: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted?: boolean;
  targetEndTime?: number; // Wall-clock timestamp (ms) when timer reaches 0, preventing pauses on phone lock
}
