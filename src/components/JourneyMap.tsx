import React from 'react';
import { Check, Lock } from 'lucide-react';
import { Recipe } from '../types';
import { useJourney } from '../JourneyContext';
import { href } from '../lib/router';
import { STAGES, TOTAL_DAYS } from '../lib/recipe';
import { cn, splitGraphemes } from '../lib/utils';

interface JourneyMapProps {
  byDay: Map<number, Recipe>;
  nextDay?: number;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({ byDay, nextDay }) => {
  const { isCooked } = useJourney();
  const maxDay = Math.max(TOTAL_DAYS, ...byDay.keys());
  const stages = [...STAGES];
  // Nếu có món vượt quá ngày 100 thì thêm chặng phụ
  for (let from = TOTAL_DAYS + 1; from <= maxDay; from += 20) {
    stages.push({ from, to: from + 19, name: 'Ngoại truyện' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-orange-500" /> Đã nấu
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-white border-2 border-orange-500 ring-2 ring-orange-500/20" /> Món tiếp theo
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-white border border-orange-200" /> Đã có công thức
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-neutral-200/60" /> Sắp ra mắt
        </span>
      </div>

      {stages.map((stage, si) => {
        const days = Array.from({ length: stage.to - stage.from + 1 }, (_, i) => stage.from + i);
        const available = days.filter((d) => byDay.has(d)).length;
        const done = days.filter((d) => {
          const r = byDay.get(d);
          return r && isCooked(r.id);
        }).length;

        return (
          <div key={stage.from}>
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 shrink-0">Chặng {si + 1}</span>
                <span className="font-bold text-neutral-900 truncate">{stage.name}</span>
                <span className="text-xs text-neutral-400 shrink-0 hidden sm:inline">
                  Ngày {stage.from}–{stage.to}
                </span>
              </div>
              <span className="text-xs font-semibold text-neutral-400 shrink-0">
                {done}/{days.length} đã nấu{available > done ? ` · ${available - done} chờ bạn` : ''}
              </span>
            </div>
            <div className="grid grid-cols-10 lg:grid-cols-20 gap-1.5 sm:gap-2">
              {days.map((day) => {
                const recipe = byDay.get(day);
                if (!recipe) {
                  return (
                    <div
                      key={day}
                      className="aspect-square rounded-lg sm:rounded-xl bg-neutral-200/50 text-neutral-400/80 text-[10px] sm:text-xs font-bold flex items-center justify-center"
                      title={`Ngày ${day} · Sắp ra mắt`}
                    >
                      {day}
                    </div>
                  );
                }
                const cooked = isCooked(recipe.id);
                const isNext = day === nextDay;
                const emoji = splitGraphemes(recipe.emoji || '🍳')[0];
                return (
                  <a
                    key={day}
                    href={href.recipe(day)}
                    title={`Ngày ${day} · ${recipe.name}${cooked ? ' (đã nấu)' : ''}`}
                    className={cn(
                      'relative aspect-square rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all hover:-translate-y-0.5 hover:shadow-md',
                      cooked
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                        : isNext
                          ? 'bg-white border-2 border-orange-500 ring-4 ring-orange-500/20 text-orange-700'
                          : 'bg-white border border-orange-200 text-neutral-800 hover:border-orange-400'
                    )}
                  >
                    {cooked ? (
                      <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={3} />
                    ) : (
                      <>
                        <span className="sm:hidden">{day}</span>
                        <span className="hidden sm:inline text-xl leading-none">{emoji}</span>
                      </>
                    )}
                    <span
                      className={cn(
                        'hidden sm:block absolute top-0.5 left-1 text-[9px] font-black leading-none',
                        cooked ? 'text-white/80' : 'text-neutral-400'
                      )}
                    >
                      {day}
                    </span>
                    {isNext && !cooked && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="flex items-center gap-2 text-xs text-neutral-400">
        <Lock size={12} /> Các ngày còn lại sẽ mở dần khi có công thức mới.
      </p>
    </div>
  );
};
