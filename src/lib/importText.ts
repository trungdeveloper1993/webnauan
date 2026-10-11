import { Ingredient, Recipe, RecipeSection } from '../types';
import { guessEmoji, MEAL_TIMES } from './recipe';
import { splitGraphemes } from './utils';

// Đọc công thức dán vào dạng văn bản, ví dụ:
//   NGÀY 1 — KHOAI TÂY LUỘC ...            (hoặc "🍤 Ngày 2 — Tôm bơ tỏi ...")
//   Phong cách: ... / Thời gian: ... / Độ khó: 1/5 / Khẩu phần: 1 người
//   (hoặc các dòng không nhãn: "Dễ làm · 2/5", "25–35 phút", "1 người ăn")
//   1. Danh sách nguyên liệu   (bảng: Tên <Tab> Khối lượng <Tab> Công dụng,
//                               hoặc nhóm "Tôm bơ tỏi" + các dòng "- Tôm tươi: 200 g")
//   2. Bước 1 — Chuẩn bị ...   (các phần đánh số 1, 2, 3...)
// Hỗ trợ cả bản copy dạng markdown (## tiêu đề, bảng | ... |, **Bí quyết:**).
// Bỏ qua các dòng thừa khi copy từ trang chat: tên miền nguồn ảnh, số đếm ảnh, "0/5"...

export type ParsedRecipe = Partial<Omit<Recipe, 'id'>>;

export interface ParseResult {
  recipe: ParsedRecipe;
  found: string[];
  warnings: string[];
}

const TITLE_RE = /^ngày\s*(\d+)\s*[—–:.\-]+\s*(.+)$/i;
const META_RE = /^(Phong cách|Thời gian|Độ khó|Khẩu phần|Bữa ăn|Phân loại|Emoji|Ảnh)\s*:\s*(.+)$/i;
const NUMBERED_RE = /^(\d+)[.)]\s+(.+)$/;
const MD_HEADING_RE = /^(#{1,6})\s+(.+)$/;
const KEYWORD_HEADER_RE =
  /^(danh sách nguyên liệu|nguyên liệu|chuẩn bị|sơ chế|cách làm|cách nấu|thực hiện|các bước|hướng dẫn|trình bày|thành phẩm|bí quyết|mẹo|lưu ý)\b/i;
// "Bí quyết: ...", "Bí quyết đầu bếp: ...", "Điểm quan trọng nhất: ..."
const TIP_RE = /^((?:Bí quyết|Mẹo|Lưu ý|Chú ý|Điểm quan trọng)[^:]{0,30}?)\s*:\s*(.+)$/i;
const QTY_RE = /^(\d+(?:[.,/]\d+)?(?:\s*[–-]\s*\d+(?:[.,/]\d+)?)?)\s*(.*)$/;
const CHECKBOX_RE = /^(?:[-*•]\s*)?\[[ xX✓✔]?\]\s*(.+)$/;
const DOMAIN_RE = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?$/i;
const PROGRESS_RE = /^\d+\s*\/\s*\d+$/;
// Lời nhắn của trợ lý trong khung chat, không phải nội dung công thức
const CHAT_RE = /cho (tôi|mình) biết/i;

// Dòng rác khi copy: tên miền nguồn ảnh, số đếm ảnh ("6"), tiến độ "0/5", lời nhắn chat
const cleanLines = (lines: string[]) => {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (DOMAIN_RE.test(line) || /^\d+$/.test(line) || CHAT_RE.test(line)) continue;
    if (PROGRESS_RE.test(line)) {
      // bỏ luôn dòng "Tiến độ ..." đi kèm ngay trước đó
      for (let j = out.length - 1; j >= 0; j--) {
        if (!out[j].trim()) continue;
        if (/^tiến độ/i.test(out[j].trim())) out.splice(j, 1);
        break;
      }
      continue;
    }
    out.push(raw);
  }
  return out;
};

const stripMd = (s: string) => s.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
const stripEndPunct = (s: string) => s.replace(/[.;,\s]+$/, '').trim();
const isAllCaps = (s: string) => {
  const letters = s.replace(/[^\p{L}]/gu, '');
  return letters.length > 3 && letters === letters.toLocaleUpperCase('vi');
};
const sentenceCase = (s: string) => {
  if (!isAllCaps(s)) return s;
  const lower = s.toLocaleLowerCase('vi');
  return lower.charAt(0).toLocaleUpperCase('vi') + lower.slice(1);
};
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

const isTabRow = (raw: string) => raw.split('\t').filter((c) => c.trim()).length >= 2;
const isPipeRow = (raw: string) => raw.trim().startsWith('|');
const splitCells = (raw: string) =>
  isPipeRow(raw)
    ? raw.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    : raw.split('\t').map((c) => c.trim());
const isSeparatorRow = (cells: string[]) => cells.every((c) => /^:?-{2,}:?$/.test(c));

export const splitQuantity = (qty: string): Pick<Ingredient, 'amount' | 'unit'> => {
  const q = stripEndPunct(qty);
  const m = q.match(QTY_RE);
  return m ? { amount: m[1].replace(/\s+/g, ''), unit: m[2].trim() } : { amount: q, unit: '' };
};

const parseIngredients = (lines: string[]): { ingredients: Ingredient[]; rest: string[] } => {
  const ingredients: Ingredient[] = [];
  const rest: string[] = [];
  let headerSkipped = false;
  let group = '';
  const withGroup = (ing: Ingredient): Ingredient => (group ? { ...ing, group } : ing);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (isTabRow(raw) || isPipeRow(raw)) {
      const cells = splitCells(raw).map(stripMd);
      if (isSeparatorRow(cells)) continue;
      if (!headerSkipped && /nguyên liệu|tên|thành phần/i.test(cells[0]) && !/\d/.test(cells[1] ?? '')) {
        headerSkipped = true;
        continue;
      }
      const [name, qty = '', note = ''] = cells;
      if (name) ingredients.push(withGroup({ name, ...splitQuantity(qty), ...(note ? { note: stripEndPunct(note) } : {}) }));
      continue;
    }
    const bullet = line.match(/^[-*•+]\s+(.+)$/);
    if (bullet) {
      const text = stripMd(bullet[1]);
      // "- Khoai tây: 250 g" hoặc "- Khoai tây – 250 g"
      const parts = text.split(/\s*(?::|\s[–-]\s)\s*/, 2);
      const prev = ingredients[ingredients.length - 1];
      // Câu giải thích không có lượng (vd "- Chọn đùi gà nếu muốn thịt mềm hơn.") là ghi chú của nguyên liệu ngay trên
      if (parts.length === 1 && prev && (prev.group ?? '') === group && (/[.!?]$/.test(text) || wordCount(text) >= 6)) {
        prev.note = [prev.note, stripEndPunct(text)].filter(Boolean).join('. ');
        continue;
      }
      const [name, qty = ''] = parts;
      ingredients.push(withGroup({ name: stripEndPunct(name), ...splitQuantity(qty) }));
      continue;
    }
    // Dòng ngắn không có dấu câu (vd "Tôm bơ tỏi", "Sốt chanh:") là tên nhóm nguyên liệu
    const plain = stripMd(line);
    if (plain.length <= 40 && !/[.!?;,]$/.test(plain)) {
      group = plain.replace(/:$/, '').trim();
      continue;
    }
    rest.push(raw);
  }
  return { ingredients, rest };
};

// Chuyển nội dung một phần sang markdown rút gọn mà trang web hiển thị được
const toMarkdown = (lines: string[]): string => {
  const out: string[] = [];
  let prev: string | null = null;
  const push = (kind: string, text: string, joinWithPrev = false) => {
    if (prev && !joinWithPrev) out.push('');
    out.push(text);
    prev = kind;
  };
  const nextFilled = (from: number) => lines.slice(from + 1).find((l) => l.trim()) ?? '';

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      if (prev === 'table') prev = 'table-end';
      return;
    }

    if (isTabRow(raw) || isPipeRow(raw)) {
      const cells = splitCells(raw);
      if (isPipeRow(raw) && isSeparatorRow(cells)) {
        if (prev === 'table') out.push(line);
        return;
      }
      const row = `| ${cells.join(' | ')} |`;
      if (prev === 'table') {
        push('table', row, true);
      } else {
        push('table', row);
        if (!isPipeRow(raw) || !/^\|\s*:?-{2,}/.test(nextFilled(i).trim())) {
          out.push(`|${cells.map(() => '---').join('|')}|`);
        }
      }
      return;
    }

    const heading = line.match(MD_HEADING_RE);
    if (heading) return push('heading', `### ${stripMd(heading[2]).replace(/:$/, '')}`);

    if (line.startsWith('>')) return push('quote', line);

    const numbered = line.match(NUMBERED_RE);
    if (numbered) {
      const restart = prev === 'ol' && Number(numbered[1]) === 1;
      return push('ol', `${numbered[1]}. ${numbered[2]}`, prev === 'ol' && !restart);
    }

    // "[ ] việc cần làm" (checklist) → gạch đầu dòng, trên web vẫn tick được
    const bullet = line.match(CHECKBOX_RE) ?? line.match(/^[-*•+]\s+(.+)$/);
    if (bullet) return push('ul', `- ${bullet[1]}`, prev === 'ul');

    const plain = stripMd(line);
    const tip = plain.match(TIP_RE);
    if (tip) return push('quote', `> **${tip[1]}:** ${tip[2]}`);
    // "Lưu ý không đun mật ong quá lâu..." (không có dấu hai chấm) → khung lưu ý
    if (/^(Lưu ý|Chú ý)\s+\S/i.test(plain) && plain.length > 20) return push('quote', `> ${plain}`);

    // "Tôm:", "Cách pha:", "Thời gian tham khảo:" → tiêu đề nhỏ
    if (/:$/.test(plain) && wordCount(plain) <= 4) return push('heading', `### ${plain.replace(/:$/, '')}`);

    // Dòng ngắn không có dấu câu, theo sau là nội dung → tiêu đề nhỏ (vd "Cách A — Giữ nguyên vị Việt Nam")
    if (plain.length <= 60 && !/[.!?…,;:)]$/.test(plain) && nextFilled(i) && line === plain) {
      return push('heading', `### ${plain}`);
    }

    push('p', line);
  });

  return out.join('\n').trim();
};

const MEAL_ALIASES: [RegExp, string][] = [
  [/sáng/i, 'Bữa sáng'],
  [/trưa/i, 'Bữa trưa'],
  [/tối|chiều/i, 'Bữa tối'],
  [/vặt|xế/i, 'Đồ ăn vặt'],
];

export const parseRecipeText = (input: string): ParseResult => {
  const lines = input
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\u200c\ufeff]/g, '') // gi\u1eef \u200d v\u00ec emoji gh\u00e9p c\u1ea7n n\u00f3
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''));

  const recipe: ParsedRecipe = {};
  const found: string[] = [];
  const warnings: string[] = [];

  const titleIndex = lines.findIndex((l) => l.trim());
  if (titleIndex === -1) return { recipe, found, warnings: ['Chưa có nội dung để phân tích.'] };

  // ----- Tiêu đề (có thể bắt đầu bằng emoji, vd "🍤 Ngày 2 — ...") -----
  const rawTitle = stripMd(lines[titleIndex]);
  const lead = rawTitle.match(/^[^\p{L}\p{N}]+/u)?.[0] ?? '';
  const leadEmoji = /\p{Extended_Pictographic}/u.test(lead) ? lead.replace(/\s+/g, '') : '';
  const title = rawTitle.slice(lead.length).trim();
  const titleMatch = title.match(TITLE_RE);
  if (titleMatch) {
    recipe.day = Number(titleMatch[1]);
    recipe.name = sentenceCase(stripEndPunct(titleMatch[2]));
  } else {
    recipe.name = sentenceCase(stripEndPunct(title));
    warnings.push('Không thấy "NGÀY X — ..." ở dòng đầu, hãy tự điền số ngày.');
  }

  const body = cleanLines(lines.slice(titleIndex + 1));

  // ----- Xác định cách đánh dấu các phần -----
  const mdLevels = body
    .map((l) => l.trim().match(MD_HEADING_RE)?.[1].length)
    .filter((n): n is number => Boolean(n));
  const sectionLevel = mdLevels.length ? Math.min(...mdLevels) : 0;
  // Có dòng "1. Tiêu đề" (ngắn, không kết thúc bằng dấu chấm) → các phần được đánh số
  const hasNumbered =
    !sectionLevel &&
    body.some((l) => {
      const m = stripMd(l.trim()).match(NUMBERED_RE);
      return m?.[1] === '1' && !/[.!;,]$/.test(m[2].trim()) && m[2].trim().length <= 80;
    });

  const sections: { title: string; lines: string[] }[] = [];
  const descLines: string[] = [];
  let expected = 1;
  let lastItem = 0;

  const headerTitle = (line: string): string | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (sectionLevel) {
      const m = trimmed.match(MD_HEADING_RE);
      if (m && m[1].length === sectionLevel) return stripMd(m[2]).replace(/^\d+[.)]\s+/, '');
      return null;
    }
    const plain = stripMd(trimmed);
    if (hasNumbered) {
      const m = plain.match(NUMBERED_RE);
      if (!m || Number(m[1]) !== expected) return null;
      const t = m[2].trim();
      const continuesList = lastItem === expected - 1 && lastItem > 0;
      // Bước nấu thường kết thúc bằng dấu chấm; tiêu đề thì không (có thể là câu hỏi)
      if (/[.!;,]$/.test(t) || t.length > (continuesList ? 50 : 80)) return null;
      return t;
    }
    if (KEYWORD_HEADER_RE.test(plain) && plain.length <= 40 && !/[.!?]$/.test(plain) && !/:\s*\S/.test(plain)) {
      return plain.replace(/:$/, '');
    }
    return null;
  };

  for (const raw of body) {
    const t = headerTitle(raw);
    if (t !== null) {
      // "Bước 1 — Làm khoai tây nghiền" → "Làm khoai tây nghiền" (web đã tự đánh số)
      sections.push({ title: sentenceCase(t.replace(/^Bước\s*\d+\s*[—–:.\-]+\s*/i, '')), lines: [] });
      expected++;
      lastItem = 0;
      continue;
    }

    const item = stripMd(raw.trim()).match(NUMBERED_RE);
    if (item) lastItem = Number(item[1]);

    if (!sections.length) {
      const meta = stripMd(raw.trim().replace(/^[-*•]\s+/, '')).match(META_RE);
      if (meta) {
        const key = meta[1].toLocaleLowerCase('vi');
        const value = stripEndPunct(meta[2]);
        if (key === 'phong cách') recipe.style = value;
        else if (key === 'thời gian') recipe.time = value.replace(/^(khoảng|tầm|chừng)\s+/i, '');
        else if (key === 'độ khó') {
          const d = value.match(/\d/);
          if (d) recipe.difficulty = Math.min(5, Math.max(1, Number(d[0])));
        } else if (key === 'khẩu phần') recipe.servings = value;
        else if (key === 'bữa ăn') recipe.mealTime = MEAL_ALIASES.find(([re]) => re.test(value))?.[1] ?? MEAL_TIMES[1];
        else if (key === 'phân loại') recipe.category = value;
        else if (key === 'emoji') recipe.emoji = value;
        else if (key === 'ảnh') recipe.thumbnail = value;
        continue;
      }
      // Dòng thông tin không có nhãn: "Dễ làm · 2/5", "25–35 phút", "1 người ăn"
      const plain = stripEndPunct(stripMd(raw.trim()));
      if (plain.length <= 30) {
        const difficulty = plain.match(/(\d)\s*\/\s*5\b/);
        if (difficulty) {
          recipe.difficulty = Math.min(5, Math.max(1, Number(difficulty[1])));
          continue;
        }
        if (/^(khoảng\s+)?\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*(phút|giờ|tiếng)$/i.test(plain)) {
          recipe.time = plain.replace(/^khoảng\s+/i, '');
          continue;
        }
        const servings = plain.match(/^(\d+(?:\s*[–-]\s*\d+)?)\s*người(?:\s*ăn)?$/i);
        if (servings) {
          recipe.servings = `${servings[1]} người`;
          continue;
        }
      }
      if (raw.trim()) descLines.push(stripMd(raw.trim()));
      continue;
    }
    sections[sections.length - 1].lines.push(raw);
  }

  if (descLines.length) recipe.description = descLines.join(' ');

  // ----- Nguyên liệu -----
  const ingIndex = sections.findIndex((s) => /nguyên liệu|thành phần/i.test(s.title));
  if (ingIndex !== -1) {
    const { ingredients, rest } = parseIngredients(sections[ingIndex].lines);
    if (ingredients.length) {
      recipe.ingredients = ingredients;
      if (rest.some((l) => l.trim())) sections[ingIndex] = { ...sections[ingIndex], lines: rest };
      else sections.splice(ingIndex, 1);
    }
  }
  if (!recipe.ingredients?.length) warnings.push('Chưa nhận ra bảng nguyên liệu, hãy kiểm tra lại phần Nguyên liệu.');

  const parsedSections: RecipeSection[] = sections
    .map((s) => ({ title: s.title, content: toMarkdown(s.lines) }))
    .filter((s) => s.title || s.content);
  if (parsedSections.length) recipe.sections = parsedSections;
  else warnings.push('Chưa tách được các bước, nội dung sẽ cần nhập tay.');

  if (!recipe.emoji) {
    // Ưu tiên emoji ở đầu tiêu đề, thêm vài emoji đoán từ tên món
    const guessed = splitGraphemes(guessEmoji(recipe.name ?? '')).filter((e) => e !== '🍳');
    const lead = splitGraphemes(leadEmoji);
    recipe.emoji = [...lead, ...guessed.filter((e) => !lead.includes(e))].slice(0, 4).join('') || '🍳';
  }

  if (recipe.day) found.push(`Ngày ${recipe.day}`);
  if (recipe.difficulty) found.push(`Độ khó ${recipe.difficulty}/5`);
  if (recipe.time) found.push(recipe.time);
  if (recipe.servings) found.push(recipe.servings);
  if (recipe.ingredients?.length) found.push(`${recipe.ingredients.length} nguyên liệu`);
  if (recipe.sections?.length) found.push(`${recipe.sections.length} phần hướng dẫn`);

  return { recipe, found, warnings };
};
