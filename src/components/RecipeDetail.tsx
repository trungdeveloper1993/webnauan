import React, { useState } from 'react';
import { Recipe } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, ListChecks, Utensils, Info, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useRecipes } from '../RecipeContext';

interface RecipeDetailProps {
  recipe: Recipe | null;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onClose, onEdit }) => {
  const { addToShopping, deleteRecipe } = useRecipes();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!recipe) return null;

  const handleAddToShopping = () => {
    addToShopping(recipe);
    onClose();
  };

  const handleDelete = () => {
    deleteRecipe(recipe.id);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X size={20} />
          </button>

          {/* Confirmation Dialog Overlay */}
          <AnimatePresence>
            {showConfirmDelete && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
                >
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-black mb-2">Bạn có chắc chắn?</h3>
                  <p className="text-neutral-500 mb-8 leading-relaxed">
                    Món <span className="font-bold text-neutral-900">{recipe.name}</span> sẽ bị xóa vĩnh viễn khỏi bộ sưu tập của bạn.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowConfirmDelete(false)}
                      className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl font-bold transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                    >
                      Xóa ngay
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image & Header */}
          <div className="w-full md:w-1/2 h-64 md:h-auto relative">
            <img 
              src={recipe.thumbnail} 
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
              <span className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-2">
                {recipe.category || 'Công thức'}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                {recipe.name}
              </h2>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={handleAddToShopping}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                  <ShoppingCart size={18} />
                  <span>Đi chợ ngay</span>
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit(recipe)}
                    className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all backdrop-blur-md border border-white/20"
                    title="Sửa món ăn"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setShowConfirmDelete(true)}
                    className="p-3 bg-white/20 hover:bg-red-500/50 text-white rounded-xl font-bold transition-all backdrop-blur-md border border-white/20"
                    title="Xóa món ăn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto bg-neutral-50">
            <div className="space-y-8">
              {/* Description */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-neutral-400">
                  <Info size={18} />
                  <h3 className="text-xs font-bold uppercase tracking-tighter">Giới thiệu</h3>
                </div>
                <p className="text-neutral-600 leading-relaxed italic">
                  "{recipe.description}"
                </p>
              </section>

              {/* Ingredients */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-neutral-900">
                  <ShoppingCart size={18} className="text-orange-600" />
                  <h3 className="text-lg font-bold">Nguyên liệu cần chuẩn bị</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {recipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-neutral-100 shadow-sm">
                      <span className="font-medium text-neutral-800">{ing.name}</span>
                      <span className="text-neutral-500 text-sm bg-neutral-100 px-2 py-1 rounded-md">
                        {ing.amount} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Steps */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-neutral-900">
                  <ListChecks size={18} className="text-orange-600" />
                  <h3 className="text-lg font-bold">Các bước thực hiện</h3>
                </div>
                <div className="space-y-4">
                  {recipe.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-neutral-600 leading-relaxed pt-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Method Overlay/Footer */}
              <section className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                 <div className="flex items-center gap-2 mb-2 text-orange-800">
                  <Utensils size={18} />
                  <h4 className="text-sm font-bold uppercase tracking-wide">Bí quyết món ăn</h4>
                </div>
                <p className="text-orange-900/80 text-sm leading-relaxed">
                  {recipe.method}
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
