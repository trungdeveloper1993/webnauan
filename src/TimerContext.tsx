import React, { createContext, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, Pause, Play, Plus, Timer, X } from 'lucide-react';
import { makeId } from './lib/utils';

interface KitchenTimer {
  id: string;
  label: string;
  durationMs: number;
  endsAt: number; // dùng khi đang chạy
  remainingMs: number; // dùng khi tạm dừng
  status: 'running' | 'paused' | 'done';
  alerts: number;
  lastAlertAt: number;
}

interface TimerContextType {
  timers: KitchenTimer[];
  startTimer: (label: string, seconds: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// ---------- Âm báo (Web Audio, không cần file âm thanh) ----------

let audioCtx: AudioContext | null = null;

const unlockAudio = () => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    // Trình duyệt không hỗ trợ âm thanh
  }
};

const playAlarm = () => {
  try {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = t0 + i * 0.28;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1175 : 880;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    }
  } catch {
    // Bỏ qua lỗi phát âm thanh
  }
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {
    // Thiết bị không rung được
  }
};

const ALERT_EVERY_MS = 5000;
const MAX_ALERTS = 12;

export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timers, setTimers] = useState<KitchenTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const active = timers.some((t) => t.status !== 'paused');

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);

  // Chuyển sang "hết giờ" và nhắc lại âm báo cho đến khi người dùng tắt
  useEffect(() => {
    let shouldAlert = false;
    let changed = false;
    const next = timers.map((t) => {
      if (t.status === 'running' && t.endsAt <= now) {
        shouldAlert = true;
        changed = true;
        return { ...t, status: 'done' as const, alerts: 1, lastAlertAt: now };
      }
      if (t.status === 'done' && t.alerts < MAX_ALERTS && now - t.lastAlertAt >= ALERT_EVERY_MS) {
        shouldAlert = true;
        changed = true;
        return { ...t, alerts: t.alerts + 1, lastAlertAt: now };
      }
      return t;
    });
    if (changed) setTimers(next);
    if (shouldAlert) playAlarm();
  }, [now, timers]);

  const startTimer = (label: string, seconds: number) => {
    unlockAudio();
    const durationMs = Math.round(seconds * 1000);
    const at = Date.now();
    setNow(at);
    setTimers((prev) => [
      ...prev,
      {
        id: makeId(),
        label,
        durationMs,
        endsAt: at + durationMs,
        remainingMs: durationMs,
        status: 'running',
        alerts: 0,
        lastAlertAt: 0,
      },
    ]);
  };

  const update = (id: string, fn: (t: KitchenTimer) => KitchenTimer | null) =>
    setTimers((prev) =>
      prev.flatMap((t) => {
        if (t.id !== id) return [t];
        const next = fn(t);
        return next ? [next] : [];
      })
    );

  const togglePause = (id: string) =>
    update(id, (t) => {
      if (t.status === 'running') return { ...t, status: 'paused', remainingMs: Math.max(0, t.endsAt - Date.now()) };
      if (t.status === 'paused') return { ...t, status: 'running', endsAt: Date.now() + t.remainingMs };
      return t;
    });

  const addMinute = (id: string) =>
    update(id, (t) => {
      if (t.status === 'paused') return { ...t, remainingMs: t.remainingMs + 60000, durationMs: t.durationMs + 60000 };
      const base = t.status === 'done' ? Date.now() : t.endsAt;
      return { ...t, status: 'running', endsAt: base + 60000, durationMs: t.durationMs + 60000, alerts: 0 };
    });

  const remove = (id: string) => update(id, () => null);

  return (
    <TimerContext.Provider value={{ timers, startTimer }}>
      {children}
      <TimerDock timers={timers} now={now} onToggle={togglePause} onAddMinute={addMinute} onRemove={remove} />
    </TimerContext.Provider>
  );
};

const TimerDock: React.FC<{
  timers: KitchenTimer[];
  now: number;
  onToggle: (id: string) => void;
  onAddMinute: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ timers, now, onToggle, onAddMinute, onRemove }) => (
  <div
    className="fixed z-[70] left-4 right-4 sm:left-auto sm:w-80 flex flex-col gap-2 pointer-events-none print:hidden transition-[bottom]"
    // Chế độ nấu đặt --timer-offset để hộp hẹn giờ không che các nút điều hướng
    style={{ bottom: 'calc(1rem + var(--timer-offset, 0px))' }}
  >
    <AnimatePresence initial={false}>
      {timers.map((t) => {
        const remaining = t.status === 'running' ? t.endsAt - now : t.status === 'paused' ? t.remainingMs : 0;
        const progress = t.durationMs ? 1 - Math.max(0, remaining) / t.durationMs : 1;
        const done = t.status === 'done';
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl shadow-2xl border ${
              done ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-neutral-900 border-neutral-800 text-white'
            }`}
            role="timer"
            aria-live={done ? 'assertive' : 'off'}
          >
            {!done && (
              <div
                className="absolute inset-y-0 left-0 bg-orange-600/30 transition-[width] duration-300"
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            )}
            <div className="relative flex items-center gap-3 p-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-white/20' : 'bg-orange-600'}`}>
                {done ? <BellRing size={20} /> : <Timer size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-xl tabular-nums leading-none">
                  {done ? 'Hết giờ!' : formatClock(remaining)}
                </div>
                <div className={`text-xs truncate mt-1 ${done ? 'text-white/90' : 'text-neutral-400'}`}>{t.label}</div>
              </div>
              {!done && (
                <button
                  onClick={() => onToggle(t.id)}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                  aria-label={t.status === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                >
                  {t.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                </button>
              )}
              <button
                onClick={() => onAddMinute(t.id)}
                className="h-9 px-2 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-0.5 text-xs font-bold"
                aria-label="Thêm 1 phút"
              >
                <Plus size={14} />1′
              </button>
              <button
                onClick={() => onRemove(t.id)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${done ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white/10 hover:bg-white/20'}`}
                aria-label={done ? 'Tắt chuông' : 'Hủy hẹn giờ'}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);

export const useTimers = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimers must be used within a TimerProvider');
  return context;
};
