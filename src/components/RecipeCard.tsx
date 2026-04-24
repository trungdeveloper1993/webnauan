import React from 'react';
import { Recipe } from '../types';
import { motion } from 'motion/react';
import { Clock, ChefHat, Plus } from 'lucide-react';
import { useRecipes } from '../RecipeContext';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const { addToShopping } = useRecipes();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100"
    >
      <div 
        className="aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={() => onClick(recipe)}
      >
        <img 
          src={recipe.thumbnail} 
          alt={recipe.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
            {recipe.category || 'Phổ biến'}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToShopping(recipe);
            }}
            className="p-2 bg-neutral-900 text-white rounded-full hover:bg-orange-600 transition-colors shadow-lg"
            title="Thêm vào thực đơn hôm nay"
          >
            <Plus size={16} />
          </button>
        </div>

        <h3 
          className="text-lg font-bold text-neutral-900 mb-1 cursor-pointer hover:text-orange-600 transition-colors line-clamp-1"
          onClick={() => onClick(recipe)}
        >
          {recipe.name}
        </h3>
        
        <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
          {recipe.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-neutral-400 font-medium">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>30-45 phút</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat size={14} />
            <span>Trung bình</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
