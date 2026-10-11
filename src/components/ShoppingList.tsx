import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Copy, ShoppingBasket, Trash2 } from 'lucide-react';
import { ShoppingItem } from '../types';
import { useRecipes } from '../RecipeContext';
import { href } from '../lib/router';
import { formatIngredientAmount } from '../lib/recipe';
import { cn, pad2 } from '../lib/utils';
import { RecipeCover } from './ui';
import { SectionTitle } from './HomePage';

const itemLabel = (item: ShoppingItem) => (item.kind === 'sauce' ? 'Gia vị' : `Ngày ${item.day}`);
const itemHref = (item: ShoppingItem) => (item.kind === 'sauce' ? href.sauce(item.recipeId) : href.recipe(item.day));
const itemCookHref = (item: ShoppingItem) => (item.kind === 'sauce' ? href.sauceCook(item.recipeId) : href.cook(item.day));

const toText = (list: ShoppingItem[]) =>
  [
    '🛒 Danh sách đi chợ',
    ...list.flatMap((item) => [
      '',
      `${itemLabel(item)} · ${item.name}`,
      ...item.ingredients.flatMap((ing, i) => {
        const amount = formatIngredientAmount(ing) || 'vừa đủ';
        const line = `${ing.checked ? '☑' : '☐'} ${ing.name} — ${amount}`;
        return ing.group && ing.group !== item.ingredients[i - 1]?.group ? [`  ${ing.group}:`, line] : [line];
      }),
    ]),
  ].join('\n');

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Trình duyệt cũ: dùng textarea tạm
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
};

export const ShoppingList: React.FC = () => {
  const { shoppingList, recipes, sauces, removeFromShopping, toggleIngredient, removeAllFromShopping } = useRecipes();
  const [copied, setCopied] = useState(false);

  const total = shoppingList.reduce((n, item) => n + item.ingredients.length, 0);
  const bought = shoppingList.reduce((n, item) => n + item.ingredients.filter((i) => i.checked).length, 0);

  if (shoppingList.length === 0) {
    const next = recipes[0];
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto rounded-[2rem] bg-orange-100 text-orange-600 flex items-center justify-center">
          <ShoppingBasket size={40} />
        </div>
        <h1 className="text-3xl font-black mt-6">Giỏ đi chợ đang trống</h1>
        <p className="text-neutral-500 mt-2">
          Mở một công thức và bấm "Thêm vào danh sách đi chợ", nguyên liệu sẽ xuất hiện ở đây để bạn tick khi mua.
        </p>
        {next && (
          <a
            href={href.home}
            className="mt-8 inline-flex items-center gap-2 bg-neutral-900 text-white h-12 px-6 rounded-2xl font-bold"
          >
            Chọn món để nấu <ArrowRight size={18} />
          </a>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-10">
      <SectionTitle
        eyebrow="Đi chợ"
        title="Danh sách đi chợ"
        subtitle={`${bought}/${total} nguyên liệu đã mua · ${shoppingList.length} món`}
        right={
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (await copyText(toText(shoppingList))) {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 font-bold text-sm"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              {copied ? 'Đã sao chép' : 'Sao chép danh sách'}
            </button>
            <button
              onClick={removeAllFromShopping}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm border border-red-100"
            >
              <Trash2 size={16} /> Xóa hết
            </button>
          </div>
        }
      />

      <div className="h-2 rounded-full bg-orange-100 overflow-hidden mb-8">
        <motion.div
          className="h-full bg-orange-500 rounded-full"
          animate={{ width: `${total ? (bought / total) * 100 : 0}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <AnimatePresence>
          {shoppingList.map((item) => {
            const done = item.ingredients.filter((i) => i.checked).length;
            const complete = done === item.ingredients.length && done > 0;
            return (
              <motion.div
                key={item.shoppingId}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-3xl overflow-hidden border border-neutral-200/70 shadow-sm"
              >
                <div className="flex items-center gap-4 p-4 border-b border-neutral-100">
                  <RecipeCover
                    recipe={{ ...item, difficulty: [...recipes, ...sauces].find((r) => r.id === item.recipeId)?.difficulty ?? 1 }}
                    palette={item.kind === 'sauce' ? 'sauce' : 'recipe'}
                    size="sm"
                    className="w-16 h-16 rounded-2xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[11px] font-black uppercase tracking-widest', item.kind === 'sauce' ? 'text-emerald-700' : 'text-orange-600')}>
                      {item.kind === 'sauce' ? 'Gia vị' : `Ngày ${pad2(item.day)}`}
                    </div>
                    <a href={itemHref(item)} className="font-bold leading-snug hover:text-orange-600 line-clamp-2">
                      {item.name}
                    </a>
                    <div className={cn('text-xs font-bold mt-1', complete ? 'text-emerald-600' : 'text-neutral-400')}>
                      {complete ? '✓ Đã mua đủ' : `Đã mua ${done}/${item.ingredients.length}`}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromShopping(item.shoppingId)}
                    className="w-10 h-10 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0"
                    aria-label={`Bỏ ${item.name} khỏi danh sách`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <ul className="p-3 space-y-1">
                  {item.ingredients.map((ing, idx) => (
                    <li key={idx}>
                      {ing.group && ing.group !== item.ingredients[idx - 1]?.group && (
                        <div className={cn('px-3 pb-1 text-[11px] font-black uppercase tracking-widest text-orange-600', idx > 0 && 'pt-3')}>
                          {ing.group}
                        </div>
                      )}
                      <button
                        onClick={() => toggleIngredient(item.shoppingId, idx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          ing.checked ? 'bg-neutral-50' : 'hover:bg-orange-50/60'
                        )}
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0',
                            ing.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-300'
                          )}
                        >
                          {ing.checked && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className={cn('flex-1 font-medium', ing.checked && 'line-through text-neutral-400')}>{ing.name}</span>
                        <span className={cn('text-sm font-semibold', ing.checked ? 'text-neutral-300' : 'text-neutral-500')}>
                          {formatIngredientAmount(ing) || 'vừa đủ'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {complete && (
                  <a
                    href={itemCookHref(item)}
                    className="m-3 mt-0 h-11 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2"
                  >
                    Đủ nguyên liệu rồi — bắt đầu nấu <ArrowRight size={16} />
                  </a>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </main>
  );
};
