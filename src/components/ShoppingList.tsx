import React, { useState } from 'react';
import { useRecipes } from '../RecipeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, CheckCircle2, Circle, UtensilsCrossed, Calendar, BookOpen, Trash, X } from 'lucide-react';
import { Recipe } from '../types';

export const ShoppingList: React.FC<{ onViewRecipe?: (recipe: Recipe) => void }> = ({ onViewRecipe }) => {
  const { shoppingList, removeFromShopping, toggleIngredient, removeAllFromShopping } = useRecipes();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (shoppingList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <div className="p-6 bg-neutral-50 rounded-full mb-6">
          <UtensilsCrossed size={48} className="opacity-20" />
        </div>
        <h3 className="text-xl font-bold text-neutral-600 mb-2">Chưa có món nào hôm nay</h3>
        <p className="text-center max-w-xs">
          Hãy chọn các món ăn bạn muốn nấu để tự động tạo danh sách đi chợ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-orange-600" />
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Thực đơn hôm nay</h2>
        </div>
        <button 
          onClick={removeAllFromShopping}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all border border-red-100"
        >
          <Trash size={16} />
          <span>Xóa tất cả</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {shoppingList.map((item) => (
            <motion.div
              key={item.shoppingId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 flex flex-col"
            >
              <div className="flex h-32">
                <img 
                  src={item.thumbnail} 
                  alt={item.name} 
                  className="w-32 h-full object-cover"
                />
                <div className="flex-1 p-4 flex flex-col justify-between bg-neutral-900 text-white">
                  <div>
                    <h3 className="text-xl font-bold leading-tight">{item.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-bold">
                      {item.category}
                    </p>
                  </div>
                  <button 
                    onClick={() => removeFromShopping(item.shoppingId)}
                    className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors font-bold uppercase"
                  >
                    <Trash2 size={14} />
                    <span>Xóa khỏi thực đơn</span>
                  </button>
                </div>
                {item.ingredients.every(ing => ing.checked) && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setExpandedId(expandedId === item.shoppingId ? null : item.shoppingId)}
                    className={`${
                      expandedId === item.shoppingId ? 'bg-neutral-800' : 'bg-orange-600 hover:bg-orange-700'
                    } text-white p-4 flex flex-col items-center justify-center gap-1 transition-colors min-w-[80px] shadow-inner`}
                  >
                    {expandedId === item.shoppingId ? (
                      <>
                        <X size={24} />
                        <span className="text-[10px] font-black uppercase text-center">Đóng lại</span>
                      </>
                    ) : (
                      <>
                        <BookOpen size={24} />
                        <span className="text-[10px] font-black uppercase text-center">Nấu ngay</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              <div className="p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
                    Danh sách nguyên liệu
                  </h4>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    {item.ingredients.filter(ing => ing.checked).length}/{item.ingredients.length} Đã mua
                  </span>
                </div>
                
                <div className="space-y-2">
                  {item.ingredients.map((ing, idx) => (
                    <button
                      key={`${item.shoppingId}-${idx}`}
                      onClick={() => toggleIngredient(item.shoppingId, ing.name)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                        ing.checked 
                          ? 'bg-neutral-50 text-neutral-400 border-transparent italic' 
                          : 'bg-white border-neutral-100 text-neutral-800 hover:border-orange-200'
                      }`}
                    >
                      {ing.checked ? (
                        <CheckCircle2 size={20} className="text-green-500 fill-green-500/10 shrink-0" />
                      ) : (
                        <Circle size={20} className="text-neutral-300 shrink-0" />
                      )}
                      <div className="flex-1 text-left flex justify-between items-center">
                        <span className={ing.checked ? 'line-through' : 'font-medium'}>
                          {ing.name}
                        </span>
                        <span className="text-xs opacity-60">
                          {ing.amount} {ing.unit}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {expandedId === item.shoppingId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-8 pt-8 border-t border-neutral-100">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6">
                          Hướng dẫn nấu
                        </h4>
                        <div className="space-y-6">
                          {(item.steps || []).map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </span>
                              <p className="text-neutral-700 leading-relaxed pt-1">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => onViewRecipe?.(item)}
                          className="w-full mt-8 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <BookOpen size={16} />
                          <span>Mở xem chi tiết đầy đủ</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
