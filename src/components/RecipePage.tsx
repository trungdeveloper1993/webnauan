import React, { useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Clock,
  Gauge,
  Lock,
  NotebookPen,
  Palette,
  Pencil,
  Play,
  Printer,
  Share2,
  Timer,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react';
import { Recipe } from '../types';
import { useRecipes } from '../RecipeContext';
import { useJourney } from '../JourneyContext';
import { href, navigate, replaceRoute } from '../lib/router';
import { DIFFICULTY_LABELS, displayTitle, STAGES, stripDuration } from '../lib/recipe';
import { cn, pad2 } from '../lib/utils';
import { DifficultyMeter, Modal, RatingInput, RecipeCover, Tag } from './ui';
import { Inline, Markdown } from './Markdown';
import { IngredientsPanel } from './IngredientsPanel';
import { CookingMode } from './CookingMode';

interface RecipePageProps {
  day: number;
  cooking: boolean;
  onEdit: (recipe: Recipe) => void;
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const RecipePage: React.FC<RecipePageProps> = ({ day, cooking, onEdit }) => {
  const { recipes, isLoading, deleteRecipe } = useRecipes();
  const { cooked, toggleCooked, notes, setNote, ratings, setRating, isAdmin } = useJourney();
  const openedHere = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shared, setShared] = useState(false);

  const index = recipes.findIndex((r) => r.day === day);
  const recipe = recipes[index];

  if (!recipe) {
    if (isLoading) {
      return (
        <main className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-[4/3] rounded-[2rem] bg-neutral-200/60 animate-pulse" />
            <div className="space-y-4 pt-6">
              <div className="h-6 w-32 rounded-full bg-neutral-200/60 animate-pulse" />
              <div className="h-12 rounded-2xl bg-neutral-200/60 animate-pulse" />
              <div className="h-24 rounded-2xl bg-neutral-200/60 animate-pulse" />
            </div>
          </div>
        </main>
      );
    }
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-neutral-200/60 flex items-center justify-center text-neutral-400">
          <Lock size={32} />
        </div>
        <h1 className="text-3xl font-black mt-6">Ngày {day} chưa mở khóa</h1>
        <p className="text-neutral-500 mt-2">Công thức cho ngày này sẽ sớm được cập nhật.</p>
        <a
          href={href.home}
          className="mt-8 inline-flex items-center gap-2 bg-neutral-900 text-white h-12 px-6 rounded-2xl font-bold"
        >
          <ArrowLeft size={18} /> Về lộ trình
        </a>
      </main>
    );
  }

  const prev = recipes[index - 1];
  const next = recipes[index + 1];
  const cookedAt = cooked[recipe.id];
  const stageIndex = Math.max(0, STAGES.findIndex((s) => recipe.day <= s.to));
  const stage = STAGES[stageIndex] ?? STAGES[STAGES.length - 1];
  const timerCount = (recipe.sections.map((s) => s.content).join(' ').match(/\d\s*(phút|giây|tiếng|giờ)/g) ?? []).length;

  const startCooking = () => {
    openedHere.current = true;
    navigate(href.cook(recipe.day));
  };

  const closeCooking = () => {
    if (openedHere.current) {
      openedHere.current = false;
      window.history.back();
    } else {
      replaceRoute(href.recipe(recipe.day));
    }
  };

  const share = async () => {
    const url = window.location.href.replace(/\/nau$/, '');
    const title = `Ngày ${recipe.day}: ${recipe.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // Người dùng hủy chia sẻ
    }
  };

  const iconButton =
    'w-12 h-12 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 flex items-center justify-center transition-all active:scale-95';

  return (
    <main className="pb-10">
      {/* ---------- Đầu trang ---------- */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between gap-3 min-h-9 print:hidden">
          <a href={href.home} className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-orange-600">
            <ArrowLeft size={16} /> Lộ trình 100 ngày
          </a>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(recipe)}
                className="h-9 px-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 text-sm font-bold flex items-center gap-1.5"
              >
                <Pencil size={14} /> Sửa
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="h-9 px-3 rounded-xl bg-white border border-neutral-200 hover:border-red-300 hover:text-red-600 text-sm font-bold flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center mt-4">
          <RecipeCover recipe={recipe} size="xl" className="aspect-[4/3] rounded-[2rem] shadow-xl shadow-orange-900/10" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="dark">NGÀY {pad2(recipe.day)}</Tag>
              <Tag tone="orange">
                Chặng {stageIndex + 1} · {stage.name}
              </Tag>
              {cookedAt && (
                <Tag tone="green">
                  <Check size={12} strokeWidth={3} /> Đã nấu {formatDate(cookedAt)}
                  {ratings[recipe.id] ? ` · ${ratings[recipe.id]}/10` : ''}
                </Tag>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mt-4 text-neutral-900">
              {recipe.name}
            </h1>
            {recipe.description && <p className="text-lg text-neutral-600 mt-4 leading-relaxed">{recipe.description}</p>}

            <dl className="grid grid-cols-2 gap-2.5 mt-6">
              <Meta icon={<Clock size={16} />} label="Thời gian" value={recipe.time || 'Chưa rõ'} />
              <Meta
                icon={<Gauge size={16} />}
                label="Độ khó"
                value={
                  <span className="inline-flex items-center gap-2">
                    <DifficultyMeter level={recipe.difficulty} /> {recipe.difficulty}/5 · {DIFFICULTY_LABELS[recipe.difficulty]}
                  </span>
                }
              />
              <Meta icon={<Users size={16} />} label="Khẩu phần" value={recipe.servings || 'Chưa rõ'} />
              <Meta
                icon={<Utensils size={16} />}
                label="Bữa · Phân loại"
                value={[recipe.mealTime, recipe.category].filter(Boolean).join(' · ') || 'Món ăn'}
              />
            </dl>
            {recipe.style && (
              <p className="flex items-start gap-2 text-sm text-neutral-500 mt-4">
                <Palette size={16} className="shrink-0 mt-0.5 text-orange-500" />
                <span>
                  <strong className="text-neutral-700">Phong cách:</strong> {recipe.style}
                </span>
              </p>
            )}

            <div className="flex flex-wrap gap-2.5 mt-7 print:hidden">
              <button
                onClick={startCooking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white h-12 px-6 rounded-2xl font-bold shadow-lg shadow-orange-600/25 transition-all active:scale-95"
              >
                <Play size={18} className="fill-current" /> Bắt đầu nấu
              </button>
              <button
                onClick={() => toggleCooked(recipe.id)}
                className={cn(
                  'flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl font-bold transition-all active:scale-95 border',
                  cookedAt
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-900'
                )}
              >
                {cookedAt ? <Check size={18} strokeWidth={3} /> : <Circle size={18} />}
                {cookedAt ? 'Đã nấu' : 'Đánh dấu đã nấu'}
              </button>
              <button onClick={share} className={iconButton} title={shared ? 'Đã sao chép liên kết' : 'Chia sẻ'} aria-label="Chia sẻ">
                {shared ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
              </button>
              <button onClick={() => window.print()} className={cn(iconButton, 'hidden sm:flex')} title="In công thức" aria-label="In công thức">
                <Printer size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Nội dung ---------- */}
      <section className="max-w-6xl mx-auto px-4 mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:gap-8 items-start">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-3xl bg-white border border-neutral-200/70 p-5 shadow-sm">
          <IngredientsPanel recipe={recipe} />
        </aside>

        <div className="space-y-5 min-w-0">
          {recipe.sections.length > 1 && (
            <nav className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap print:hidden" aria-label="Các bước">
              {recipe.sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => document.getElementById(`buoc-${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="shrink-0 h-9 pl-1.5 pr-3.5 rounded-full bg-white border border-neutral-200 hover:border-orange-300 text-sm font-semibold text-neutral-700 flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="max-w-[12rem] truncate">{s.title}</span>
                </button>
              ))}
            </nav>
          )}

          <p className="flex items-start gap-2 text-sm text-neutral-500 bg-white/60 border border-dashed border-orange-200 rounded-2xl px-4 py-3 print:hidden">
            <Timer size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <span>
              Chạm vào từng bước để đánh dấu đã làm.
              {timerCount > 0 && (
                <>
                  {' '}
                  Chạm vào các mốc <span className="font-semibold text-orange-700">thời gian màu cam</span> để hẹn giờ.
                </>
              )}
            </span>
          </p>

          {recipe.sections.map((s, i) => (
            <section
              key={i}
              id={`buoc-${i + 1}`}
              className="scroll-mt-24 bg-white rounded-3xl border border-neutral-200/70 p-5 sm:p-8 shadow-sm break-inside-avoid"
            >
              <div className="flex items-center gap-4 mb-5">
                <span className="w-11 h-11 rounded-2xl bg-orange-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-lg shadow-orange-600/25">
                  {i + 1}
                </span>
                {/* Thời gian trong tiêu đề ("Chiên thịt — 8–12 phút") cũng bấm để hẹn giờ */}
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 [&_button]:text-[0.62em] [&_button]:align-middle">
                  <Inline text={displayTitle(s.title)} timerLabel={stripDuration(s.title)} />
                </h2>
              </div>
              <Markdown content={s.content} interactive timerLabel={stripDuration(s.title)} />
            </section>
          ))}

          {/* Ghi chú */}
          <section className="rounded-3xl bg-amber-50/70 border border-amber-200/70 p-5 sm:p-8 print:hidden">
            <div className="flex items-center gap-2 text-amber-900">
              <NotebookPen size={20} />
              <h2 className="text-lg font-black">Ghi chú của tôi</h2>
            </div>
            <p className="text-sm text-amber-900/60 mt-1">Lưu ngay trên trình duyệt này, chỉ mình bạn thấy.</p>
            <textarea
              value={notes[recipe.id] ?? ''}
              onChange={(e) => setNote(recipe.id, e.target.value)}
              rows={3}
              placeholder="Ví dụ: luộc khoai 15 phút là vừa, sốt bớt đường một chút..."
              className="mt-4 w-full p-4 bg-white border border-amber-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
            />
          </section>

          {/* Đánh dấu hoàn thành + chấm điểm */}
          <section className="rounded-3xl bg-neutral-900 text-white p-6 sm:p-8 print:hidden">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="text-5xl" aria-hidden>
                {cookedAt ? '🏆' : '🍽️'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black">{cookedAt ? `Bạn đã hoàn thành Ngày ${recipe.day}!` : 'Nấu xong rồi?'}</h2>
                <p className="text-neutral-400 text-sm mt-1">
                  {cookedAt
                    ? `Đánh dấu ngày ${formatDate(cookedAt)}. Hãy tiếp tục với món tiếp theo nhé.`
                    : 'Đánh dấu để cập nhật tiến độ hành trình 100 ngày của bạn.'}
                </p>
              </div>
              <button
                onClick={() => toggleCooked(recipe.id)}
                className={cn(
                  'h-12 px-6 rounded-2xl font-bold transition-all active:scale-95 shrink-0',
                  cookedAt ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                )}
              >
                {cookedAt ? 'Bỏ đánh dấu' : 'Đánh dấu đã nấu'}
              </button>
            </div>
            {cookedAt && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="font-bold mb-3">Món này được mấy điểm trên 10?</p>
                <RatingInput dark value={ratings[recipe.id]} onChange={(score) => setRating(recipe.id, score)} />
              </div>
            )}
          </section>

          {/* Món trước / sau */}
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden" aria-label="Món khác">
            {prev ? (
              <a href={href.recipe(prev.day)} className="group bg-white border border-neutral-200/70 hover:border-orange-300 rounded-3xl p-5 flex items-center gap-4">
                <ArrowLeft size={20} className="text-neutral-400 group-hover:text-orange-600 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-xs font-black uppercase tracking-widest text-neutral-400">Ngày {pad2(prev.day)}</span>
                  <span className="block font-bold truncate">{prev.name}</span>
                </span>
              </a>
            ) : (
              <div className="hidden sm:block" />
            )}
            {next ? (
              <a
                href={href.recipe(next.day)}
                className="group bg-white border border-neutral-200/70 hover:border-orange-300 rounded-3xl p-5 flex items-center justify-end gap-4 text-right"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-black uppercase tracking-widest text-orange-600">Ngày {pad2(next.day)}</span>
                  <span className="block font-bold truncate">{next.name}</span>
                </span>
                <ArrowRight size={20} className="text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            ) : (
              <div className="bg-neutral-100/80 border border-dashed border-neutral-300 rounded-3xl p-5 flex items-center justify-end gap-4 text-right text-neutral-400">
                <span>
                  <span className="block text-xs font-black uppercase tracking-widest">Ngày {pad2(recipe.day + 1)}</span>
                  <span className="block font-bold">Sắp ra mắt</span>
                </span>
                <Lock size={18} className="shrink-0" />
              </div>
            )}
          </nav>
        </div>
      </section>

      <AnimatePresence>
        {cooking && <CookingMode key="cooking" recipe={recipe} nextRecipe={next} onClose={closeCooking} />}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(false)} label="Xác nhận xóa" className="sm:max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 size={28} />
            </div>
            <h3 className="text-xl font-black">Xóa Ngày {recipe.day}?</h3>
            <p className="text-neutral-500 mt-2 leading-relaxed">
              Món <strong className="text-neutral-900">{recipe.name}</strong> sẽ bị xóa khỏi dữ liệu trên trình duyệt này. Nhớ tải
              lại recipes.json nếu muốn cập nhật lên GitHub.
            </p>
            <div className="flex gap-3 mt-7">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 h-12 bg-neutral-100 hover:bg-neutral-200 rounded-2xl font-bold">
                Hủy
              </button>
              <button
                onClick={() => {
                  deleteRecipe(recipe.id);
                  setConfirmDelete(false);
                  navigate(href.home);
                }}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold"
              >
                Xóa món
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
};

const Meta: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-neutral-200/70 px-3.5 py-3">
    <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
      <span className="text-orange-500">{icon}</span>
      {label}
    </dt>
    <dd className="font-bold text-neutral-900 mt-1 text-sm sm:text-base">{value}</dd>
  </div>
);
