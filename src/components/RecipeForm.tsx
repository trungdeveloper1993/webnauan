import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ClipboardPaste,
  Image as ImageIcon,
  Plus,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
  WandSparkles,
  X,
} from 'lucide-react';
import { Ingredient, Recipe, RecipeKind, RecipeSection } from '../types';
import { useRecipes } from '../RecipeContext';
import { href, navigate } from '../lib/router';
import { CATEGORY_SUGGESTIONS, DIFFICULTY_LABELS, guessEmoji, MEAL_TIMES, SAUCE_CATEGORIES } from '../lib/recipe';
import { parseRecipeText, ParseResult } from '../lib/importText';
import { cn } from '../lib/utils';
import { Modal } from './ui';

type Draft = Omit<Recipe, 'id'>;

const emptyIngredient = (group = ''): Ingredient => ({ name: '', amount: '', unit: '', note: '', group });
const emptySection = (): RecipeSection => ({ title: '', content: '' });

const toDraft = (recipe: Recipe | null, nextDay: number, kind: RecipeKind): Draft =>
  recipe
    ? {
        ...recipe,
        ingredients: recipe.ingredients.length ? recipe.ingredients : [emptyIngredient()],
        sections: recipe.sections.length ? recipe.sections : [emptySection()],
      }
    : {
        day: kind === 'sauce' ? 0 : nextDay,
        name: '',
        emoji: '',
        thumbnail: '',
        description: '',
        style: '',
        time: '',
        difficulty: 1,
        servings: kind === 'sauce' ? '1 chén nhỏ' : '1 người',
        category: kind === 'sauce' ? 'Muối chấm' : '',
        mealTime: kind === 'sauce' ? '' : 'Bữa trưa',
        pairing: '',
        ingredients: [emptyIngredient()],
        sections: [emptySection()],
      };

const input =
  'w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors';
const label = 'block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-1.5';

interface RecipeFormProps {
  recipe: Recipe | null;
  kind?: RecipeKind;
  onClose: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, kind = 'recipe', onClose }) => {
  const { recipes, addRecipe, updateRecipe, addSauce, updateSauce } = useRecipes();
  const isSauce = kind === 'sauce';
  const nextDay = recipes.reduce((max, r) => Math.max(max, r.day), 0) + 1;
  const [draft, setDraft] = useState<Draft>(() => toDraft(recipe, nextDay, isSauce ? 'sauce' : 'recipe'));
  const [importOpen, setImportOpen] = useState(!recipe);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const conflict = isSauce ? undefined : recipes.find((r) => r.day === draft.day && r.id !== recipe?.id);

  // ----- Nguyên liệu -----
  const setIngredient = (i: number, field: keyof Ingredient, value: string) =>
    set(
      'ingredients',
      draft.ingredients.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing))
    );

  // ----- Các phần -----
  const setSection = (i: number, field: keyof RecipeSection, value: string) =>
    set(
      'sections',
      draft.sections.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.sections.length) return;
    const next = [...draft.sections];
    [next[i], next[j]] = [next[j], next[i]];
    set('sections', next);
  };

  const runImport = () => {
    const parsed = parseRecipeText(importText);
    const result = isSauce
      ? {
          ...parsed,
          recipe: { ...parsed.recipe, day: undefined },
          found: parsed.found.filter((x) => !x.startsWith('Ngày')),
          warnings: parsed.warnings.filter((w) => !w.includes('NGÀY')),
        }
      : parsed;
    setImportResult(result);
    const p = result.recipe;
    setDraft((d) => ({
      ...d,
      ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== '')),
      ingredients: p.ingredients?.length ? p.ingredients.map((i) => ({ note: '', group: '', ...i })) : d.ingredients,
      sections: p.sections?.length ? p.sections : d.sections,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError(isSauce ? 'Hãy nhập tên gia vị.' : 'Hãy nhập tên món.');
    if (!isSauce && !(draft.day >= 1)) return setError('Số ngày phải từ 1 trở lên.');
    if (conflict) return setError(`Ngày ${draft.day} đã có món "${conflict.name}". Hãy đổi số ngày.`);

    const data: Draft = {
      ...draft,
      name: draft.name.trim(),
      emoji: draft.emoji?.trim() || guessEmoji(draft.name),
      ingredients: draft.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          amount: i.amount.trim(),
          unit: i.unit.trim(),
          ...(i.note?.trim() ? { note: i.note.trim() } : {}),
          ...(i.group?.trim() ? { group: i.group.trim() } : {}),
        })),
      sections: draft.sections.filter((s) => s.title.trim() || s.content.trim()),
    };

    if (isSauce) {
      const saved = recipe ? { ...data, id: recipe.id } : addSauce(data);
      if (recipe) updateSauce(recipe.id, saved);
      onClose();
      navigate(href.sauce(saved.id));
      return;
    }
    if (recipe) updateRecipe(recipe.id, { ...data, id: recipe.id });
    else addRecipe(data);
    onClose();
    navigate(href.recipe(data.day));
  };

  return (
    <Modal
      onClose={onClose}
      label={isSauce ? (recipe ? 'Sửa gia vị' : 'Thêm gia vị mới') : recipe ? 'Sửa món' : 'Thêm món mới'}
      className="sm:max-w-3xl"
    >
      <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center shrink-0">
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-orange-600">Quản trị</div>
          <h2 className="text-xl font-black tracking-tight">
            {isSauce ? (recipe ? `Sửa: ${recipe.name}` : 'Thêm gia vị mới') : recipe ? `Sửa Ngày ${recipe.day}` : 'Thêm món mới'}
          </h2>
        </div>
        <button onClick={onClose} className="w-10 h-10 hover:bg-neutral-100 rounded-xl flex items-center justify-center" aria-label="Đóng">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* ----- Nhập nhanh ----- */}
          <div className="rounded-2xl border border-orange-200 bg-orange-50/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setImportOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <ClipboardPaste size={18} className="text-orange-600 shrink-0" />
              <span className="flex-1">
                <span className="block font-bold text-orange-950">Nhập nhanh từ văn bản</span>
                <span className="block text-xs text-orange-900/60">
                  {isSauce ? 'Dán nguyên bài công thức để tự điền toàn bộ form' : 'Dán nguyên bài "NGÀY X — ..." để tự điền toàn bộ form'}
                </span>
              </span>
              <ChevronDown size={18} className={cn('text-orange-600 transition-transform', importOpen && 'rotate-180')} />
            </button>
            {importOpen && (
              <div className="px-4 pb-4 space-y-3">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={7}
                  placeholder={
                    isSauce
                      ? 'MUỐI ỚT XANH\nGiới thiệu ngắn...\nThời gian: 10 phút\nDùng với: hải sản, gà luộc\nNguyên liệu\n- Ớt xanh: 50 g\n...\nCách làm\n1. ...'
                      : 'NGÀY 2 — TÊN MÓN\nGiới thiệu ngắn...\nPhong cách: ...\nThời gian: 20 phút\nĐộ khó: 1/5\nKhẩu phần: 1 người\n1. Danh sách nguyên liệu\n...\n2. Chuẩn bị\n...'
                  }
                  className="w-full p-3 bg-white border border-orange-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={runImport}
                    disabled={!importText.trim()}
                    className="h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    <WandSparkles size={16} /> Phân tích & điền vào form
                  </button>
                  {importResult && importResult.found.length > 0 && (
                    <span className="text-xs text-emerald-700 font-semibold">Đã nhận: {importResult.found.join(' · ')}</span>
                  )}
                </div>
                {importResult?.warnings.map((w) => (
                  <p key={w} className="text-xs text-amber-800 flex items-start gap-1.5">
                    <TriangleAlert size={14} className="shrink-0 mt-px" /> {w}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* ----- Thông tin chung ----- */}
          <fieldset className="space-y-4">
            <div className={cn('grid grid-cols-2 gap-3', isSauce ? 'grid-cols-[6.5rem_1fr]' : 'sm:grid-cols-[5.5rem_6.5rem_1fr]')}>
              <div className={isSauce ? 'hidden' : undefined}>
                <label className={label} htmlFor="f-day">
                  Ngày
                </label>
                <input
                  id="f-day"
                  type="number"
                  min={1}
                  required={!isSauce}
                  value={draft.day || ''}
                  onChange={(e) => set('day', Number(e.target.value))}
                  className={cn(input, conflict && 'border-red-400 focus:ring-red-400')}
                />
              </div>
              <div>
                <label className={label} htmlFor="f-emoji">
                  Emoji
                </label>
                <div className="relative">
                  <input
                    id="f-emoji"
                    value={draft.emoji ?? ''}
                    onChange={(e) => set('emoji', e.target.value)}
                    className={cn(input, 'pr-9')}
                    placeholder="🍳"
                  />
                  <button
                    type="button"
                    onClick={() => set('emoji', guessEmoji(draft.name))}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-orange-100 text-orange-600 flex items-center justify-center"
                    title="Gợi ý emoji theo tên món"
                    aria-label="Gợi ý emoji"
                  >
                    <Sparkles size={15} />
                  </button>
                </div>
              </div>
              <div className={isSauce ? 'col-span-1' : 'col-span-2 sm:col-span-1'}>
                <label className={label} htmlFor="f-name">
                  {isSauce ? 'Tên gia vị' : 'Tên món'}
                </label>
                <input
                  id="f-name"
                  required
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={input}
                  placeholder={isSauce ? 'VD: Muối ớt xanh' : 'VD: Trứng chiên cà chua'}
                />
              </div>
            </div>
            {conflict && (
              <p className="text-xs font-semibold text-red-600 -mt-2">
                Ngày {draft.day} đã có món "{conflict.name}".
              </p>
            )}

            <div>
              <label className={label} htmlFor="f-desc">
                Giới thiệu ngắn
              </label>
              <textarea
                id="f-desc"
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                className={cn(input, 'h-auto py-3')}
                placeholder="Món này có gì đặc biệt, học được kỹ năng gì..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="f-time">
                  Thời gian
                </label>
                <input id="f-time" value={draft.time ?? ''} onChange={(e) => set('time', e.target.value)} className={input} placeholder="25–30 phút" />
              </div>
              <div>
                <label className={label} htmlFor="f-servings">
                  {isSauce ? 'Lượng làm ra' : 'Khẩu phần'}
                </label>
                <input
                  id="f-servings"
                  value={draft.servings ?? ''}
                  onChange={(e) => set('servings', e.target.value)}
                  className={input}
                  placeholder={isSauce ? '1 chén nhỏ' : '1 người'}
                />
              </div>
              {isSauce ? (
                <div>
                  <label className={label} htmlFor="f-pairing">
                    Dùng với
                  </label>
                  <input
                    id="f-pairing"
                    value={draft.pairing ?? ''}
                    onChange={(e) => set('pairing', e.target.value)}
                    className={input}
                    placeholder="Hải sản, gà luộc"
                  />
                </div>
              ) : (
                <div>
                  <label className={label} htmlFor="f-meal">
                    Bữa ăn
                  </label>
                  <select id="f-meal" value={draft.mealTime ?? ''} onChange={(e) => set('mealTime', e.target.value)} className={input}>
                    <option value="">— Không chọn —</option>
                    {MEAL_TIMES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={label} htmlFor="f-cat">
                  Phân loại
                </label>
                <input
                  id="f-cat"
                  list="category-suggestions"
                  value={draft.category ?? ''}
                  onChange={(e) => set('category', e.target.value)}
                  className={input}
                  placeholder={isSauce ? 'Muối chấm' : 'Món luộc'}
                />
                <datalist id="category-suggestions">
                  {(isSauce ? SAUCE_CATEGORIES : CATEGORY_SUGGESTIONS).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <span className={label}>Độ khó</span>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('difficulty', d)}
                    className={cn(
                      'h-14 rounded-xl border text-sm font-bold flex flex-col items-center justify-center leading-tight transition-all',
                      draft.difficulty === d
                        ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/25'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-orange-300'
                    )}
                  >
                    <span className="text-base font-black">{d}</span>
                    <span className="text-[10px] opacity-80">{DIFFICULTY_LABELS[d]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={label} htmlFor="f-style">
                Phong cách
              </label>
              <input
                id="f-style"
                value={draft.style ?? ''}
                onChange={(e) => set('style', e.target.value)}
                className={input}
                placeholder="Món ăn gia đình Việt Nam..."
              />
            </div>

            <div>
              <label className={label} htmlFor="f-thumb">
                Ảnh bìa (không bắt buộc)
              </label>
              <div className="relative">
                <ImageIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="f-thumb"
                  value={draft.thumbnail ?? ''}
                  onChange={(e) => set('thumbnail', e.target.value)}
                  className={cn(input, 'pl-10')}
                  placeholder="https://... hoặc images/ngay-1.jpg"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">
                Để trống thì dùng emoji làm ảnh bìa. Ảnh tự chụp: tải vào thư mục <code>public/images/</code> trên GitHub rồi ghi{' '}
                <code>images/ten-anh.jpg</code>.
              </p>
            </div>
          </fieldset>

          {/* ----- Nguyên liệu ----- */}
          <fieldset>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-neutral-900">Nguyên liệu</h3>
              <button
                type="button"
                onClick={() => set('ingredients', [...draft.ingredients, emptyIngredient(draft.ingredients[draft.ingredients.length - 1]?.group)])}
                className="text-sm font-bold text-orange-600 flex items-center gap-1 hover:underline"
              >
                <Plus size={15} /> Thêm dòng
              </button>
            </div>
            <div className="space-y-2">
              {draft.ingredients.map((ing, i) => (
                // Điện thoại: hàng 1 = tên · SL · đơn vị · xóa, hàng 2 = nhóm · công dụng. Máy tính: một hàng.
                <div
                  key={i}
                  className="grid grid-cols-[1fr_4.5rem_6.5rem_2.5rem] sm:grid-cols-[7rem_1.3fr_4.5rem_6.5rem_1.2fr_2.5rem] gap-2 items-center"
                >
                  <input
                    value={ing.group ?? ''}
                    onChange={(e) => setIngredient(i, 'group', e.target.value)}
                    list="ingredient-groups"
                    className={cn(input, 'h-10 text-sm px-2.5 row-start-2 col-start-1 sm:row-start-auto sm:col-start-auto')}
                    placeholder="Nhóm"
                    aria-label="Nhóm nguyên liệu"
                  />
                  <input
                    value={ing.name}
                    onChange={(e) => setIngredient(i, 'name', e.target.value)}
                    className={cn(input, 'h-10 text-sm row-start-1 col-start-1 sm:row-start-auto sm:col-start-auto')}
                    placeholder="Tên"
                    aria-label="Tên nguyên liệu"
                  />
                  <input
                    value={ing.amount}
                    onChange={(e) => setIngredient(i, 'amount', e.target.value)}
                    className={cn(input, 'h-10 text-sm px-2.5 row-start-1 col-start-2 sm:row-start-auto sm:col-start-auto')}
                    placeholder="SL"
                    aria-label="Số lượng"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) => setIngredient(i, 'unit', e.target.value)}
                    className={cn(input, 'h-10 text-sm px-2.5 row-start-1 col-start-3 sm:row-start-auto sm:col-start-auto')}
                    placeholder="Đơn vị"
                    aria-label="Đơn vị"
                  />
                  <input
                    value={ing.note ?? ''}
                    onChange={(e) => setIngredient(i, 'note', e.target.value)}
                    className={cn(
                      input,
                      'h-10 text-sm row-start-2 col-start-2 col-span-3 sm:row-start-auto sm:col-start-auto sm:col-span-1'
                    )}
                    placeholder="Công dụng / ghi chú"
                    aria-label="Công dụng"
                  />
                  <button
                    type="button"
                    onClick={() => set('ingredients', draft.ingredients.filter((_, idx) => idx !== i))}
                    disabled={draft.ingredients.length === 1}
                    className="w-10 h-10 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center disabled:opacity-30 row-start-1 col-start-4 sm:row-start-auto sm:col-start-auto"
                    aria-label="Xóa nguyên liệu"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <datalist id="ingredient-groups">
              {Array.from(new Set(draft.ingredients.map((i) => i.group?.trim()).filter(Boolean))).map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </fieldset>

          {/* ----- Các phần hướng dẫn ----- */}
          <fieldset>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-black text-neutral-900">Các bước / phần hướng dẫn</h3>
              <button
                type="button"
                onClick={() => set('sections', [...draft.sections, emptySection()])}
                className="text-sm font-bold text-orange-600 flex items-center gap-1 hover:underline"
              >
                <Plus size={15} /> Thêm phần
              </button>
            </div>
            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              Mỗi dòng là một đoạn. <code>- </code> gạch đầu dòng · <code>1. </code> bước đánh số · <code>### </code> tiêu đề nhỏ ·{' '}
              <code>&gt; </code> hoặc <code>Bí quyết:</code> để làm nổi bật · <code>| A | B |</code> bảng · <code>**chữ đậm**</code> ·{' '}
              <code>![mô tả](images/anh.jpg)</code> chèn ảnh. Ghi thời
              gian như "12–18 phút" sẽ thành nút hẹn giờ.
            </p>
            <div className="space-y-3">
              {draft.sections.map((s, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-600 text-white text-sm font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      value={s.title}
                      onChange={(e) => setSection(i, 'title', e.target.value)}
                      className={cn(input, 'h-10 font-bold bg-white')}
                      placeholder="Tiêu đề, vd: Nấu khoai tây"
                      aria-label={`Tiêu đề phần ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      className="w-9 h-9 rounded-lg hover:bg-white flex items-center justify-center disabled:opacity-30 shrink-0"
                      aria-label="Chuyển lên"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === draft.sections.length - 1}
                      className="w-9 h-9 rounded-lg hover:bg-white flex items-center justify-center disabled:opacity-30 shrink-0"
                      aria-label="Chuyển xuống"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => set('sections', draft.sections.filter((_, idx) => idx !== i))}
                      disabled={draft.sections.length === 1}
                      className="w-9 h-9 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center disabled:opacity-30 shrink-0"
                      aria-label="Xóa phần"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={s.content}
                    onChange={(e) => setSection(i, 'content', e.target.value)}
                    rows={Math.min(14, Math.max(4, s.content.split('\n').length + 1))}
                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm leading-relaxed"
                    placeholder={'1. Cho khoai vào nồi...\n2. Luộc khoảng 12–18 phút...\n\nBí quyết: ...'}
                    aria-label={`Nội dung phần ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-neutral-100 px-6 py-4 flex items-center gap-3">
          {error && <p className="text-sm font-semibold text-red-600 flex-1">{error}</p>}
          <button type="button" onClick={onClose} className="h-12 px-5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 font-bold ml-auto">
            Hủy
          </button>
          <button
            type="submit"
            className="h-12 px-6 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Save size={18} /> {isSauce ? 'Lưu gia vị' : 'Lưu món'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
