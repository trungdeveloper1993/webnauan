import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Amphora, Plus, Search, X } from 'lucide-react';
import { useRecipes } from '../RecipeContext';
import { useJourney } from '../JourneyContext';
import { SAUCE_CATEGORIES } from '../lib/recipe';
import { cn, removeAccents } from '../lib/utils';
import { RecipeCard } from './RecipeCard';

// Góc gia vị: muối chấm, nước chấm, sốt... không thuộc lộ trình 100 ngày
export const SaucesPage: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  const { sauces, isLoading } = useRecipes();
  const { isAdmin } = useJourney();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  // Phân loại theo thứ tự gợi ý, loại tự đặt thêm thì xếp sau
  const categories = useMemo(() => {
    const used = new Set(sauces.map((s) => s.category).filter(Boolean) as string[]);
    return [...SAUCE_CATEGORIES.filter((c) => used.has(c)), ...[...used].filter((c) => !SAUCE_CATEGORIES.includes(c))];
  }, [sauces]);

  const q = removeAccents(query.trim());
  const filtered = sauces.filter((s) => {
    if (category && s.category !== category) return false;
    if (!q) return true;
    return removeAccents([s.name, s.description, s.category, s.pairing, ...s.ingredients.map((i) => i.name)].join(' ')).includes(q);
  });

  const chip = (active: boolean) =>
    cn(
      'h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all border',
      active
        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900'
    );

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute -top-56 -right-24 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-32 -left-40 w-80 h-80 bg-lime-200/40 rounded-full blur-3xl pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative max-w-6xl mx-auto px-4 pt-10 md:pt-14 pb-8"
        >
          <span className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            <Amphora size={14} /> Góc gia vị
          </span>
          <div className="flex flex-wrap items-end justify-between gap-4 mt-5">
            <div>
              <h1 className="text-[2.4rem] leading-[1.05] sm:text-5xl font-black tracking-tight text-neutral-900">
                Gia vị & <span className="font-serif italic text-emerald-700">nước chấm</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                Muối chấm, nước chấm, sốt và gia vị pha sẵn. Làm một lần, dùng cho nhiều món.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white h-11 px-5 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                <Plus size={17} /> Thêm gia vị
              </button>
            )}
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-6">
        <div className="space-y-3 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm: ớt xanh, chấm hải sản, gà luộc..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600 text-neutral-800 shadow-sm"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              <button onClick={() => setCategory('')} className={chip(!category)}>
                Tất cả
              </button>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={chip(category === c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading && !sauces.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-neutral-200/60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <RecipeCard key={s.id} recipe={s} kind="sauce" />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-neutral-500 bg-white rounded-3xl border border-dashed border-neutral-300">
            <p className="text-lg font-bold text-neutral-700">
              {sauces.length ? 'Không tìm thấy gia vị phù hợp.' : 'Chưa có công thức gia vị nào.'}
            </p>
            {(q || category) && (
              <button
                onClick={() => {
                  setQuery('');
                  setCategory('');
                }}
                className="mt-3 inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
              >
                <X size={14} /> Xóa bộ lọc
              </button>
            )}
            {!sauces.length && isAdmin && <p className="mt-1">Bấm "Thêm gia vị" để tạo công thức đầu tiên.</p>}
          </div>
        )}
      </section>
    </main>
  );
};
