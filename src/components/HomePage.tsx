import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Flame,
  Map as MapIcon,
  PartyPopper,
  Play,
  Search,
  Shuffle,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { Recipe } from '../types';
import { useRecipes } from '../RecipeContext';
import { useJourney } from '../JourneyContext';
import { href } from '../lib/router';
import { DIFFICULTY_LABELS, MEAL_TIMES, STAGES, TOTAL_DAYS } from '../lib/recipe';
import { cn, pad2, removeAccents } from '../lib/utils';
import { DifficultyMeter, ProgressRing, RecipeCover } from './ui';
import { JourneyMap } from './JourneyMap';
import { RecipeCard } from './RecipeCard';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

export const HomePage: React.FC<{ onRandom: () => void }> = ({ onRandom }) => {
  const { recipes, isLoading } = useRecipes();
  const { isCooked, streak, isAdmin } = useJourney();
  const mapRef = useRef<HTMLElement>(null);

  const byDay = useMemo(() => {
    const map = new Map<number, Recipe>();
    recipes.forEach((r) => !map.has(r.day) && map.set(r.day, r));
    return map;
  }, [recipes]);

  const cookedCount = recipes.filter((r) => isCooked(r.id)).length;
  const next = recipes.find((r) => !isCooked(r.id));
  const lastDay = recipes.length ? recipes[recipes.length - 1].day : 0;
  const stageIndex = Math.max(0, STAGES.findIndex((s) => (next?.day ?? Math.max(1, lastDay)) <= s.to));
  const stage = STAGES[stageIndex] ?? STAGES[STAGES.length - 1];

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-orange-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-48 w-[22rem] h-[22rem] bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 pt-10 md:pt-16 pb-12 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 bg-white border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              <Flame size={14} /> Hành trình 100 ngày vào bếp
            </span>
            <h1 className="mt-5 text-[2.6rem] leading-[1.05] sm:text-6xl font-black tracking-tight text-neutral-900">
              Mỗi ngày <br className="sm:hidden" />
              một món,
              <br />
              <span className="font-serif italic text-orange-600">từ dễ đến khó.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed">
              Bắt đầu từ những món thật đơn giản rồi nâng dần độ khó qua 5 chặng. Mỗi công thức có nguyên liệu, hẹn giờ,
              chế độ nấu từng bước và đánh dấu tiến độ cho riêng bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {next ? (
                <a
                  href={href.recipe(next.day)}
                  className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white h-12 px-6 rounded-2xl font-bold shadow-xl shadow-neutral-900/15 transition-all active:scale-95"
                >
                  Nấu Ngày {next.day} <ArrowRight size={18} />
                </a>
              ) : (
                <button
                  onClick={onRandom}
                  disabled={!recipes.length}
                  className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white h-12 px-6 rounded-2xl font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  <Shuffle size={18} /> Nấu lại một món
                </button>
              )}
              <button
                onClick={() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 border border-neutral-200 text-neutral-900 h-12 px-6 rounded-2xl font-bold transition-all active:scale-95"
              >
                <MapIcon size={18} /> Xem lộ trình
              </button>
            </div>
          </motion.div>

          {/* Thẻ tiến độ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-[2rem] border border-orange-100 shadow-xl shadow-orange-900/5 p-6 sm:p-8"
          >
            <div className="flex items-center gap-6">
              <ProgressRing value={cookedCount} total={TOTAL_DAYS} size={128} stroke={11}>
                <div className="text-4xl font-black leading-none">{cookedCount}</div>
                <div className="text-[11px] text-neutral-400 font-bold mt-1">/ {TOTAL_DAYS} ngày</div>
              </ProgressRing>
              <div className="space-y-4 min-w-0">
                <Stat icon={<Flame size={16} />} label="Chuỗi ngày nấu" value={streak ? `${streak} ngày liên tiếp` : 'Chưa bắt đầu'} />
                <Stat icon={<BookOpen size={16} />} label="Công thức" value={`${recipes.length}/${TOTAL_DAYS} món`} />
                <Stat icon={<Trophy size={16} />} label="Chặng hiện tại" value={`${stageIndex + 1} · ${stage.name}`} />
              </div>
            </div>
            <div className="mt-7">
              <div className="flex gap-1.5">
                {STAGES.map((s, i) => {
                  const inStage = recipes.filter((r) => r.day >= s.from && r.day <= s.to);
                  const done = inStage.filter((r) => isCooked(r.id)).length;
                  return (
                    <div key={s.from} className="flex-1 min-w-0" title={`Chặng ${i + 1} · ${s.name}: ${done}/20 đã nấu`}>
                      <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(done / 20) * 100}%` }} />
                      </div>
                      <div
                        className={cn(
                          'text-[10px] font-bold mt-1.5 truncate',
                          i === stageIndex ? 'text-orange-600' : 'text-neutral-400'
                        )}
                      >
                        {s.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Món tiếp theo ---------- */}
      <section className="max-w-6xl mx-auto px-4">
        {isLoading && !recipes.length ? (
          <div className="h-80 rounded-[2rem] bg-neutral-200/60 animate-pulse" />
        ) : next ? (
          <NextDishCard recipe={next} />
        ) : recipes.length ? (
          <motion.div {...fadeUp} className="rounded-[2rem] bg-neutral-900 text-white p-8 md:p-12 text-center">
            <PartyPopper size={40} className="mx-auto text-orange-400" />
            <h2 className="text-2xl md:text-3xl font-black mt-4">Bạn đã nấu hết {recipes.length} món hiện có!</h2>
            <p className="text-neutral-300 mt-2">
              Ngày {lastDay + 1} sẽ sớm ra mắt. Trong lúc chờ, hãy nấu lại một món bạn thích.
            </p>
            <button
              onClick={onRandom}
              className="mt-6 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 h-12 px-6 rounded-2xl font-bold"
            >
              <Shuffle size={18} /> Chọn ngẫu nhiên
            </button>
          </motion.div>
        ) : (
          <div className="rounded-[2rem] border-2 border-dashed border-neutral-300 p-10 text-center text-neutral-500">
            <p className="text-lg font-bold text-neutral-700">Chưa có công thức nào.</p>
            <p className="mt-1">
              {isAdmin ? 'Bấm "Thêm món" ở góc trên để tạo Ngày 1.' : 'Hãy quay lại sau nhé!'}
            </p>
          </div>
        )}
      </section>

      {/* ---------- Lộ trình ---------- */}
      <motion.section ref={mapRef} {...fadeUp} className="max-w-6xl mx-auto px-4 pt-16 scroll-mt-20">
        <SectionTitle eyebrow="Lộ trình" title="100 ngày, 5 chặng" subtitle="Mỗi ô là một ngày. Chạm vào ô đã có công thức để xem và nấu." />
        <div className="bg-white rounded-[2rem] border border-neutral-200/70 p-5 sm:p-8 shadow-sm">
          <JourneyMap byDay={byDay} nextDay={next?.day} />
        </div>
      </motion.section>

      {/* ---------- Thư viện ---------- */}
      <Library recipes={recipes} />
    </main>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">{icon}</div>
    <div className="min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{label}</div>
      <div className="font-bold text-neutral-900 truncate">{value}</div>
    </div>
  </div>
);

export const SectionTitle: React.FC<{ eyebrow: string; title: string; subtitle?: string; right?: React.ReactNode }> = ({
  eyebrow,
  title,
  subtitle,
  right,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-orange-600">{eyebrow}</div>
      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 mt-1">{title}</h2>
      {subtitle && <p className="text-neutral-500 mt-2">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const NextDishCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
  <motion.div
    {...fadeUp}
    className="group grid grid-cols-1 md:grid-cols-[1fr_1.15fr] bg-neutral-900 text-white rounded-[2rem] overflow-hidden shadow-2xl shadow-neutral-900/20"
  >
    <a href={href.recipe(recipe.day)} className="block">
      <RecipeCover recipe={recipe} size="xl" className="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[360px]" />
    </a>
    <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
      <div className="flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-widest">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
        </span>
        Món tiếp theo · Ngày {pad2(recipe.day)}
      </div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-3 leading-tight">{recipe.name}</h2>
      {recipe.description && <p className="text-neutral-300 mt-3 leading-relaxed">{recipe.description}</p>}
      <div className="flex flex-wrap gap-2 mt-5 text-sm">
        {recipe.time && (
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
            <Clock size={14} /> {recipe.time}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
          <DifficultyMeter level={recipe.difficulty} /> {DIFFICULTY_LABELS[recipe.difficulty]}
        </span>
        {recipe.servings && (
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
            <Users size={14} /> {recipe.servings}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
          {recipe.ingredients.length} nguyên liệu · {recipe.sections.length} bước
        </span>
      </div>
      <div className="flex flex-wrap gap-3 mt-8">
        <a
          href={href.cook(recipe.day)}
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 h-12 px-6 rounded-2xl font-bold shadow-lg shadow-orange-600/30 transition-all active:scale-95"
        >
          <Play size={18} className="fill-current" /> Bắt đầu nấu
        </a>
        <a
          href={href.recipe(recipe.day)}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 h-12 px-6 rounded-2xl font-bold transition-all active:scale-95"
        >
          Xem công thức <ArrowRight size={18} />
        </a>
      </div>
    </div>
  </motion.div>
);

// ---------- Thư viện món ăn ----------

type Status = 'all' | 'todo' | 'done';

const Library: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => {
  const { isCooked } = useJourney();
  const [query, setQuery] = useState('');
  const [mealTime, setMealTime] = useState('Tất cả');
  const [difficulty, setDifficulty] = useState(0);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<Status>('all');

  const categories = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.category).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'vi')),
    [recipes]
  );

  const q = removeAccents(query.trim());
  const filtered = recipes.filter((r) => {
    if (mealTime !== 'Tất cả' && r.mealTime !== mealTime) return false;
    if (difficulty && r.difficulty !== difficulty) return false;
    if (category && r.category !== category) return false;
    if (status === 'todo' && isCooked(r.id)) return false;
    if (status === 'done' && !isCooked(r.id)) return false;
    if (!q) return true;
    const haystack = removeAccents(
      [`ngay ${r.day}`, r.name, r.description, r.category, r.mealTime, r.style, ...r.ingredients.map((i) => i.name)].join(' ')
    );
    return haystack.includes(q);
  });

  const hasFilter = Boolean(q || mealTime !== 'Tất cả' || difficulty || category || status !== 'all');
  const reset = () => {
    setQuery('');
    setMealTime('Tất cả');
    setDifficulty(0);
    setCategory('');
    setStatus('all');
  };

  const chip = (active: boolean) =>
    cn(
      'h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all border',
      active
        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900'
    );

  const select =
    'h-9 pl-3 pr-8 rounded-full text-sm font-bold bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer';

  return (
    <motion.section {...fadeUp} className="max-w-6xl mx-auto px-4 pt-16" id="thu-vien">
      <SectionTitle
        eyebrow="Thư viện"
        title="Tất cả công thức"
        subtitle={`${recipes.length} món đã sẵn sàng · tìm theo tên, nguyên liệu hoặc số ngày`}
      />

      <div className="space-y-3 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm món: khoai tây, tôm, ngày 1..."
            className="w-full h-14 pl-12 pr-4 bg-white border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 text-neutral-800 shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {['Tất cả', ...MEAL_TIMES].map((m) => (
            <button key={m} onClick={() => setMealTime(m)} className={chip(mealTime === m)}>
              {m === 'Tất cả' ? 'Tất cả bữa' : m}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className={cn(select, 'flex-1 sm:flex-none min-w-0')}
              aria-label="Độ khó"
            >
              <option value={0}>Mọi độ khó</option>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  Độ khó {d} · {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
            {categories.length > 0 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={cn(select, 'flex-1 sm:flex-none min-w-0')}
                aria-label="Phân loại"
              >
                <option value="">Mọi phân loại</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex bg-neutral-900/5 p-1 rounded-full">
            {(
              [
                ['all', 'Tất cả'],
                ['todo', 'Chưa nấu'],
                ['done', 'Đã nấu'],
              ] as [Status, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={cn(
                  'h-7 px-3 rounded-full text-xs font-bold transition-all',
                  status === value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {hasFilter && (
            <button onClick={reset} className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:underline ml-auto">
              <X size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-neutral-500 bg-white rounded-3xl border border-dashed border-neutral-300">
          <p className="text-lg font-bold text-neutral-700">Không tìm thấy món phù hợp.</p>
          {hasFilter && (
            <button onClick={reset} className="mt-3 text-orange-600 font-bold hover:underline">
              Xem tất cả món
            </button>
          )}
        </div>
      )}
    </motion.section>
  );
};
