import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Dùng hash (#/ngay/1) để chạy được trên GitHub Pages mà không cần cấu hình server
export type Route =
  | { name: 'home' }
  | { name: 'recipe'; day: number; cook: boolean }
  | { name: 'shopping' };

export const parseHash = (hash: string): Route => {
  const recipe = hash.match(/^#\/ngay\/(\d+)(\/nau)?/);
  if (recipe) return { name: 'recipe', day: Number(recipe[1]), cook: Boolean(recipe[2]) };
  if (hash.startsWith('#/di-cho')) return { name: 'shopping' };
  return { name: 'home' };
};

export const href = {
  home: '#/',
  recipe: (day: number) => `#/ngay/${day}`,
  cook: (day: number) => `#/ngay/${day}/nau`,
  shopping: '#/di-cho',
};

export const navigate = (target: string) => {
  if (window.location.hash !== target) window.location.hash = target;
};

// Đổi trang mà không thêm vào lịch sử (nút Back không quay lại trang này)
export const replaceRoute = (target: string) => {
  if (window.location.hash !== target) window.location.replace(target);
};

export const pageKey = (route: Route) => (route.name === 'recipe' ? `recipe-${route.day}` : route.name);

export const useRoute = () => {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const current = useRef(route);
  const homeScroll = useRef(0);

  useEffect(() => {
    const onChange = () => {
      // Nhớ vị trí cuộn của trang chủ để quay lại đúng chỗ
      if (current.current.name === 'home') homeScroll.current = window.scrollY;
      current.current = parseHash(window.location.hash);
      setRoute(current.current);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const key = pageKey(route);
  useLayoutEffect(() => {
    window.scrollTo({ top: key === 'home' ? homeScroll.current : 0, behavior: 'instant' as ScrollBehavior });
  }, [key]);

  return route;
};
