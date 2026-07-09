import React, { useState } from 'react';
import { Calendar, ChefHat, Sparkles, AlertTriangle, Clock, RefreshCw, Layers, Plus, BookOpen, Check, HelpCircle, Utensils, Zap, Loader2 } from 'lucide-react';
import { MealPlan, IngredientItem, UserProfile, MealPlanRecipe, MealSlot, Recipe, RecipeDifficulty } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS, UNIT_MAP } from '../lib/translations';

interface PlanTabProps {
  activePlan: MealPlan | null;
  ingredients: IngredientItem[];
  profile: UserProfile;
  onGeneratePlan: (days: number) => Promise<void>;
  onToggleMealStatus: (recipeId: string, status: 'planned' | 'cooked' | 'skipped' | 'replaced') => void;
  onRegenerateSingleMeal: (date: string, slot: MealSlot) => Promise<void>;
  locale: 'en' | 'zh';
  theme: 'light' | 'dark' | 'sepia';
}

export default function PlanTab({
  activePlan,
  ingredients,
  profile,
  onGeneratePlan,
  onToggleMealStatus,
  onRegenerateSingleMeal,
  locale,
  theme
}: PlanTabProps) {
  const [daysCount, setDaysCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [singleRegeneratingId, setSingleRegeneratingId] = useState<string | null>(null);

  const t = TRANSLATIONS[locale];

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const cardStyle = isDark
    ? 'bg-[#151c2c] border-[#222c44] text-slate-100'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422]'
    : 'bg-white border-neutral-200/70 text-gray-800';

  const badgeStyle = isDark ? 'bg-slate-800 text-slate-300' : isSepia ? 'bg-[#f3edd7] text-[#5c4a37]' : 'bg-gray-100 text-gray-600';

  const chefTips = locale === 'en' ? [
    "Prioritizing soon-to-expire items to prevent waste...",
    "Calibrating ingredients based on your portion settings...",
    "Computing macronutrient balances...",
    "Matching difficulty to your cooking skill level...",
    "Adapting steps to your available kitchen tools..."
  ] : [
    "正在检索临期食材...",
    "正在设计符合家庭人数的配比...",
    "正在计算营养配比...",
    "正在根据烹饪水平编排步骤...",
    "正在匹配您的厨具..."
  ];

  const [tipIndex, setTipIndex] = useState(0);

  React.useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % chefTips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  React.useEffect(() => {
    if (activePlan && activePlan.recipes.length > 0) {
      const dates = Array.from(new Set(activePlan.recipes.map(r => r.date))).sort();
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    }
  }, [activePlan]);

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePlan(daysCount);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSingleRegenerate = async (date: string, slot: MealSlot, id: string) => {
    setSingleRegeneratingId(id);
    try {
      await onRegenerateSingleMeal(date, slot);
    } catch (err) {
      console.error(err);
    } finally {
      setSingleRegeneratingId(null);
    }
  };

  const uniqueDates = activePlan
    ? Array.from(new Set(activePlan.recipes.map(r => r.date))).sort()
    : [];

  const mealsForSelectedDate = activePlan
    ? activePlan.recipes.filter(r => r.date === selectedDate)
    : [];

  const getSlotLabel = (slot: MealSlot) => {
    if (locale === 'en') {
      switch (slot) {
        case 'breakfast': return '🍳 Breakfast';
        case 'lunch': return '☀️ Lunch';
        case 'dinner': return '🌙 Dinner';
      }
    } else {
      switch (slot) {
        case 'breakfast': return '🍳 早餐';
        case 'lunch': return '☀️ 午餐';
        case 'dinner': return '🌙 晚餐';
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'cooked': return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25';
      case 'skipped': return 'bg-gray-500/15 text-gray-400 border-gray-500/25';
      case 'replaced': return 'bg-amber-500/15 text-amber-600 border-amber-500/25';
      default: return 'bg-blue-500/15 text-blue-500 border-blue-500/25';
    }
  };

  const getStatusText = (status: string) => {
    if (locale === 'en') {
      switch (status) {
        case 'cooked': return 'Enjoyed';
        case 'skipped': return 'Skipped';
        case 'replaced': return 'Replaced';
        default: return 'Planned';
      }
    } else {
      switch (status) {
        case 'cooked': return '已做';
        case 'skipped': return '已跳过';
        case 'replaced': return '已换';
        default: return '计划中';
      }
    }
  };

  const getDifficultyLabel = (diff: string) => {
    const map: Record<string, { en: string; zh: string }> = {
      'easy': { en: 'Easy', zh: '简单' },
      'medium': { en: 'Medium', zh: '中等' },
      'hard': { en: 'Hard', zh: '困难' }
    };
    return map[diff]?.[locale] || diff;
  };

  const getUnitLabel = (unit: string) => UNIT_MAP[unit]?.[locale] || unit;

  return (
    <div className="space-y-6" id="plan-tab-container">
      {/* 1. Loader screen when generating */}
      {isGenerating && (
        <div className={`rounded-3xl p-12 border shadow-md text-center flex flex-col items-center justify-center min-h-[450px] ${cardStyle}`}>
          <Loader2 size={50} className="text-emerald-700 animate-spin mb-6" />
          <h3 className="text-lg font-black animate-pulse">
            {t.plan.generating}
          </h3>
          <div className="h-14 mt-4 max-w-md">
            <p className="text-xs text-emerald-700 font-bold bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/20 leading-relaxed">
              💡 {chefTips[tipIndex]}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-12">
            {locale === 'en'
              ? "Powered by AI with knapsack optimization and nutrition estimation"
              : "AI 多级约束求解与营养估算"}
          </p>
        </div>
      )}

      {/* 2. Config Screen if no active plan and not generating */}
      {!activePlan && !isGenerating && (
        <div className={`rounded-2xl border p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6 ${cardStyle}`}>
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
            <ChefHat size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black">{locale === 'en' ? "Curate Your Meal Plan" : "定制您的餐食计划"}</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              {locale === 'en'
                ? "Receipt 2 meal will use your pantry inventory, dietary parameters, and cooking tools to design delicious menus."
                : "系统将根据您的库存、过敏原及厨具，生成个性化餐食计划。"}
            </p>
          </div>

          <div className={`rounded-xl p-4 text-left space-y-2.5 max-w-md mx-auto border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-amber-500/[0.04] border-amber-200/50'}`}>
            <h4 className="text-[10px] font-black text-amber-700 flex items-center gap-1 uppercase tracking-wider">
              {locale === 'en' ? "ACTIVE INGREDIENTS:" : "活跃食材："}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {ingredients.filter(i => i.status === 'active').slice(0, 5).map(item => (
                <span key={item.id} className="bg-white/5 text-gray-400 px-2.5 py-0.5 rounded-md border border-gray-400/20 text-[11px] font-bold">
                  {item.name}
                </span>
              ))}
              {ingredients.filter(i => i.status === 'active').length === 0 && (
                <span className="text-[11px] text-amber-600 leading-normal">
                  {locale === 'en'
                    ? "Your pantry is empty. AI will generate popular home recipes!"
                    : "暂无库存，AI 将推荐家常菜！"}
                </span>
              )}
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-3">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.plan.duration}:</span>
            <div className="grid grid-cols-3 gap-3">
              {[3, 5, 7].map(d => (
                <button
                  key={d}
                  onClick={() => setDaysCount(d)}
                  className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    daysCount === d
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : isDark
                      ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {d} {locale === 'en' ? 'Days' : '天'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateClick}
            className="w-full max-w-md bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 px-6 rounded-xl font-bold text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 mx-auto uppercase tracking-wider"
          >
            <Sparkles size={14} className="fill-white" />
            <span>{t.plan.generateBtn}</span>
          </button>
        </div>
      )}

      {/* 3. Generated Plan Calendar Layout */}
      {activePlan && !isGenerating && (
        <div className="space-y-6">
          <div className={`rounded-2xl p-5 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardStyle}`}>
            <div>
              <h2 className="text-base font-black flex items-center gap-1.5">
                <Utensils className="text-emerald-600" size={18} />
                <span>{locale === 'en' ? "Meal Plan" : "餐食计划"}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1 leading-normal">
                {locale === 'en'
                  ? `${activePlan.startDate} to ${activePlan.endDate} (${uniqueDates.length} days)`
                  : `${activePlan.startDate} 至 ${activePlan.endDate}（共 ${uniqueDates.length} 天）`}
              </p>
            </div>

            <div className="flex gap-2">
              <select
                value={daysCount}
                onChange={(e) => setDaysCount(Number(e.target.value))}
                className={`border px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <option value="3">3 {locale === 'en' ? 'Days' : '天'}</option>
                <option value="5">5 {locale === 'en' ? 'Days' : '天'}</option>
                <option value="7">7 {locale === 'en' ? 'Days' : '天'}</option>
              </select>
              <button
                onClick={handleGenerateClick}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl font-black text-xs transition-colors flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>{locale === 'en' ? "Regenerate" : "重新生成"}</span>
              </button>
            </div>
          </div>

          {/* Date Selector row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {uniqueDates.map((d, index) => {
              const isSelected = selectedDate === d;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`px-4 py-3 rounded-2xl border transition-all text-center shrink-0 flex flex-col items-center justify-center min-w-[90px] ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : isDark
                      ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
                      : 'bg-white text-gray-700 border-gray-150 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75">{locale === 'en' ? `Day ${index + 1}` : `第${index + 1}天`}</span>
                  <span className="text-xs font-black mt-0.5">{d.substring(5)}</span>
                </button>
              );
            })}
          </div>

          {/* Three meal cards list */}
          <div className="space-y-4">
            {mealsForSelectedDate.map(meal => {
              const isRegenerating = singleRegeneratingId === meal.id;
              const isCooked = meal.status === 'cooked';
              return (
                <div
                  key={meal.id}
                  className={`rounded-2xl border p-5 shadow-xs flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow relative ${cardStyle}`}
                >
                  <div className="md:w-44 flex flex-col justify-between shrink-0 border-r border-dashed pr-4" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                    <div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-lg inline-block">
                        {getSlotLabel(meal.mealSlot)}
                      </span>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded-sm ${getStatusBadgeClass(meal.status)}`}>
                          {getStatusText(meal.status)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-400 font-bold space-y-1 mt-4">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{locale === 'en' ? `${meal.recipe.cookTimeMin} mins` : `约 ${meal.recipe.cookTimeMin} 分钟`}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers size={11} />
                        <span>{t.today.difficulty}: {getDifficultyLabel(meal.recipe.difficulty)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-black tracking-tight">{meal.recipe.title}</h4>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSingleRegenerate(meal.date, meal.mealSlot, meal.id)}
                            disabled={isRegenerating}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors border border-gray-400/20"
                            title={locale === 'en' ? "Swap" : "换一个"}
                            aria-label="Swap recipe"
                          >
                            <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {meal.recipe.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badgeStyle}`}
                          >
                            {ing.name} ({ing.quantity}{getUnitLabel(ing.unit)})
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-400 mt-3.5 line-clamp-2 leading-relaxed font-medium">
                        🧑‍🍳 <strong>{locale === 'en' ? "Steps:" : "步骤："}</strong>
                        {meal.recipe.steps.join(' → ')}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: isDark ? '#222c44' : '#f3edd7/50' }}>
                      <div className="flex gap-3 text-[10px] text-gray-400 font-bold">
                        <span>🔥 {meal.recipe.nutrition.calories} kcal</span>
                        <span>{t.today.protein} {meal.recipe.nutrition.protein}g</span>
                        <span>{t.today.fat} {meal.recipe.nutrition.fat}g</span>
                        <span>{t.today.carbs} {meal.recipe.nutrition.carbs}g</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedRecipe(meal.recipe); setActiveMealId(meal.id); }}
                          className="px-3.5 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border border-transparent"
                        >
                          <BookOpen size={11} />
                          <span>{locale === 'en' ? "Recipe" : "查看做法"}</span>
                        </button>

                        {!isCooked && (
                          <button
                            onClick={() => onToggleMealStatus(meal.id, 'cooked')}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-0.5"
                          >
                            <Check size={11} />
                            <span>{locale === 'en' ? "Done" : "已做"}</span>
                          </button>
                        )}
                        {isCooked && (
                          <span className="text-emerald-600 text-[11px] font-black flex items-center gap-1 px-3">
                            <Check size={14} className="stroke-[3]" />
                            <span>{locale === 'en' ? "Cooked" : "今日已吃"}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECIPE DETAIL MODAL */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-2xl border shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] ${cardStyle}`}
            >
              <div className="bg-emerald-800 p-6 text-white shrink-0 relative flex flex-col justify-end min-h-[140px]">
                <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block w-max mb-1">
                  {selectedRecipe.cuisine}
                </span>
                <h3 className="text-xl font-black tracking-tight">{selectedRecipe.title}</h3>
                <div className="flex gap-4 text-xs font-bold text-white/80 mt-2">
                  <span className="flex items-center gap-1"><Clock size={13} /> {selectedRecipe.cookTimeMin} mins</span>
                  <span className="flex items-center gap-1"><ChefHat size={13} /> {getDifficultyLabel(selectedRecipe.difficulty)}</span>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider border-b pb-1 flex justify-between" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                    <span>{t.today.ingredientsNeeded}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{locale === 'en' ? "Per household" : "按家庭份量"}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-2.5 rounded-xl text-xs border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-150'}`}>
                        <span className="font-bold">{ing.name}</span>
                        <span className="text-gray-400 font-semibold">{ing.quantity} {getUnitLabel(ing.unit)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>{t.today.steps}</h4>
                  <div className="space-y-3">
                    {selectedRecipe.steps.map((step, index) => (
                      <div key={index} className="flex gap-3 text-xs leading-relaxed">
                        <span className="w-5 h-5 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 flex items-center justify-center font-black shrink-0 mt-0.5 text-[10px]">
                          {index + 1}
                        </span>
                        <p className="flex-1 mt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>{t.today.nutrition}</h4>
                  <div className="grid grid-cols-4 gap-2.5 text-center">
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-150'}`}>
                      <div className="text-[9px] text-gray-400 font-bold uppercase">{t.today.calories}</div>
                      <div className="text-xs font-black mt-0.5">{selectedRecipe.nutrition.calories} <span className="text-[9px] font-normal text-gray-400">kcal</span></div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-150'}`}>
                      <div className="text-[9px] text-gray-400 font-bold uppercase">{t.today.protein}</div>
                      <div className="text-xs font-black mt-0.5 text-emerald-600">{selectedRecipe.nutrition.protein} <span className="text-[9px] font-normal text-gray-400">g</span></div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-150'}`}>
                      <div className="text-[9px] text-gray-400 font-bold uppercase">{t.today.fat}</div>
                      <div className="text-xs font-black mt-0.5 text-amber-600">{selectedRecipe.nutrition.fat} <span className="text-[9px] font-normal text-gray-400">g</span></div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-150'}`}>
                      <div className="text-[9px] text-gray-400 font-bold uppercase">{t.today.carbs}</div>
                      <div className="text-xs font-black mt-0.5 text-blue-500">{selectedRecipe.nutrition.carbs} <span className="text-[9px] font-normal text-gray-400">g</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-500/[0.03] flex items-center justify-end gap-2 shrink-0" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                <button
                  onClick={() => { setSelectedRecipe(null); setActiveMealId(null); }}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:bg-gray-500/10 rounded-xl"
                >
                  {t.common.back}
                </button>
                {activeMealId && (
                  <button
                    onClick={() => {
                      onToggleMealStatus(activeMealId, 'cooked');
                      setSelectedRecipe(null);
                      setActiveMealId(null);
                    }}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{locale === 'en' ? "Cook & Deduct" : "已做并扣减"}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
