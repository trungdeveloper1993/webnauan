import React, { useState } from 'react';
import { Check, Clock, ShoppingBasket } from 'lucide-react';
import { Recipe } from '../types';
import { useRecipes } from '../RecipeContext';
import { useJourney } from '../JourneyContext';
import { href } from '../lib/router';
import { DifficultyMeter, RecipeCover, Tag } from './ui';

export const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const { addToShopping } = useRecipes();
  const { isCooked } = useJourney();
  const [added, setAdded] = useState(false);
  const cooked = isCooked(recipe.id);

  return (
    <div className="group relative h-full">
      <a
        href={href.recipe(recipe.day)}
        className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-neutral-200/70 shadow-sm hover:shadow-xl hover:shadow-orange-900/5 hover:-translate-y-1 transition-all duration-300"
      >
        <RecipeCover recipe={recipe} size="md" showDay className="aspect-[4/3]" />
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500 mb-2">
            <DifficultyMeter level={recipe.difficulty} showLabel />
            {recipe.time && (
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {recipe.time}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg leading-snug text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-2">
            {recipe.name}
          </h3>
          {recipe.description && <p className="text-sm text-neutral-500 line-clamp-2 mt-1.5">{recipe.description}</p>}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-4 pr-10">
            {recipe.mealTime && <Tag tone="orange">{recipe.mealTime}</Tag>}
            {recipe.category && <Tag>{recipe.category}</Tag>}
          </div>
        </div>
      </a>

      {cooked && (
        <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full pl-2 pr-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-sm pointer-events-none">
          <Check size={13} strokeWidth={3} /> Đã nấu
        </div>
      )}
      <button
        onClick={() => {
          addToShopping(recipe);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1800);
        }}
        className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
          added ? 'bg-emerald-500 text-white' : 'bg-neutral-900 text-white hover:bg-orange-600'
        }`}
        title="Thêm nguyên liệu vào danh sách đi chợ"
        aria-label={`Thêm ${recipe.name} vào danh sách đi chợ`}
      >
        {added ? <Check size={18} strokeWidth={3} /> : <ShoppingBasket size={17} />}
      </button>
    </div>
  );
};
