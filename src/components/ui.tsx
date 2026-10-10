import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Recipe } from '../types';
import { cn, pad2, splitGraphemes } from '../lib/utils';
import { DIFFICULTY_LABELS } from '../lib/recipe';

// ---------- Độ khó: 5 cột tăng dần như vạch sóng ----------

export const DifficultyMeter: React.FC<{ level: number; showLabel?: boolean; className?: string }> = ({
  level,
  showLabel = false,
  className,
}) => (
  <span
    className={cn('inline-flex items-center gap-1.5', className)}
    title={`Độ khó ${level}/5 · ${DIFFICULTY_LABELS[level]}`}
    aria-label={`Độ khó ${level} trên 5`}
  >
    <span className="inline-flex items-end gap-[3px] h-3.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn('w-[4px] rounded-full', i <= level ? 'bg-orange-500' : 'bg-neutral-200')}
          style={{ height: `${36 + i * 16}%` }}
        />
      ))}
    </span>
    {showLabel && <span>{DIFFICULTY_LABELS[level]}</span>}
  </span>
);

// ---------- Ảnh bìa: dùng ảnh nếu có, không thì dùng emoji trên nền màu theo độ khó ----------

const GRADIENTS = [
  'from-amber-100 via-orange-100 to-rose-200',
  'from-lime-100 via-emerald-100 to-teal-200',
  'from-sky-100 via-cyan-100 to-indigo-200',
  'from-fuchsia-100 via-pink-100 to-rose-200',
  'from-orange-200 via-rose-200 to-red-300',
];

const EMOJI_SIZES = {
  sm: 'text-2xl',
  md: 'text-6xl',
  lg: 'text-6xl md:text-7xl',
  xl: 'text-7xl md:text-8xl',
};

type CoverRecipe = Pick<Recipe, 'emoji' | 'thumbnail' | 'difficulty' | 'name'> & { day?: number };

export const RecipeCover: React.FC<{
  recipe: CoverRecipe;
  size?: keyof typeof EMOJI_SIZES;
  className?: string;
  showDay?: boolean;
}> = ({ recipe, size = 'md', className, showDay = false }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [recipe.thumbnail]);

  const emojis = splitGraphemes(recipe.emoji || '🍳').slice(0, 4);
  const showImage = recipe.thumbnail && !failed;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-linear-to-br',
        GRADIENTS[Math.min(4, Math.max(0, recipe.difficulty - 1))],
        className
      )}
    >
      {showImage ? (
        <img
          src={recipe.thumbnail}
          alt={recipe.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          <div className="absolute -top-1/4 -right-1/4 w-3/4 aspect-square rounded-full bg-white/40 blur-2xl" />
          <div className="absolute -bottom-1/3 -left-1/4 w-2/3 aspect-square rounded-full bg-white/30 blur-2xl" />
          <div
            className={cn(
              'absolute inset-0 items-center justify-center content-center gap-x-[0.15em] p-[8%] leading-none select-none',
              EMOJI_SIZES[size],
              // 4 emoji xếp 2×2, ít hơn thì xếp một hàng
              emojis.length === 4 ? 'grid grid-cols-[auto_auto] place-content-center gap-y-[0.05em]' : 'flex'
            )}
            aria-hidden
          >
            {emojis.map((e, i) => (
              <span
                key={i}
                className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:scale-110"
                style={{ transform: `rotate(${[-8, 6, -4, 8][i]}deg)` }}
              >
                {e}
              </span>
            ))}
          </div>
        </>
      )}
      {showDay && recipe.day != null && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider text-neutral-900 shadow-sm">
          NGÀY {pad2(recipe.day)}
        </div>
      )}
    </div>
  );
};

// ---------- Hộp thoại ----------

export const Modal: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  label: string;
}> = ({ onClose, children, className, label }) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    // z-[80]: nằm trên hộp hẹn giờ (z-[70]) để không che nút của hộp thoại
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className={cn(
          'relative w-full bg-white shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden',
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};

// ---------- Nhãn nhỏ ----------

export const Tag: React.FC<{ children: React.ReactNode; tone?: 'orange' | 'neutral' | 'green' | 'dark'; className?: string }> = ({
  children,
  tone = 'neutral',
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
      tone === 'orange' && 'bg-orange-100 text-orange-800',
      tone === 'neutral' && 'bg-neutral-100 text-neutral-600',
      tone === 'green' && 'bg-emerald-100 text-emerald-700',
      tone === 'dark' && 'bg-neutral-900 text-white',
      className
    )}
  >
    {children}
  </span>
);

// ---------- Vòng tiến độ ----------

export const ProgressRing: React.FC<{ value: number; total: number; size?: number; stroke?: number; children?: React.ReactNode }> = ({
  value,
  total,
  size = 140,
  stroke = 12,
  children,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, value / total) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-orange-100" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-orange-500"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(pct, value ? 0.02 : 0)) }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};
