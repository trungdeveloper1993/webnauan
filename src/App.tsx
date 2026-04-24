import React, { useState } from 'react';
import { RecipeProvider, useRecipes } from './RecipeContext';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeForm } from './components/RecipeForm';
import { ShoppingList } from './components/ShoppingList';
import { Recipe } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Utensils, ShoppingBasket, ChefHat } from 'lucide-react';
import { removeAccents } from './lib/utils';

function AppContent() {
  const { recipes, shoppingList } = useRecipes();
  const [activeTab, setActiveTab] = useState<'recipes' | 'shopping'>('recipes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  const categories = ['Tất cả', 'Món nước', 'Món nướng', 'Món cơm', 'Món khai vị', 'Món lẩu', 'Món canh', 'Món khác'];

  const filteredRecipes = recipes.filter(r => {
    const normalizedQuery = removeAccents(searchQuery);
    const normalizedName = removeAccents(r.name);
    const normalizedCategory = removeAccents(r.category || '');
    const normalizedIngredients = (r.ingredients || []).map(i => removeAccents(i.name)).join(' ');

    const matchesSearch = normalizedName.includes(normalizedQuery) ||
      normalizedCategory.includes(normalizedQuery) ||
      normalizedIngredients.includes(normalizedQuery);

    const matchesCategory = selectedCategory === 'Tất cả' || r.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
              <ChefHat size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase hidden sm:block">
              Tôi Thích <span className="text-orange-600">Nấu Ăn</span>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-neutral-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'recipes' 
                  ? 'bg-white text-neutral-900 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Utensils size={18} />
              <span className="hidden md:inline">Công thức</span>
            </button>
            <button 
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                activeTab === 'shopping' 
                  ? 'bg-white text-neutral-900 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <ShoppingBasket size={18} />
              <span className="hidden md:inline">Thực đơn</span>
              {shoppingList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </nav>

          <button 
            onClick={() => {
              setRecipeToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Thêm món</span>
          </button>
        </div>
      </header>

      {/* Hero Section (Only on Recipes page) */}
      <AnimatePresence mode="wait">
        {activeTab === 'recipes' && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border-b border-neutral-100 py-12 px-4"
          >
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
                Hôm nay bạn muốn <br />
                <span className="text-orange-600 italic">nấu món gì?</span>
              </h2>
              <p className="text-neutral-500 max-w-xl mx-auto text-lg">
                Khám phá kho tàng ẩm thực Việt Nam, tự động lên danh sách đi chợ và chuẩn bị bữa ăn hoàn hảo cho gia đình.
              </p>
              
              <div className="relative max-w-2xl mx-auto pt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input 
                  type="text"
                  placeholder="Tìm kiếm món ăn, nguyên liệu, phân loại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-5 pl-12 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-neutral-800 shadow-sm"
                />
              </div>

              {/* Category Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar justify-center flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'recipes' ? (
            <motion.div
              key="recipes-grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onClick={setSelectedRecipe}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-neutral-400">
                  <p className="text-xl">Không tìm thấy món ăn nào phù hợp.</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-orange-600 font-bold hover:underline"
                  >
                    Xem tất cả món ăn
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="shopping-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ShoppingList onViewRecipe={setSelectedRecipe} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      <RecipeDetail 
        recipe={selectedRecipe} 
        onClose={() => setSelectedRecipe(null)}
        onEdit={(r) => {
          setRecipeToEdit(r);
          setSelectedRecipe(null);
          setIsFormOpen(true);
        }}
      />

      {/* Form Modal */}
      {isFormOpen && (
        <RecipeForm 
          recipe={recipeToEdit}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white">
              <ChefHat size={18} />
            </div>
            <span className="font-black tracking-tight uppercase">Tôi Thích Nấu Ăn</span>
          </div>
          <p className="text-neutral-400 text-sm">
            &copy; 2026 Tôi Thích Nấu Ăn - Nấu ăn là niềm hạnh phúc.
          </p>
          <div className="flex gap-6 text-sm font-bold text-neutral-600">
            <a href="#" className="hover:text-orange-600 transition-colors">Facebook</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Instagram</a>
            <a href="#" className="hover:text-orange-600 transition-colors">TikTok</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RecipeProvider>
      <AppContent />
    </RecipeProvider>
  );
}
