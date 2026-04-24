import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import { useRecipes } from '../RecipeContext';

interface RecipeFormProps {
  recipe?: Recipe | null;
  onClose: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onClose }) => {
  const { addRecipe, updateRecipe } = useRecipes();
  const [name, setName] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('');
  const [category, setCategory] = useState('Món nước');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
  const [steps, setSteps] = useState<string[]>(['']);

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setThumbnail(recipe.thumbnail);
      setDescription(recipe.description);
      setMethod(recipe.method);
      setCategory(recipe.category || 'Món chính');
      setIngredients(recipe.ingredients);
      setSteps(recipe.steps);
    }
  }, [recipe]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx: number, field: keyof Ingredient, value: string) => {
    const newIngs = [...ingredients];
    newIngs[idx] = { ...newIngs[idx], [field]: value };
    setIngredients(newIngs);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx: number, value: string) => {
    const newSteps = [...steps];
    newSteps[idx] = value;
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80',
      description,
      method,
      category,
      ingredients: ingredients.filter(i => i.name),
      steps: steps.filter(s => s)
    };

    if (recipe) {
      updateRecipe(recipe.id, { ...data, id: recipe.id });
    } else {
      addRecipe(data);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              {recipe ? 'Chỉnh sửa công thức' : 'Thêm công thức mới'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Tên món ăn</label>
                  <input 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="VD: Phở Bò"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Phân loại</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option>Món nước</option>
                    <option>Món nướng</option>
                    <option>Món cơm</option>
                    <option>Món khai vị</option>
                    <option>Món lẩu</option>
                    <option>Món canh</option>
                    <option>Món khác</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Link ảnh Thumbnail</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <ImageIcon className="absolute left-3 top-3.5 text-neutral-400" size={18} />
                    <input 
                      value={thumbnail}
                      onChange={e => setThumbnail(e.target.value)}
                      className="w-full p-3 pl-10 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  {thumbnail && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-200">
                      <img src={thumbnail} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Mô tả ngắn</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  rows={2}
                  placeholder="Một vài lời giới thiệu về món ăn..."
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-neutral-900">Nguyên liệu</h3>
                <button 
                  type="button" 
                  onClick={handleAddIngredient}
                  className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Thêm nguyên liệu
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      required
                      value={ing.name}
                      onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
                      className="flex-[2] p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none"
                      placeholder="Tên nguyên liệu"
                    />
                    <input 
                      value={ing.amount}
                      onChange={e => handleIngredientChange(idx, 'amount', e.target.value)}
                      className="flex-1 p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none"
                      placeholder="Số lượng"
                    />
                    <input 
                      value={ing.unit}
                      onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                      className="flex-1 p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none"
                      placeholder="Đơn vị"
                    />
                    {ingredients.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-neutral-900">Các bước thực hiện</h3>
                <button 
                  type="button" 
                  onClick={handleAddStep}
                  className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Thêm bước
                </button>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="w-6 h-6 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <textarea 
                      required
                      value={step}
                      onChange={e => handleStepChange(idx, e.target.value)}
                      className="flex-1 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none w-full"
                      rows={2}
                      placeholder={`Mô tả bước ${idx + 1}...`}
                    />
                    {steps.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Method/Secret */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Bí quyết / Phương pháp</label>
              <textarea 
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                rows={3}
                placeholder="Những lưu ý quan trọng để món ăn ngon hơn..."
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-neutral-100">
              <button 
                type="submit"
                className="flex-1 bg-neutral-900 hover:bg-black text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Save size={20} />
                Lưu công thức
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
