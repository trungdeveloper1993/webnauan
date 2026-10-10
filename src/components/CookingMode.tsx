import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Sun, X } from 'lucide-react';
import { Recipe } from '../types';
import { useJourney } from '../JourneyContext';
import { href } from '../lib/router';
import { cn, pad2 } from '../lib/utils';
import { Markdown } from './Markdown';
import { IngredientsPanel } from './IngredientsPanel';

// Giữ màn hình luôn sáng khi đang nấu (trình duyệt không hỗ trợ thì bỏ qua)
const useWakeLock = () => {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let lock: any = null;
    let cancelled = false;
    const request = async () => {
      try {
        const wakeLock = (navigator as any).wakeLock;
        if (!wakeLock || document.visibilityState !== 'visible') return;
        lock = await wakeLock.request('screen');
        if (cancelled) {
          lock.release();
          return;
        }
        setActive(true);
        lock.addEventListener?.('release', () => setActive(false));
      } catch {
        setActive(false);
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release?.().catch?.(() => undefined);
    };
  }, []);
  return active;
};

interface CookingModeProps {
  recipe: Recipe;
  nextRecipe?: Recipe;
  onClose: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, nextRecipe, onClose }) => {
  const { isCooked, markCooked, notes, setNote } = useJourney();
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const awake = useWakeLock();
  const cooked = isCooked(recipe.id);

  const titles = ['Nguyên liệu', ...recipe.sections.map((s) => s.title), 'Hoàn thành'];
  const total = titles.length;
  const isLast = step === total - 1;

  const go = (to: number) => setStep(Math.max(0, Math.min(total - 1, to)));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') setStep((s) => Math.min(total - 1, s + 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.setProperty('--timer-offset', '88px');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.removeProperty('--timer-offset');
    };
  }, [total]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[55] bg-cream flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Chế độ nấu: ${recipe.name}`}
    >
      {/* Thanh trên */}
      <div className="shrink-0 bg-white/85 backdrop-blur border-b border-orange-950/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center shrink-0"
            aria-label="Thoát chế độ nấu"
          >
            <X size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-black uppercase tracking-widest text-orange-600">
              Đang nấu · Ngày {pad2(recipe.day)}
            </div>
            <div className="font-bold truncate text-neutral-900">{recipe.name}</div>
          </div>
          {awake && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
              <Sun size={12} /> Màn hình luôn sáng
            </span>
          )}
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-1">
          {titles.map((t, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-orange-500' : 'bg-neutral-200')}
              aria-label={`Đến bước: ${t}`}
              title={t}
            />
          ))}
        </div>
      </div>

      {/* Nội dung: giữ tất cả các bước trong DOM để không mất phần đã đánh dấu khi chuyển bước */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
          <div className={step === 0 ? 'block animate-step-in' : 'hidden'}>
            <StepLabel>Chuẩn bị</StepLabel>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Kiểm tra nguyên liệu</h2>
            <p className="text-neutral-500 mb-6">Chạm vào từng nguyên liệu khi bạn đã có đủ.</p>
            <IngredientsPanel recipe={recipe} large showShopping={false} />
          </div>

          {recipe.sections.map((section, i) => (
            <div key={i} className={step === i + 1 ? 'block animate-step-in' : 'hidden'}>
              <StepLabel>
                Bước {i + 1}/{recipe.sections.length}
              </StepLabel>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">{section.title}</h2>
              <Markdown content={section.content} large interactive timerLabel={section.title} />
            </div>
          ))}

          <div className={isLast ? 'block animate-step-in text-center' : 'hidden'}>
            <motion.div
              key={cooked ? 'done' : 'almost'}
              initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 160 }}
              className="text-7xl md:text-8xl pt-4"
              aria-hidden
            >
              {cooked ? '🎉' : '🍽️'}
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-5">
              {cooked ? `Hoàn thành Ngày ${recipe.day}!` : 'Sắp xong rồi!'}
            </h2>
            <p className="text-neutral-500 mt-2 text-lg">
              {cooked
                ? 'Tiến độ hành trình đã được cập nhật. Chúc ngon miệng!'
                : 'Bày món ra đĩa, thưởng thức, rồi đánh dấu đã nấu nhé.'}
            </p>
            <div className="text-left mt-8">
              <label htmlFor="cook-note" className="text-xs font-black uppercase tracking-widest text-neutral-400">
                Ghi chú cho lần sau
              </label>
              <textarea
                id="cook-note"
                value={notes[recipe.id] ?? ''}
                onChange={(e) => setNote(recipe.id, e.target.value)}
                rows={3}
                placeholder="Ví dụ: luộc khoai 15 phút là vừa, sốt bớt đường một chút..."
                className="mt-2 w-full p-4 bg-white border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 text-lg"
              />
            </div>
            {cooked && nextRecipe && (
              <a
                href={href.recipe(nextRecipe.day)}
                className="mt-6 flex items-center justify-between gap-3 text-left bg-white border border-orange-200 hover:border-orange-400 rounded-2xl p-4 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-black uppercase tracking-widest text-orange-600">
                    Tiếp theo · Ngày {pad2(nextRecipe.day)}
                  </span>
                  <span className="block font-bold truncate">{nextRecipe.name}</span>
                </span>
                <ArrowRight size={20} className="text-orange-600 shrink-0" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Thanh điều hướng dưới */}
      <div className="shrink-0 bg-white/90 backdrop-blur border-t border-orange-950/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-3">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="h-14 px-4 sm:px-6 rounded-2xl bg-neutral-100 hover:bg-neutral-200 font-bold flex items-center gap-1 disabled:opacity-40 shrink-0"
          >
            <ChevronLeft size={20} /> <span className="hidden sm:inline">Trước</span>
          </button>
          {!isLast ? (
            <button
              onClick={() => go(step + 1)}
              className="flex-1 min-w-0 h-14 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 active:scale-[0.98] transition-all"
            >
              <span className="min-w-0 text-left leading-tight">
                <span className="block text-[11px] uppercase tracking-widest text-white/75">
                  {step === 0 ? 'Bắt đầu' : step === total - 2 ? 'Hoàn tất' : 'Tiếp theo'}
                </span>
                <span className="block truncate">{titles[step + 1]}</span>
              </span>
              <ChevronRight size={22} className="shrink-0" />
            </button>
          ) : cooked ? (
            <button
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold text-lg flex items-center justify-center gap-2"
            >
              Đóng chế độ nấu
            </button>
          ) : (
            <button
              onClick={() => markCooked(recipe.id)}
              className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all"
            >
              <Check size={22} strokeWidth={3} /> Đánh dấu đã nấu
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StepLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm font-black uppercase tracking-widest text-orange-600 mb-2">{children}</div>
);
