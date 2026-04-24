import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe, ShoppingItem, Ingredient } from './types';
import { MOCK_RECIPES } from './constants';

interface RecipeContextType {
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (id: string, recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  addToShopping: (recipe: Recipe) => void;
  removeFromShopping: (shoppingId: string) => void;
  removeAllFromShopping: () => void;
  toggleIngredient: (shoppingId: string, ingredientName: string) => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('recipes');
    return saved ? JSON.parse(saved) : MOCK_RECIPES;
  });

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('shoppingList');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  const addRecipe = (newRecipe: Omit<Recipe, 'id'>) => {
    const recipe: Recipe = {
      ...newRecipe,
      id: Math.random().toString(36).substr(2, 9)
    };
    setRecipes(prev => [...prev, recipe]);
  };

  const updateRecipe = (id: string, updated: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === id ? updated : r));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const addToShopping = (recipe: Recipe) => {
    const item: ShoppingItem = {
      ...recipe,
      shoppingId: Math.random().toString(36).substr(2, 9),
      addedAt: Date.now(),
      ingredients: recipe.ingredients.map(ing => ({ ...ing, checked: false }))
    };
    setShoppingList(prev => [...prev, item]);
  };

  const removeFromShopping = (shoppingId: string) => {
    setShoppingList(prev => prev.filter(item => item.shoppingId !== shoppingId));
  };

  const removeAllFromShopping = () => {
    setShoppingList([]);
  };

  const toggleIngredient = (shoppingId: string, ingredientName: string) => {
    setShoppingList(prev => prev.map(item => {
      if (item.shoppingId === shoppingId) {
        return {
          ...item,
          ingredients: item.ingredients.map(ing =>
            ing.name === ingredientName ? { ...ing, checked: !ing.checked } : ing
          )
        };
      }
      return item;
    }));
  };

  return (
    <RecipeContext.Provider value={{
      recipes,
      shoppingList,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      addToShopping,
      removeFromShopping,
      removeAllFromShopping,
      toggleIngredient
    }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used within a RecipeProvider');
  return context;
};
