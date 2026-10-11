import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Recipe, RecipeKind, ShoppingItem, RecipeData } from './types';
import { makeId, readStorage, writeStorage } from './lib/utils';
import { normalizeRecipe, normalizeSauce, slugify, sortByDay, sortByName } from './lib/recipe';

interface RecipeContextType {
  recipes: Recipe[];
  sauces: Recipe[];
  shoppingList: ShoppingItem[];
  updatedAt: number;
  isLoading: boolean;
  hasLocalChanges: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Recipe;
  updateRecipe: (id: string, recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  addSauce: (sauce: Omit<Recipe, 'id'>) => Recipe;
  updateSauce: (id: string, sauce: Recipe) => void;
  deleteSauce: (id: string) => void;
  addToShopping: (recipe: Recipe, kind?: RecipeKind) => void;
  removeFromShopping: (shoppingId: string) => void;
  removeAllFromShopping: () => void;
  toggleIngredient: (shoppingId: string, index: number) => void;
  exportRecipes: () => void;
  reloadFromSource: () => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Đổi key khi đổi cấu trúc dữ liệu để bỏ qua dữ liệu kiểu cũ còn trong trình duyệt
const STORAGE_KEY = 'nauan.recipes.v2';
const SHOPPING_KEY = 'nauan.shopping.v2';
const SOURCE_URL = `${import.meta.env.BASE_URL}recipes.json`;

const toData = (raw: any): RecipeData | null => {
  if (!raw || !Array.isArray(raw.recipes)) return null;
  return {
    version: 2,
    updatedAt: Number(raw.updatedAt) || 0,
    recipes: raw.recipes.map(normalizeRecipe),
    sauces: Array.isArray(raw.sauces) ? raw.sauces.map(normalizeSauce) : [],
  };
};

const fetchSource = async (): Promise<RecipeData | null> => {
  try {
    const res = await fetch(SOURCE_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    return toData(await res.json());
  } catch {
    return null;
  }
};

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawRecipes, setRecipes] = useState<Recipe[]>([]);
  const [rawSauces, setSauces] = useState<Recipe[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => readStorage(SHOPPING_KEY, []));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = toData(readStorage(STORAGE_KEY, null));
      const remote = await fetchSource();
      if (cancelled) return;

      if (remote && (!local || remote.updatedAt > local.updatedAt)) {
        setRecipes(remote.recipes);
        setSauces(remote.sauces ?? []);
        setUpdatedAt(remote.updatedAt);
        setRemoteUpdatedAt(remote.updatedAt);
      } else if (local) {
        setRecipes(local.recipes);
        setSauces(local.sauces ?? []);
        setUpdatedAt(local.updatedAt);
        setRemoteUpdatedAt(remote?.updatedAt ?? local.updatedAt);
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
    writeStorage(STORAGE_KEY, { version: 2, updatedAt, recipes: rawRecipes, sauces: rawSauces });
  }, [rawRecipes, rawSauces, updatedAt, isHydrated]);

  useEffect(() => {
    writeStorage(SHOPPING_KEY, shoppingList);
  }, [shoppingList]);

  const recipes = useMemo(() => sortByDay(rawRecipes), [rawRecipes]);
  const sauces = useMemo(() => sortByName(rawSauces), [rawSauces]);

  const bump = () => setUpdatedAt(Date.now());

  const addRecipe = (newRecipe: Omit<Recipe, 'id'>) => {
    const recipe = normalizeRecipe({ ...newRecipe, id: makeId() });
    setRecipes((prev) => [...prev, recipe]);
    bump();
    return recipe;
  };

  const updateRecipe = (id: string, updated: Recipe) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? normalizeRecipe(updated) : r)));
    bump();
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    bump();
  };

  // Gia vị dùng đường dẫn dễ đọc (#/gia-vi/muoi-ot-xanh), trùng tên thì thêm số
  const addSauce = (newSauce: Omit<Recipe, 'id'>) => {
    const base = slugify(newSauce.name);
    const taken = new Set(rawSauces.map((s) => s.id));
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    const sauce = normalizeSauce({ ...newSauce, id });
    setSauces((prev) => [...prev, sauce]);
    bump();
    return sauce;
  };

  const updateSauce = (id: string, updated: Recipe) => {
    setSauces((prev) => prev.map((s) => (s.id === id ? normalizeSauce(updated) : s)));
    bump();
  };

  const deleteSauce = (id: string) => {
    setSauces((prev) => prev.filter((s) => s.id !== id));
    bump();
  };

  const addToShopping = (recipe: Recipe, kind: RecipeKind = 'recipe') => {
    const item: ShoppingItem = {
      shoppingId: makeId(),
      kind,
      recipeId: recipe.id,
      day: recipe.day,
      name: recipe.name,
      emoji: recipe.emoji,
      thumbnail: recipe.thumbnail,
      addedAt: Date.now(),
      ingredients: recipe.ingredients.map((ing) => ({ ...ing, checked: false })),
    };
    // Mỗi món chỉ giữ một danh sách: thêm lại thì thay bằng danh sách mới
    setShoppingList((prev) => [item, ...prev.filter((i) => i.recipeId !== recipe.id)]);
  };

  const removeFromShopping = (shoppingId: string) => {
    setShoppingList((prev) => prev.filter((item) => item.shoppingId !== shoppingId));
  };

  const removeAllFromShopping = () => setShoppingList([]);

  const toggleIngredient = (shoppingId: string, index: number) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.shoppingId === shoppingId
          ? {
              ...item,
              ingredients: item.ingredients.map((ing, i) => (i === index ? { ...ing, checked: !ing.checked } : ing)),
            }
          : item
      )
    );
  };

  const exportRecipes = () => {
    const data: RecipeData = { version: 2, updatedAt, recipes, sauces };
    const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
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
      setSauces(remote.sauces ?? []);
      setUpdatedAt(remote.updatedAt);
      setRemoteUpdatedAt(remote.updatedAt);
    }
    setIsLoading(false);
  };

  const hasLocalChanges = updatedAt > remoteUpdatedAt;

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        sauces,
        shoppingList,
        updatedAt,
        isLoading,
        hasLocalChanges,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addSauce,
        updateSauce,
        deleteSauce,
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
