import React, { useState } from 'react';
import { Check, Minus, Plus, ShoppingBasket } from 'lucide-react';
import { Recipe, RecipeKind } from '../types';
import { useRecipes } from '../RecipeContext';
import { href } from '../lib/router';
import { formatIngredientAmount, parseServings, scaleAmount } from '../lib/recipe';
import { cn } from '../lib/utils';

interface IngredientsPanelProps {
  recipe: Recipe;
  large?: boolean;
  showShopping?: boolean;
  kind?: RecipeKind;
}

export const IngredientsPanel: React.FC<IngredientsPanelProps> = ({ recipe, large = false, showShopping = true, kind = 'recipe' }) => {
  const { addToShopping } = useRecipes();
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const base = parseServings(recipe.servings);
  const [people, setPeople] = useState(base ?? 1);
  const [added, setAdded] = useState(false);
  const factor = base ? people / base : 1;
  const servingUnit = recipe.servings?.replace(/^[\d\s–-]+/, '').trim() || 'người';

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const handleShopping = () => {
    addToShopping(
      { ...recipe, ingredients: recipe.ingredients.map((ing) => ({ ...ing, amount: scaleAmount(ing.amount, factor) })) },
      kind
    );
    setAdded(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className={cn('font-black text-neutral-900', large ? 'text-2xl' : 'text-lg')}>Nguyên liệu</h3>
          <p className="text-xs font-semibold text-neutral-400 mt-0.5">
            Đã chuẩn bị {checked.size}/{recipe.ingredients.length}
          </p>
        </div>
        {base && (
          <div className="flex items-center bg-neutral-100 rounded-full p-1" aria-label="Khẩu phần">
            <button
              onClick={() => setPeople((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center disabled:opacity-30"
              disabled={people <= 1}
              aria-label="Bớt một khẩu phần"
            >
              <Minus size={14} />
            </button>
            <span className="px-2 text-sm font-bold tabular-nums whitespace-nowrap">
              {people} {servingUnit}
            </span>
            <button
              onClick={() => setPeople((p) => Math.min(20, p + 1))}
              className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center"
              aria-label="Thêm một khẩu phần"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {factor !== 1 && (
        <p className="text-xs text-orange-700 bg-orange-50 rounded-xl px-3 py-2 mb-3">
          Đã nhân lượng cho {people} {servingUnit}. Lượng ghi trong các bước vẫn tính cho {base} {servingUnit}.
        </p>
      )}

      <ul className="space-y-1.5">
        {recipe.ingredients.map((ing, i) => {
          const isChecked = checked.has(i);
          const groupStart = ing.group && ing.group !== recipe.ingredients[i - 1]?.group;
          return (
            <li key={i}>
              {groupStart && (
                <div
                  className={cn(
                    'flex items-center gap-2 font-black uppercase tracking-widest text-orange-600 px-1 pb-1.5',
                    large ? 'text-sm' : 'text-[11px]',
                    i > 0 && 'pt-3'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {ing.group}
                </div>
              )}
              <button
                onClick={() => toggle(i)}
                className={cn(
                  'w-full flex items-start gap-3 text-left rounded-2xl px-3 transition-all border',
                  large ? 'py-3.5' : 'py-2.5',
                  isChecked ? 'bg-neutral-50 border-transparent' : 'bg-white border-neutral-100 hover:border-orange-200'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                    isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-300'
                  )}
                >
                  {isChecked && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'block font-semibold leading-snug',
                      large && 'text-lg',
                      isChecked ? 'text-neutral-400 line-through' : 'text-neutral-900'
                    )}
                  >
                    {ing.name}
                  </span>
                  {ing.note && (
                    <span className={cn('block text-neutral-400 leading-snug mt-0.5', large ? 'text-sm' : 'text-xs')}>
                      {ing.note}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'shrink-0 max-w-[45%] text-right font-bold rounded-lg px-2 py-1 leading-snug',
                    large ? 'text-base' : 'text-xs',
                    isChecked
                      ? 'text-neutral-400 bg-neutral-100'
                      : ing.amount
                        ? 'text-orange-700 bg-orange-50'
                        : 'text-neutral-500 bg-neutral-100 font-semibold'
                  )}
                >
                  {formatIngredientAmount(ing, factor) || 'vừa đủ'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {showShopping && recipe.ingredients.length > 0 && (
        <div className="mt-4">
          {added ? (
            <a
              href={href.shopping}
              className="w-full h-11 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100"
            >
              <Check size={16} strokeWidth={3} /> Đã thêm · Xem danh sách đi chợ
            </a>
          ) : (
            <button
              onClick={handleShopping}
              className="w-full h-11 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ShoppingBasket size={16} /> Thêm vào danh sách đi chợ
            </button>
          )}
        </div>
      )}
    </div>
  );
};
