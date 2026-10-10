import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function makeId() {
  return Math.random().toString(36).slice(2, 11);
}

// localStorage có thể bị chặn (chế độ ẩn danh, trình duyệt cũ) nên luôn bọc try/catch
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Bỏ qua: hết dung lượng hoặc bị chặn
  }
}

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// Tách chuỗi emoji thành từng ký tự hiển thị (giữ nguyên emoji ghép như 👨‍🍳)
export function splitGraphemes(str: string): string[] {
  const Segmenter = (Intl as any).Segmenter;
  if (Segmenter) {
    const seg = new Segmenter('vi', { granularity: 'grapheme' });
    return Array.from(seg.segment(str), (s: any) => s.segment as string).filter((s) => s.trim());
  }
  return Array.from(str).filter((s) => s.trim());
}

export function localDateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
