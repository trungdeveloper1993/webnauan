import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RecipeProvider, useRecipes } from './RecipeContext';
import { JourneyProvider } from './JourneyContext';
import { TimerProvider } from './TimerContext';
import { Recipe } from './types';
import { pageKey, useRoute } from './lib/router';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { RecipePage } from './components/RecipePage';
import { ShoppingList } from './components/ShoppingList';
import { RecipeForm } from './components/RecipeForm';
import { RandomPicker } from './components/RandomPicker';
import { Footer } from './components/Footer';

const SITE_TITLE = 'Tôi Thích Nấu Ăn';

function AppContent() {
  const route = useRoute();
  const { recipes } = useRecipes();
  // undefined = đóng form, null = thêm món mới
  const [formRecipe, setFormRecipe] = useState<Recipe | null | undefined>(undefined);
  const [randomOpen, setRandomOpen] = useState(false);

  useEffect(() => {
    if (route.name === 'recipe') {
      const recipe = recipes.find((r) => r.day === route.day);
      document.title = recipe ? `Ngày ${recipe.day}: ${recipe.name} — ${SITE_TITLE}` : `Ngày ${route.day} — ${SITE_TITLE}`;
    } else if (route.name === 'shopping') {
      document.title = `Đi chợ — ${SITE_TITLE}`;
    } else {
      document.title = `${SITE_TITLE} — Hành trình 100 ngày vào bếp`;
    }
  }, [route, recipes]);

  return (
    // overflow-x-clip: chặn trường hợp nội dung lỡ tràn ngang làm điện thoại tự thu nhỏ trang
    <div className="min-h-screen overflow-x-clip bg-cream text-neutral-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      <Header route={route} onRandom={() => setRandomOpen(true)} onAdd={() => setFormRecipe(null)} />

      <motion.div
        key={pageKey(route)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {route.name === 'home' && <HomePage onRandom={() => setRandomOpen(true)} />}
        {route.name === 'recipe' && <RecipePage day={route.day} cooking={route.cook} onEdit={setFormRecipe} />}
        {route.name === 'shopping' && <ShoppingList />}
      </motion.div>

      <Footer onAdd={() => setFormRecipe(null)} />

      <AnimatePresence>
        {formRecipe !== undefined && (
          <RecipeForm key="form" recipe={formRecipe} onClose={() => setFormRecipe(undefined)} />
        )}
      </AnimatePresence>
      <AnimatePresence>{randomOpen && <RandomPicker key="random" onClose={() => setRandomOpen(false)} />}</AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <RecipeProvider>
      <JourneyProvider>
        <TimerProvider>
          <AppContent />
        </TimerProvider>
      </JourneyProvider>
    </RecipeProvider>
  );
}
