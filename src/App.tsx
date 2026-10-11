import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RecipeProvider, useRecipes } from './RecipeContext';
import { JourneyProvider } from './JourneyContext';
import { TimerProvider } from './TimerContext';
import { Recipe, RecipeKind } from './types';
import { pageKey, useRoute } from './lib/router';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { RecipePage, SaucePage } from './components/RecipePage';
import { SaucesPage } from './components/SaucesPage';
import { ShoppingList } from './components/ShoppingList';
import { RecipeForm } from './components/RecipeForm';
import { RandomPicker } from './components/RandomPicker';
import { Footer } from './components/Footer';

const SITE_TITLE = 'Tôi Thích Nấu Ăn';

function AppContent() {
  const route = useRoute();
  const { recipes, sauces } = useRecipes();
  // undefined = đóng form; recipe null = thêm mới
  const [form, setForm] = useState<{ recipe: Recipe | null; kind: RecipeKind } | undefined>(undefined);
  const openForm = (kind: RecipeKind, recipe: Recipe | null = null) => setForm({ recipe, kind });
  const [randomOpen, setRandomOpen] = useState(false);

  useEffect(() => {
    if (route.name === 'recipe') {
      const recipe = recipes.find((r) => r.day === route.day);
      document.title = recipe ? `Ngày ${recipe.day}: ${recipe.name} — ${SITE_TITLE}` : `Ngày ${route.day} — ${SITE_TITLE}`;
    } else if (route.name === 'sauce') {
      const sauce = sauces.find((s) => s.id === route.id);
      document.title = `${sauce ? sauce.name : 'Gia vị'} — ${SITE_TITLE}`;
    } else if (route.name === 'sauces') {
      document.title = `Gia vị & nước chấm — ${SITE_TITLE}`;
    } else if (route.name === 'shopping') {
      document.title = `Đi chợ — ${SITE_TITLE}`;
    } else {
      document.title = `${SITE_TITLE} — Hành trình 100 ngày vào bếp`;
    }
  }, [route, recipes, sauces]);

  return (
    // overflow-x-clip: chặn trường hợp nội dung lỡ tràn ngang làm điện thoại tự thu nhỏ trang
    <div className="min-h-screen overflow-x-clip bg-cream text-neutral-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      <Header route={route} onRandom={() => setRandomOpen(true)} onAdd={() => openForm('recipe')} />

      <motion.div
        key={pageKey(route)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {route.name === 'home' && <HomePage onRandom={() => setRandomOpen(true)} />}
        {route.name === 'recipe' && <RecipePage day={route.day} cooking={route.cook} onEdit={(r) => openForm('recipe', r)} />}
        {route.name === 'sauces' && <SaucesPage onAdd={() => openForm('sauce')} />}
        {route.name === 'sauce' && <SaucePage id={route.id} cooking={route.cook} onEdit={(s) => openForm('sauce', s)} />}
        {route.name === 'shopping' && <ShoppingList />}
      </motion.div>

      <Footer onAdd={() => openForm('recipe')} onAddSauce={() => openForm('sauce')} />

      <AnimatePresence>
        {form && <RecipeForm key="form" recipe={form.recipe} kind={form.kind} onClose={() => setForm(undefined)} />}
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
