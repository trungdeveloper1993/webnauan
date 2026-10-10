import React from 'react';
import { ChefHat, Download, Heart, Lock, LockOpen, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRecipes } from '../RecipeContext';
import { useJourney } from '../JourneyContext';

export const Footer: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  const { exportRecipes, reloadFromSource, hasLocalChanges, isLoading } = useRecipes();
  const { isAdmin, setAdmin } = useJourney();

  return (
    <footer className="mt-20 bg-white border-t border-neutral-200/70 print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Lời nhắn của chủ trang */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/25">
            <ChefHat size={24} />
          </div>
          <p className="mt-5 text-neutral-600 leading-relaxed">
            Xin chào <Heart size={16} className="inline-block text-orange-600 fill-orange-600 -mt-1" /> Tôi là Trung, tôi đang học
            nấu ăn và thấy việc lưu trữ công thức nấu ăn rất phù hợp. Nếu bạn thấy hợp với bạn hãy thoải mái sử dụng nhé.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100 pt-6 text-sm">
          <span className="font-black uppercase tracking-tight">
            Tôi Thích <span className="text-orange-600">Nấu Ăn</span>
          </span>
          <span className="text-neutral-400 text-center">&copy; 2026 Tôi Thích Nấu Ăn — Nấu ăn là niềm hạnh phúc.</span>
          <button
            onClick={() => setAdmin(!isAdmin)}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-700 flex items-center gap-1.5"
          >
            {isAdmin ? <LockOpen size={13} /> : <Lock size={13} />}
            {isAdmin ? 'Tắt chế độ quản trị' : 'Quản trị'}
          </button>
        </div>

        {isAdmin && (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-bold flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" /> Chế độ quản trị
                  </span>
                  {hasLocalChanges && (
                    <span className="inline-flex items-center gap-1.5 text-orange-600 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      Có thay đổi chưa lưu lên GitHub
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed max-w-2xl">
                  Thêm, sửa món ngay trên web (lưu tạm trong trình duyệt này). Muốn mọi người cùng thấy: bấm "Tải recipes.json" rồi thay
                  file <code className="text-neutral-700">public/recipes.json</code> trên GitHub.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={onAdd}
                  className="flex items-center gap-2 h-10 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  <Plus size={15} /> Thêm món
                </button>
                <button
                  onClick={exportRecipes}
                  className="flex items-center gap-2 h-10 px-4 bg-neutral-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  <Download size={15} /> Tải recipes.json
                </button>
                <button
                  onClick={() => {
                    if (hasLocalChanges && !confirm('Bạn có thay đổi chưa tải về. Đồng bộ từ server sẽ ghi đè các thay đổi này. Tiếp tục?')) {
                      return;
                    }
                    reloadFromSource();
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 h-10 px-4 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-900 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Đồng bộ từ server
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
