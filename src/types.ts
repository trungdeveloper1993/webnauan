export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  checked?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  method: string;
  category?: string;
  mealTime?: string;
}

export interface ShoppingItem extends Recipe {
  shoppingId: string;
  addedAt: number;
}

export interface RecipeData {
  updatedAt: number;
  recipes: Recipe[];
}
