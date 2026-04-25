import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe, ShoppingItem, RecipeData } from './types';

interface RecipeContextType {
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  updatedAt: number;
  isLoading: boolean;
  hasLocalChanges: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (id: string, recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  addToShopping: (recipe: Recipe) => void;
  removeFromShopping: (shoppingId: string) => void;
  removeAllFromShopping: () => void;
  toggleIngredient: (shoppingId: string, ingredientName: string) => void;
  exportRecipes: () => void;
  reloadFromSource: () => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = 'recipeData';
const SOURCE_URL = `${import.meta.env.BASE_URL}recipes.json`;

const readLocal = (): RecipeData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecipeData) : null;
  } catch {
    return null;
  }
};

const writeLocal = (data: RecipeData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const fetchSource = async (): Promise<RecipeData | null> => {
  try {
    const res = await fetch(SOURCE_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as RecipeData;
  } catch {
    return null;
  }
};

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem('shoppingList');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      const remote = await fetchSource();

      if (cancelled) return;

      if (remote && (!local || remote.updatedAt > local.updatedAt)) {
        setRecipes(remote.recipes);
        setUpdatedAt(remote.updatedAt);
        setRemoteUpdatedAt(remote.updatedAt);
        writeLocal(remote);
      } else if (local) {
        setRecipes(local.recipes);
        setUpdatedAt(local.updatedAt);
        setRemoteUpdatedAt(remote?.updatedAt ?? local.updatedAt);
      } else {
        setRecipes([]);
        setUpdatedAt(0);
        setRemoteUpdatedAt(0);
      }

      setIsHydrated(true);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeLocal({ updatedAt, recipes });
  }, [recipes, updatedAt, isHydrated]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  const bump = () => setUpdatedAt(Date.now());

  const addRecipe = (newRecipe: Omit<Recipe, 'id'>) => {
    const recipe: Recipe = {
      ...newRecipe,
      id: Math.random().toString(36).substr(2, 9),
    };
    setRecipes((prev) => [...prev, recipe]);
    bump();
  };

  const updateRecipe = (id: string, updated: Recipe) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    bump();
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    bump();
  };

  const addToShopping = (recipe: Recipe) => {
    const item: ShoppingItem = {
      ...recipe,
      shoppingId: Math.random().toString(36).substr(2, 9),
      addedAt: Date.now(),
      ingredients: recipe.ingredients.map((ing) => ({ ...ing, checked: false })),
    };
    setShoppingList((prev) => [...prev, item]);
  };

  const removeFromShopping = (shoppingId: string) => {
    setShoppingList((prev) => prev.filter((item) => item.shoppingId !== shoppingId));
  };

  const removeAllFromShopping = () => {
    setShoppingList([]);
  };

  const toggleIngredient = (shoppingId: string, ingredientName: string) => {
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.shoppingId === shoppingId) {
          return {
            ...item,
            ingredients: item.ingredients.map((ing) =>
              ing.name === ingredientName ? { ...ing, checked: !ing.checked } : ing
            ),
          };
        }
        return item;
      })
    );
  };

  const exportRecipes = () => {
    const data: RecipeData = { updatedAt, recipes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reloadFromSource = async () => {
    setIsLoading(true);
    const remote = await fetchSource();
    if (remote) {
      setRecipes(remote.recipes);
      setUpdatedAt(remote.updatedAt);
      setRemoteUpdatedAt(remote.updatedAt);
      writeLocal(remote);
    }
    setIsLoading(false);
  };

  const hasLocalChanges = updatedAt > remoteUpdatedAt;

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        shoppingList,
        updatedAt,
        isLoading,
        hasLocalChanges,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addToShopping,
        removeFromShopping,
        removeAllFromShopping,
        toggleIngredient,
        exportRecipes,
        reloadFromSource,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used within a RecipeProvider');
  return context;
};
