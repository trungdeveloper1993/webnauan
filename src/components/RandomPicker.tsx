import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Dices, X } from 'lucide-react';
import { Recipe } from '../types';
import { useRecipes } from '../RecipeContext';
import { href, navigate } from '../lib/router';
import { DIFFICULTY_LABELS, MEAL_TIMES } from '../lib/recipe';
import { cn, pad2 } from '../lib/utils';
import { DifficultyMeter, Modal, RecipeCover, Tag } from './ui';

// "Hôm nay ăn gì?" — quay ngẫu nhiên một món, có thể lọc theo bữa
export const RandomPicker: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { recipes } = useRecipes();
  const [meal, setMeal] = useState('Tất cả');
  const [current, setCurrent] = useState<Recipe | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timers = useRef<number[]>([]);

  const pool = meal === 'Tất cả' ? recipes : recipes.filter((r) => r.mealTime === meal);

  const spin = (candidates: Recipe[]) => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    if (!candidates.length) {
      setCurrent(null);
      setSpinning(false);
      return;
    }
    setSpinning(true);
    const final = candidates[Math.floor(Math.random() * candidates.length)];
    let elapsed = 0;
    const ticks = candidates.length > 1 ? 14 : 6;
    for (let i = 0; i < ticks; i++) {
      elapsed += 50 + i * i * 2.2;
      const isLast = i === ticks - 1;
      timers.current.push(
        window.setTimeout(() => {
          setCurrent(isLast ? final : candidates[Math.floor(Math.random() * candidates.length)]);
          if (isLast) setSpinning(false);
        }, elapsed)
      );
    }
  };

  useEffect(() => {
    spin(pool);
    return () => timers.current.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meal]);

  return (
    <Modal onClose={onClose} label="Hôm nay ăn gì?" className="sm:max-w-lg">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-orange-600">Chọn giúp tôi</div>
          <h2 className="text-2xl font-black tracking-tight">Hôm nay ăn gì?</h2>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-neutral-100 flex items-center justify-center" aria-label="Đóng">
          <X size={20} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pt-4 pb-1">
        {['Tất cả', ...MEAL_TIMES].map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            className={cn(
              'h-8 px-3.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all',
              meal === m ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="p-6 overflow-y-auto">
        {current ? (
          <div>
            <motion.div
              key={`${current.id}-${spinning}`}
              initial={{ scale: spinning ? 0.96 : 0.9, rotate: spinning ? -2 : 0 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={spinning ? { duration: 0.08 } : { type: 'spring', damping: 9, stiffness: 200 }}
            >
              <RecipeCover recipe={current} size="lg" showDay className="aspect-[16/10] rounded-3xl" />
            </motion.div>
            <div className={cn('transition-opacity duration-200', spinning ? 'opacity-40' : 'opacity-100')}>
              <h3 className="text-xl font-black mt-5 leading-snug">{current.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Tag tone="dark">Ngày {pad2(current.day)}</Tag>
                {current.mealTime && <Tag tone="orange">{current.mealTime}</Tag>}
                {current.category && <Tag>{current.category}</Tag>}
                <Tag>
                  <DifficultyMeter level={current.difficulty} /> {DIFFICULTY_LABELS[current.difficulty]}
                </Tag>
                {current.time && (
                  <Tag>
                    <Clock size={12} /> {current.time}
                  </Tag>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-neutral-500">
            <div className="text-5xl mb-3">🤔</div>
            <p className="font-bold text-neutral-700">Chưa có món nào cho {meal.toLowerCase()}.</p>
            <p className="text-sm mt-1">Thử chọn bữa khác nhé.</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={() => spin(pool)}
          disabled={!pool.length || spinning}
          className="h-12 px-5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 font-bold flex items-center gap-2 disabled:opacity-50"
        >
          <Dices size={18} className={spinning ? 'animate-spin' : ''} /> Quay lại
        </button>
        <button
          onClick={() => {
            if (!current) return;
            onClose();
            navigate(href.recipe(current.day));
          }}
          disabled={!current || spinning}
          className="flex-1 h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Xem công thức <ArrowRight size={18} />
        </button>
      </div>
    </Modal>
  );
};
