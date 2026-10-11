export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  note?: string; // Công dụng / ghi chú ngắn
  group?: string; // Nhóm nguyên liệu, vd "Tôm bơ tỏi", "Sốt chanh"
  checked?: boolean; // Dùng cho danh sách đi chợ
}

export interface RecipeSection {
  title: string;
  // Markdown rút gọn: "- gạch đầu dòng", "1. bước", "| bảng |", "> Bí quyết", "### Tiêu đề nhỏ", **in đậm**
  content: string;
}

export interface Recipe {
  id: string;
  day: number; // Ngày thứ mấy trong hành trình 100 ngày
  name: string;
  emoji?: string; // Dùng làm ảnh bìa khi chưa có ảnh
  thumbnail?: string;
  description: string;
  style?: string; // Phong cách
  time?: string; // Thời gian, vd "25–30 phút"
  difficulty: number; // 1–5
  servings?: string; // Khẩu phần, vd "1 người"
  category?: string;
  mealTime?: string;
  ingredients: Ingredient[];
  sections: RecipeSection[];
}

export interface RecipeData {
  version?: number;
  updatedAt: number;
  recipes: Recipe[];
}

export interface ShoppingItem {
  shoppingId: string;
  recipeId: string;
  day: number;
  name: string;
  emoji?: string;
  thumbnail?: string;
  addedAt: number;
  ingredients: Ingredient[];
}
