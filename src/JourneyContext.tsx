import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { localDateKey, readStorage, writeStorage } from './lib/utils';

interface JourneyState {
  cooked: Record<string, number>; // id món -> thời điểm đánh dấu đã nấu
  notes: Record<string, string>; // id món -> ghi chú riêng
  ratings: Record<string, number>; // id món -> điểm 1–10 sau khi nấu
}

interface JourneyContextType {
  cooked: Record<string, number>;
  notes: Record<string, string>;
  isCooked: (id: string) => boolean;
  toggleCooked: (id: string) => void;
  markCooked: (id: string) => void;
  setNote: (id: string, note: string) => void;
  ratings: Record<string, number>;
  setRating: (id: string, score: number | null) => void;
  streak: number;
  isAdmin: boolean;
  setAdmin: (value: boolean) => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

const PROGRESS_KEY = 'nauan.progress.v1';
const ADMIN_KEY = 'nauan.admin';

// Số ngày liên tiếp có nấu, tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa nấu)
const computeStreak = (cooked: Record<string, number>) => {
  const days = new Set(Object.values(cooked).map(localDateKey));
  const d = new Date();
  if (!days.has(localDateKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(d.getTime()))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<JourneyState>(() => {
    const saved = readStorage<Partial<JourneyState>>(PROGRESS_KEY, {});
    return { cooked: saved.cooked ?? {}, notes: saved.notes ?? {}, ratings: saved.ratings ?? {} };
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => readStorage(ADMIN_KEY, false));

  useEffect(() => writeStorage(PROGRESS_KEY, state), [state]);
  useEffect(() => writeStorage(ADMIN_KEY, isAdmin), [isAdmin]);

  const streak = useMemo(() => computeStreak(state.cooked), [state.cooked]);

  const toggleCooked = (id: string) =>
    setState((prev) => {
      const cooked = { ...prev.cooked };
      if (cooked[id]) delete cooked[id];
      else cooked[id] = Date.now();
      return { ...prev, cooked };
    });

  const markCooked = (id: string) =>
    setState((prev) => (prev.cooked[id] ? prev : { ...prev, cooked: { ...prev.cooked, [id]: Date.now() } }));

  const setNote = (id: string, note: string) =>
    setState((prev) => {
      const notes = { ...prev.notes };
      if (note.trim()) notes[id] = note;
      else delete notes[id];
      return { ...prev, notes };
    });

  const setRating = (id: string, score: number | null) =>
    setState((prev) => {
      const ratings = { ...prev.ratings };
      if (score) ratings[id] = Math.min(10, Math.max(1, Math.round(score)));
      else delete ratings[id];
      return { ...prev, ratings };
    });

  return (
    <JourneyContext.Provider
      value={{
        cooked: state.cooked,
        notes: state.notes,
        isCooked: (id) => Boolean(state.cooked[id]),
        toggleCooked,
        markCooked,
        setNote,
        ratings: state.ratings,
        setRating,
        streak,
        isAdmin,
        setAdmin: setIsAdmin,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = () => {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('useJourney must be used within a JourneyProvider');
  return context;
};
