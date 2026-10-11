import { Ingredient, Recipe, RecipeSection } from '../types';
import { makeId } from './utils';

export const TOTAL_DAYS = 100;

export const MEAL_TIMES = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Đồ ăn vặt'];

export const CATEGORY_SUGGESTIONS = [
  'Món luộc',
  'Món áp chảo',
  'Món mặn',
  'Món xào',
  'Món chiên',
  'Món kho',
  'Món hấp',
  'Món nướng',
  'Món canh',
  'Món nước',
  'Món lẩu',
  'Món cơm',
  'Món trộn',
  'Tráng miệng',
  'Món khác',
];

export const DIFFICULTY_LABELS = ['', 'Rất dễ', 'Dễ', 'Trung bình', 'Khó', 'Thử thách'];

// 5 chặng của hành trình, mỗi chặng 20 ngày
export const STAGES = [
  { from: 1, to: 20, name: 'Làm quen' },
  { from: 21, to: 40, name: 'Cơ bản' },
  { from: 41, to: 60, name: 'Thành thạo' },
  { from: 61, to: 80, name: 'Nâng cao' },
  { from: 81, to: 100, name: 'Đầu bếp' },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

const normalizeIngredient = (raw: any): Ingredient => ({
  name: str(raw?.name),
  amount: str(raw?.amount),
  unit: str(raw?.unit),
  ...(str(raw?.note) ? { note: str(raw.note) } : {}),
  ...(str(raw?.group) ? { group: str(raw.group) } : {}),
});

// Dữ liệu kiểu cũ (steps + method) vẫn hiển thị được dưới dạng các phần hướng dẫn
const legacySections = (raw: any): RecipeSection[] => {
  const sections: RecipeSection[] = [];
  if (Array.isArray(raw?.steps) && raw.steps.length) {
    sections.push({
      title: 'Các bước thực hiện',
      content: raw.steps.map((s: string, i: number) => `${i + 1}. ${str(s).replace(/\n+/g, ' ')}`).join('\n'),
    });
  }
  if (str(raw?.method)) {
    sections.push({ title: 'Bí quyết', content: `> ${str(raw.method)}` });
  }
  return sections;
};

export const normalizeRecipe = (raw: any, index = 0): Recipe => {
  const day = Number(raw?.day);
  const sections: RecipeSection[] = Array.isArray(raw?.sections)
    ? raw.sections
        .map((s: any) => ({ title: str(s?.title), content: str(s?.content) }))
        .filter((s: RecipeSection) => s.title || s.content)
    : legacySections(raw);

  return {
    id: str(raw?.id) || makeId(),
    day: Number.isFinite(day) && day > 0 ? Math.floor(day) : index + 1,
    name: str(raw?.name) || 'Món chưa đặt tên',
    emoji: str(raw?.emoji) || undefined,
    thumbnail: str(raw?.thumbnail) || undefined,
    description: str(raw?.description),
    style: str(raw?.style) || undefined,
    time: str(raw?.time) || undefined,
    difficulty: clamp(Math.round(Number(raw?.difficulty) || 1), 1, 5),
    servings: str(raw?.servings) || undefined,
    category: str(raw?.category) || undefined,
    mealTime: str(raw?.mealTime) || undefined,
    ingredients: Array.isArray(raw?.ingredients)
      ? raw.ingredients.map(normalizeIngredient).filter((i: Ingredient) => i.name)
      : [],
    sections,
  };
};

export const sortByDay = (recipes: Recipe[]) => [...recipes].sort((a, b) => a.day - b.day || a.name.localeCompare(b.name, 'vi'));

// ---------- Emoji gợi ý từ tên món ----------

// Khớp theo cả âm tiết để "cá" không dính vào "các"
const word = (alts: string) => new RegExp(`(^|[^\\p{L}])(${alts})(?!\\p{L})`, 'iu');

const EMOJI_RULES: [RegExp, string][] = [
  [word('khoai'), '🥔'],
  [word('tôm'), '🍤'],
  [word('trứng'), '🥚'],
  [word('bông cải|súp lơ|rau|cải'), '🥦'],
  [word('cà rốt'), '🥕'],
  [word('cà chua'), '🍅'],
  [word('gà'), '🍗'],
  [word('bò'), '🥩'],
  [word('heo|lợn|ba chỉ|sườn|thịt'), '🥓'],
  [word('cá|mực|hải sản'), '🐟'],
  [word('cua|ghẹ'), '🦀'],
  [word('cơm|xôi'), '🍚'],
  [word('phở|bún|mì|miến|hủ tiếu'), '🍜'],
  [word('canh|súp|cháo'), '🥣'],
  [word('lẩu'), '🍲'],
  [word('đậu'), '🫘'],
  [word('nấm'), '🍄'],
  [word('chanh'), '🍋'],
  [word('bánh mì'), '🥖'],
  [word('chè|kem'), '🍮'],
  [word('salad|gỏi|nộm'), '🥗'],
];

// Xếp theo vị trí xuất hiện trong tên: món chính thường đứng đầu ("Cá hấp... + cơm + canh...")
export const guessEmoji = (text: string) => {
  const found: { emoji: string; at: number }[] = [];
  for (const [re, emoji] of EMOJI_RULES) {
    const m = re.exec(text);
    if (m && !found.some((f) => f.emoji === emoji)) found.push({ emoji, at: m.index });
  }
  return (
    found
      .sort((a, b) => a.at - b.at)
      .slice(0, 4)
      .map((f) => f.emoji)
      .join('') || '🍳'
  );
};

// ---------- Khẩu phần & định lượng ----------

export const parseServings = (servings?: string): number | null => {
  const m = servings?.match(/\d+/);
  return m ? Number(m[0]) : null;
};

const parseNumber = (s: string): number | null => {
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const FRACTIONS: [number, string][] = [
  [0.25, '1/4'],
  [1 / 3, '1/3'],
  [0.5, '1/2'],
  [2 / 3, '2/3'],
  [0.75, '3/4'],
];

const formatNumber = (n: number) => {
  const whole = Math.floor(n);
  const rest = n - whole;
  if (rest < 0.05) return String(whole);
  if (rest > 0.95) return String(whole + 1);
  for (const [value, label] of FRACTIONS) {
    if (Math.abs(rest - value) < 0.04) return whole ? `${whole} ${label}` : label;
  }
  return n.toFixed(1).replace('.', ',');
};

// "250" × 2 → "500", "1/2" × 3 → "1 1/2", "2–3" × 2 → "4–6", "Vừa đủ" giữ nguyên
export const scaleAmount = (amount: string, factor: number) => {
  if (factor === 1 || !amount) return amount;
  const range = amount.match(/^\s*([\d.,/ ]+?)\s*([–-])\s*([\d.,/ ]+?)\s*$/);
  if (range) {
    const a = parseNumber(range[1].trim());
    const b = parseNumber(range[3].trim());
    if (a != null && b != null) return `${formatNumber(a * factor)}${range[2]}${formatNumber(b * factor)}`;
  }
  const n = parseNumber(amount.trim());
  return n == null ? amount : formatNumber(n * factor);
};

// "Chiên thịt — 8–12 phút" → "Chiên thịt" (nhãn cho hộp hẹn giờ, tránh lặp thời gian)
export const stripDuration = (title: string) =>
  title.replace(/\s*[—–:-]\s*(khoảng\s+)?\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*(phút|giây|tiếng|giờ)\s*$/i, '').trim() || title;

// Bỏ dấu "—" trước thời gian ở cuối tiêu đề vì thời gian hiện thành nút hẹn giờ: "Chiên thịt [8–12 phút]"
export const displayTitle = (title: string) =>
  title.replace(/\s*[—–]\s*(?=(khoảng\s+)?\d[\d.,/–-]*\s*(phút|giây|tiếng|giờ)\s*$)/i, ' ');

export const formatIngredientAmount = (ing: Ingredient, factor = 1) =>
  [scaleAmount(ing.amount, factor), ing.unit].filter(Boolean).join(' ');
