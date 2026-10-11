import React, { useState } from 'react';
import { Check, Lightbulb, Timer } from 'lucide-react';
import { useTimers } from '../TimerContext';
import { cn } from '../lib/utils';

// Trình hiển thị markdown rút gọn cho phần hướng dẫn nấu:
// "### Tiêu đề", "- gạch đầu dòng", "1. bước", "| bảng |" (hoặc dòng cách nhau bằng Tab),
// "> trích dẫn / Bí quyết", "Bí quyết: ...", **in đậm**. Thời lượng như "12–18 phút" thành nút hẹn giờ.

type ListItem = { n?: number; text: string };

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; label?: string; lines: string[] }
  | { type: 'ol'; items: ListItem[] }
  | { type: 'ul'; items: ListItem[] }
  | { type: 'table'; header: string[]; rows: string[][] };

const HEADING = /^#{1,6}\s+(.+)$/;
const OL = /^(\d+)[.)]\s+(.+)$/;
const UL = /^[-*•+]\s+(.+)$/;
const QUOTE = /^>\s?(.*)$/;
// "Bí quyết: ...", "**Bí quyết đầu bếp:** ...", "**Điểm quan trọng nhất**: ..."
const TIP_LABEL = /^(?:\*\*)?((?:Bí quyết|Mẹo|Lưu ý|Chú ý|Điểm quan trọng)[^:*\n]{0,30}?)\s*(?:\*\*)?\s*:\s*(?:\*\*)?\s*/i;
const CHECKBOX = /^\[[ xX✓✔]?\]\s*/;

const isTableLine = (raw: string) =>
  raw.trim().startsWith('|') || raw.split('\t').filter((c) => c.trim()).length >= 2;

const splitRow = (raw: string) => {
  const line = raw.trim();
  if (line.startsWith('|')) return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  return raw.split('\t').map((c) => c.trim());
};

const makeTip = (lines: string[]): Block => {
  const [first = '', ...rest] = lines;
  const m = first.match(TIP_LABEL);
  if (m) return { type: 'tip', label: m[1], lines: [first.slice(m[0].length), ...rest].filter((l) => l.trim()) };
  return { type: 'tip', lines: lines.filter((l) => l.trim()) };
};

export const parseBlocks = (content: string): Block[] => {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  const nextFilled = (from: number) => {
    let j = from;
    while (j < lines.length && !lines[j].trim()) j++;
    return j;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    if (isTableLine(lines[i])) {
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        const cells = splitRow(lines[i]);
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [header = [], ...body] = rows;
      blocks.push({ type: 'table', header, rows: body });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: 'heading', text: heading[1].replace(/:\s*$/, '') });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(QUOTE, '$1'));
        i++;
      }
      blocks.push(makeTip(quote));
      continue;
    }

    const ordered = OL.test(line);
    if (ordered || UL.test(line)) {
      const re = ordered ? OL : UL;
      const items: ListItem[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m = l.match(re);
        if (m && ordered && Number(m[1]) === 1 && items.length) break; // danh sách mới
        if (m) {
          items.push(ordered ? { n: Number(m[1]), text: m[2] } : { text: m[1].replace(CHECKBOX, '') });
          i++;
          continue;
        }
        // Dòng trống giữa các mục vẫn tính là cùng một danh sách (trừ khi danh sách mới bắt đầu lại từ 1)
        if (!l) {
          const j = nextFilled(i);
          const nm = j < lines.length ? lines[j].trim().match(re) : null;
          if (nm && (!ordered || Number(nm[1]) !== 1)) {
            i = j;
            continue;
          }
        }
        break;
      }
      blocks.push(ordered ? { type: 'ol', items } : { type: 'ul', items });
      continue;
    }

    if (TIP_LABEL.test(line)) {
      blocks.push(makeTip([line]));
      i++;
      continue;
    }

    blocks.push({ type: 'paragraph', text: line });
    i++;
  }
  return blocks;
};

// ---------- Thời lượng → nút hẹn giờ ----------

const TIME_RE = /(\d+(?:[.,/]\d+)?)(?:\s*[–—-]\s*(\d+(?:[.,/]\d+)?))?\s*(phút|giây|tiếng|giờ)(?!\p{L})/giu;
const UNIT_SECONDS: Record<string, number> = { giây: 1, phút: 60, tiếng: 3600, giờ: 3600 };

const toNumber = (s: string) => {
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : NaN;
  return Number(s.replace(',', '.'));
};

const TimerChip: React.FC<{ text: string; seconds: number; label: string }> = ({ text, seconds, label }) => {
  const { startTimer } = useTimers();
  const minutes = seconds / 60;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        startTimer(label ? `${label} · ${text}` : text, seconds);
      }}
      className="inline-flex items-center gap-1 align-baseline px-2 py-0.5 mx-0.5 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold text-[0.92em] leading-snug transition-colors active:scale-95 print:bg-transparent print:p-0"
      title={`Bấm để hẹn giờ ${minutes >= 1 ? `${+minutes.toFixed(1)} phút` : `${seconds} giây`}`}
    >
      <Timer size={13} className="shrink-0 print:hidden" />
      {text}
    </button>
  );
};

const withTimers = (text: string, label: string, key: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let last = 0;
  TIME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TIME_RE.exec(text))) {
    if (m.index > 0 && /\p{L}/u.test(text[m.index - 1])) continue;
    const value = toNumber(m[1]);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <TimerChip
        key={`${key}-t${m.index}`}
        text={m[0]}
        seconds={Math.round(value * UNIT_SECONDS[m[3].toLowerCase()])}
        label={label}
      />
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

export const Inline: React.FC<{ text: string; timerLabel?: string; timers?: boolean }> = ({
  text,
  timerLabel = '',
  timers = true,
}) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, idx) => {
        const nodes = timers ? withTimers(part, timerLabel, String(idx)) : [part];
        return idx % 2 === 1 ? (
          <strong key={idx} className="font-bold text-neutral-900">
            {nodes}
          </strong>
        ) : (
          <React.Fragment key={idx}>{nodes}</React.Fragment>
        );
      })}
    </>
  );
};

// ---------- Hiển thị ----------

interface MarkdownProps {
  content: string;
  timerLabel?: string;
  interactive?: boolean; // Chạm vào từng mục để đánh dấu đã làm
  large?: boolean;
}

export const Markdown: React.FC<MarkdownProps> = ({ content, timerLabel = '', interactive = false, large = false }) => {
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const blocks = parseBlocks(content);

  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const text = large ? 'text-lg md:text-xl' : 'text-[15px] md:text-base';

  const renderItems = (block: Extract<Block, { type: 'ol' | 'ul' }>, bi: number) =>
    block.items.map((item, ii) => {
      const key = `${bi}:${ii}`;
      const isDone = done.has(key);
      return (
        <li
          key={key}
          onClick={interactive ? () => toggle(key) : undefined}
          className={cn(
            'flex gap-3 rounded-xl transition-colors',
            interactive && 'cursor-pointer -mx-2 px-2 py-1.5 hover:bg-orange-50/70 select-none',
            isDone && 'text-neutral-400'
          )}
        >
          {block.type === 'ol' ? (
            <span
              className={cn(
                'shrink-0 rounded-full flex items-center justify-center font-bold transition-colors',
                large ? 'w-9 h-9 text-base' : 'w-7 h-7 text-sm',
                isDone ? 'bg-emerald-500 text-white' : 'bg-orange-100 text-orange-700'
              )}
            >
              {isDone ? <Check size={large ? 18 : 15} strokeWidth={3} /> : item.n ?? ii + 1}
            </span>
          ) : interactive ? (
            <span
              className={cn(
                'shrink-0 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors',
                large ? 'w-6 h-6 mt-1' : 'w-5 h-5',
                isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-orange-300 bg-white'
              )}
            >
              {isDone && <Check size={13} strokeWidth={3} />}
            </span>
          ) : (
            <span className="shrink-0 mt-[0.6em] w-1.5 h-1.5 rounded-full bg-orange-400" />
          )}
          <span className={cn('leading-relaxed', block.type === 'ol' && (large ? 'pt-1' : 'pt-0.5'), isDone && 'line-through decoration-neutral-300')}>
            <Inline text={item.text} timerLabel={timerLabel} />
          </span>
        </li>
      );
    });

  return (
    <div className={cn('space-y-4 text-neutral-700', text)}>
      {blocks.map((block, bi) => {
        switch (block.type) {
          case 'heading':
            return (
              <h4 key={bi} className="flex items-center gap-2 font-bold text-neutral-900 pt-2">
                <span className="w-1.5 h-[1.1em] rounded-full bg-orange-500" />
                <Inline text={block.text} timers={false} />
              </h4>
            );
          case 'paragraph':
            return (
              <p key={bi} className="leading-relaxed">
                <Inline text={block.text} timerLabel={timerLabel} />
              </p>
            );
          case 'tip':
            return (
              <div key={bi} className="flex gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-950/85">
                <Lightbulb size={large ? 22 : 18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5 leading-relaxed">
                  {block.lines.map((l, li) => (
                    <p key={li}>
                      {li === 0 && block.label && <strong className="font-bold text-amber-800">{block.label}: </strong>}
                      <Inline text={l} timerLabel={timerLabel} />
                    </p>
                  ))}
                </div>
              </div>
            );
          case 'ol':
            return (
              <ol key={bi} className="space-y-2.5">
                {renderItems(block, bi)}
              </ol>
            );
          case 'ul':
            return (
              <ul key={bi} className="space-y-1.5">
                {renderItems(block, bi)}
              </ul>
            );
          case 'table':
            return (
              <div key={bi} className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
                <table className="w-full text-left text-[0.95em]">
                  {block.header.length > 0 && (
                    <thead className="bg-orange-50 text-orange-900">
                      <tr>
                        {block.header.map((h, hi) => (
                          <th key={hi} className="px-4 py-2.5 font-bold whitespace-nowrap">
                            <Inline text={h} timers={false} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-neutral-100 even:bg-neutral-50/70">
                        {row.map((cell, ci) => (
                          <td key={ci} className={cn('px-4 py-2.5 align-top', ci === 0 && 'font-semibold text-neutral-900')}>
                            <Inline text={cell} timerLabel={timerLabel} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
};
