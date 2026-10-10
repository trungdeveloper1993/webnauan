import React from 'react';
import { ChefHat, Plus, Route as RouteIcon, ShoppingBasket, Shuffle } from 'lucide-react';
import { useRecipes } from '../RecipeContext';
import { useJourney } from '../JourneyContext';
import { href, Route } from '../lib/router';
import { cn } from '../lib/utils';

interface HeaderProps {
  route: Route;
  onRandom: () => void;
  onAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ route, onRandom, onAdd }) => {
  const { shoppingList, recipes } = useRecipes();
  const { isAdmin } = useJourney();

  const tab = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 px-2.5 sm:px-4 h-9 rounded-xl text-sm font-bold whitespace-nowrap transition-all relative',
      active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
    );

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-xl border-b border-orange-950/5 print:hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        <a href={href.home} className="flex items-center gap-2.5 shrink-0" aria-label="Trang chủ">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-600/25">
            <ChefHat size={22} />
          </div>
          <div className="hidden lg:block leading-none">
            <div className="font-black tracking-tight uppercase text-[15px]">
              Tôi Thích <span className="text-orange-600">Nấu Ăn</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-semibold mt-1">Hành trình 100 ngày vào bếp</div>
          </div>
        </a>

        <nav className="flex items-center bg-neutral-900/5 p-1 rounded-2xl" aria-label="Điều hướng chính">
          <a href={href.home} className={tab(route.name !== 'shopping')}>
            <RouteIcon size={17} />
            <span>Lộ trình</span>
          </a>
          <a href={href.shopping} className={tab(route.name === 'shopping')}>
            <ShoppingBasket size={17} />
            <span>Đi chợ</span>
            {shoppingList.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-orange-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-cream">
                {shoppingList.length}
              </span>
            )}
          </a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRandom}
            disabled={recipes.length === 0}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white h-10 w-10 md:w-auto md:px-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-600/20 active:scale-95 disabled:opacity-50"
            title="Chọn ngẫu nhiên một món"
            aria-label="Hôm nay ăn gì? Chọn món ngẫu nhiên"
          >
            <Shuffle size={18} />
            <span className="hidden md:inline">Hôm nay ăn gì?</span>
          </button>
          {isAdmin && (
            // Trên điện thoại nút này nằm ở khung quản trị cuối trang cho đỡ chật
            <button
              onClick={onAdd}
              className="hidden sm:flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white h-10 w-10 md:w-auto md:px-4 rounded-xl font-bold text-sm transition-all active:scale-95"
              aria-label="Thêm món mới"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Thêm món</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
