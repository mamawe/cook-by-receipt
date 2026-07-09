import React, { useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, ShoppingBag, Flame, AlertCircle, Clock, Check, HelpCircle, ArrowRight, Zap, RefreshCw, Layers, BookOpen, ChefHat, Sparkles, Plus, ShoppingCart, Compass, ArrowUpRight, Snowflake } from 'lucide-react';
import { MealPlan, IngredientItem, UserProfile, MealPlanRecipe, MealSlot, Recipe, InventoryTransaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS, CATEGORY_MAP, STORAGE_MAP, UNIT_MAP } from '../lib/translations';
import { toLocalDateStr } from '../lib/date';

interface TodayTabProps {
  activePlan: MealPlan | null;
  ingredients: IngredientItem[];
  profile: UserProfile;
  onNavigateToTab: (tabName: string) => void;
  onToggleMealStatus: (recipeId: string, status: 'planned' | 'cooked' | 'skipped' | 'replaced') => void;
  onRegenerateSingleMeal: (date: string, slot: MealSlot) => Promise<void>;
  locale: 'en' | 'zh';
  theme: 'light' | 'dark' | 'sepia';
  transactions: InventoryTransaction[];
  onRestockIngredient: (id: string) => Promise<void>;
}

export default function TodayTab({
  activePlan,
  ingredients,
  profile,
  onNavigateToTab,
  onToggleMealStatus,
  onRegenerateSingleMeal,
  locale,
  theme,
  transactions,
  onRestockIngredient
}: TodayTabProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [singleRegeneratingId, setSingleRegeneratingId] = useState<string | null>(null);
  const [restockedItemName, setRestockedItemName] = useState<string | null>(null);

  const t = TRANSLATIONS[locale];

  // Colors & styling variables
  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const cardStyle = isDark
    ? 'bg-[#151c2c] border-[#222c44] text-slate-100'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422]'
    : 'bg-white border-neutral-200/70 text-gray-800';

  const textPrimary = isDark ? 'text-slate-100' : isSepia ? 'text-[#433422]' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isSepia ? 'text-[#7a6953]' : 'text-gray-500';
  const borderStyle = isDark ? 'border-[#222c44]' : isSepia ? 'border-[#e8dfd1]/80' : 'border-gray-150';
  const badgeStyle = isDark ? 'bg-slate-800 text-slate-300' : isSepia ? 'bg-[#f3edd7] text-[#5c4a37]' : 'bg-gray-100 text-gray-600';

  // Calculate standard stats
  const activeIngredients = ingredients.filter(i => i.status === 'active');
  const expiringSoon = activeIngredients.filter(item => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expire = new Date(item.expireAt + 'T00:00:00');
    const diff = expire.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 2;
  });

  // Decide what "today" date to display
  const getTodayDateStr = () => {
    if (!activePlan || activePlan.recipes.length === 0) return '';
    const todayStr = toLocalDateStr(new Date());
    const hasToday = activePlan.recipes.some(r => r.date === todayStr);
    if (hasToday) return todayStr;

    const uniqueDates = Array.from(new Set(activePlan.recipes.map(r => r.date))).sort();
    return uniqueDates[0] || todayStr;
  };

  const todayDateStr = getTodayDateStr();
  const todayRecipes = activePlan
    ? activePlan.recipes.filter(r => r.date === todayDateStr)
    : [];

  const completedToday = todayRecipes.filter(r => r.status === 'cooked').length;
  const totalToday = todayRecipes.length;
  const progressPercent = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  // Calculate overall plan stats
  const totalInPlan = activePlan ? activePlan.recipes.length : 0;
  const cookedInPlan = activePlan ? activePlan.recipes.filter(r => r.status === 'cooked').length : 0;
  const planProgressPercent = totalInPlan > 0 ? (cookedInPlan / totalInPlan) * 100 : 0;

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

  const getSlotDescription = (slot: MealSlot) => {
    if (locale === 'en') {
      switch (slot) {
        case 'breakfast': return 'Light, nutritious morning flavors.';
        case 'lunch': return 'Recharge with high-vitality macros.';
        case 'dinner': return 'Comforting, low-sodium cuisine.';
      }
    } else {
      switch (slot) {
        case 'breakfast': return '清晨舒心唤醒。';
        case 'lunch': return '中午补充能量。';
        case 'dinner': return '晚上美味解压。';
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

  const getUnitLabel = (unit: string) => {
    return UNIT_MAP[unit]?.[locale] || unit;
  };

  const needShopping = activeIngredients.length < 5;

  // ---------------------------------------------------------------------------
  // Smart Restock Logic
  // ---------------------------------------------------------------------------
  const depletedIngredients = ingredients.filter(i => i.status === 'depleted' || i.remainingQuantity === 0);

  const cookFrequencies = transactions.reduce((acc, tx) => {
    if (tx.reason === 'cook') {
      const nameKey = tx.itemName.toLowerCase().trim();
      acc[nameKey] = (acc[nameKey] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const smartRestockList = depletedIngredients
    .map(ing => {
      const freq = cookFrequencies[ing.name.toLowerCase().trim()] || 0;
      return { ...ing, freq };
    })
    .sort((a, b) => b.freq - a.freq || a.name.localeCompare(b.name));

  const restockPlan = smartRestockList.slice(0, 5);

  const triggerRestock = async (itemId: string, name: string) => {
    try {
      await onRestockIngredient(itemId);
      setRestockedItemName(name);
      setTimeout(() => setRestockedItemName(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerAllRestock = async () => {
    try {
      for (const item of restockPlan) {
        await onRestockIngredient(item.id);
      }
      setRestockedItemName(locale === 'en' ? "All priority items" : "所有推荐食材");
      setTimeout(() => setRestockedItemName(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6" id="today-tab-container">
      {/* Restock success micro-banner */}
      <AnimatePresence>
        {restockedItemName && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-xs shadow-lg"
          >
            <CheckCircle2 size={16} />
            <span>
              {locale === 'en'
                ? `Restocked "${restockedItemName}" successfully!`
                : `已成功补货 "${restockedItemName}"！`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header with Stats & Health Badge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Box 1: Plan status */}
        <div className={`rounded-2xl p-4 border flex items-center justify-between shadow-xs ${cardStyle}`}>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {locale === 'en' ? "PLAN PROGRESS" : "计划进度"}
            </span>
            <h3 className="text-lg font-black mt-1">
              {activePlan
                ? (locale === 'en'
                    ? `Day ${Array.from(new Set(activePlan.recipes.map(r => r.date))).indexOf(todayDateStr) + 1} of ${Array.from(new Set(activePlan.recipes.map(r => r.date))).length}`
                    : `第 ${Array.from(new Set(activePlan.recipes.map(r => r.date))).indexOf(todayDateStr) + 1} 天 / 共 ${Array.from(new Set(activePlan.recipes.map(r => r.date))).length} 天`)
                : (locale === 'en' ? "No Active Plan" : "无活跃计划")}
            </h3>
            {activePlan && (
              <div className="w-40 bg-gray-150 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${planProgressPercent}%` }} />
              </div>
            )}
          </div>
          <Calendar size={24} className="text-emerald-600 shrink-0 opacity-80" />
        </div>

        {/* Box 2: Inventory Health (Expiring warning) */}
        <div className={`rounded-2xl p-4 border flex items-center justify-between shadow-xs ${cardStyle}`}>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {locale === 'en' ? "EXPIRY RADAR" : "新鲜度提醒"}
            </span>
            <h3 className="text-lg font-black mt-1">
              {expiringSoon.length > 0
                ? (locale === 'en' ? `${expiringSoon.length} expiring` : `${expiringSoon.length} 件临期`)
                : (locale === 'en' ? "All Fresh" : "全部新鲜")}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">
              {expiringSoon.length > 0
                ? (locale === 'en' ? "Cook today to avoid waste" : "建议今日消耗")
                : (locale === 'en' ? "Stored perfectly" : "储存良好")}
            </p>
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${expiringSoon.length > 0 ? 'bg-amber-500/10 text-amber-600 animate-pulse' : 'bg-emerald-500/10 text-emerald-600'}`}>
            <AlertCircle size={18} />
          </div>
        </div>

        {/* Box 3: Today's meal completion progress */}
        <div className={`rounded-2xl p-4 border flex items-center justify-between shadow-xs ${cardStyle}`}>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {locale === 'en' ? "TODAY'S PROGRESS" : "今日烹饪"}
            </span>
            <h3 className="text-lg font-black mt-1">
              {locale === 'en'
                ? `${completedToday} / ${totalToday} meals cooked`
                : `${completedToday} / ${totalToday} 餐已做`}
            </h3>
            <div className="w-40 bg-gray-150 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0 opacity-80" />
        </div>
      </div>

      {/* 2. Welcome State if no Plan */}
      {!activePlan && (
        <div className={`rounded-2xl p-8 border text-center space-y-5 max-w-2xl mx-auto ${cardStyle}`}>
          <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
            <Sparkles size={26} className="fill-emerald-500/5" />
          </div>
          <div>
            <h3 className="text-lg font-black">{locale === 'en' ? "Welcome to cook by Receipt" : "欢迎来到 cook by Receipt！"}</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
              {locale === 'en'
                ? "Your smart kitchen assistant. Add ingredients to your pantry and the AI will curate zero-waste meal plans tailored to your shelf-lifes and preferences."
                : "您的智能食材管家。录入食材后，AI 将根据保质期和偏好，一键生成零浪费餐食计划！"}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigateToTab('plan')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <span>{t.today.getStarted}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Today's meals cards list */}
      {activePlan && todayRecipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: isDark ? '#222c44' : '#e8dfd1/50' }}>
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <ChefHat size={16} className="text-emerald-600" />
              <span>{t.today.todaysMenu}</span>
              <span className="text-xs text-gray-400 font-normal">({todayDateStr})</span>
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              {locale === 'en' ? "Zero-waste active" : "减损运行中"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {todayRecipes.map(meal => {
              const isRegenerating = singleRegeneratingId === meal.id;
              const isCooked = meal.status === 'cooked';
              return (
                <div
                  key={meal.id}
                  className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative ${cardStyle} ${
                    isCooked ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : ''
                  }`}
                >
                  <div>
                    {/* Slot label and status */}
                    <div className="flex items-center justify-between border-b pb-2.5 mb-3.5" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{getSlotLabel(meal.mealSlot)}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{getSlotDescription(meal.mealSlot)}</span>
                      </div>

                      {isCooked ? (
                        <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border border-emerald-500/20">
                          {locale === 'en' ? "Cooked" : "已做"}
                        </span>
                      ) : (
                        <span className="bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border border-blue-500/20">
                          {locale === 'en' ? "Planned" : "计划中"}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="font-black text-sm leading-snug tracking-tight">{meal.recipe.title}</h4>

                    {/* Cooking Stats */}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold mt-2.5">
                      <span className="flex items-center gap-0.5"><Clock size={11} /> {meal.recipe.cookTimeMin} mins</span>
                      <span className="flex items-center gap-0.5"><Layers size={11} /> {t.today.difficulty}: {getDifficultyLabel(meal.recipe.difficulty)}</span>
                    </div>

                    {/* Ingredients detail */}
                    <div className="mt-4 space-y-1.5">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.today.ingredientsNeeded}:</span>
                      <div className="flex flex-wrap gap-1">
                        {meal.recipe.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badgeStyle}`}
                          >
                            {ing.name} ({ing.quantity}{getUnitLabel(ing.unit)})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="mt-6 pt-3.5 border-t flex items-center justify-between gap-2" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                    <button
                      onClick={() => handleSingleRegenerate(meal.date, meal.mealSlot, meal.id)}
                      disabled={isRegenerating}
                      className="text-gray-400 hover:text-amber-600 hover:bg-amber-500/15 p-1.5 rounded-lg border border-transparent transition-colors shrink-0"
                      title={locale === 'en' ? "Swap recipe" : "换一个"}
                      aria-label="Swap recipe"
                    >
                      <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
                    </button>

                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => { setSelectedRecipe(meal.recipe); setActiveMealId(meal.id); }}
                        className="px-2.5 py-1.5 hover:bg-gray-500/10 border border-gray-400/20 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        <BookOpen size={11} />
                        <span>{locale === 'en' ? "Steps" : "做法"}</span>
                      </button>

                      {!isCooked ? (
                        <button
                          onClick={() => onToggleMealStatus(meal.id, 'cooked')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-0.5"
                        >
                          <Check size={11} />
                          <span>{locale === 'en' ? "Done" : "已做"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleMealStatus(meal.id, 'planned')}
                          className="px-2.5 py-1.5 text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-[11px] font-bold transition-all"
                          title={locale === 'en' ? "Undo" : "撤销"}
                        >
                          {locale === 'en' ? "Undo" : "撤销"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SMART RESTOCK PLANNER */}
      <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
        <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" size={18} />
            <div>
              <h3 className="font-bold text-sm tracking-tight">{t.today.smartRestockTitle}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.today.smartRestockDesc}</p>
            </div>
          </div>
          {restockPlan.length > 0 && (
            <button
              onClick={triggerAllRestock}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1"
            >
              <Zap size={10} className="fill-white" />
              <span>{locale === 'en' ? "Restock All" : "全部补货"}</span>
            </button>
          )}
        </div>

        {restockPlan.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {restockPlan.map(item => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-neutral-50/50 border-gray-150'}`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-black text-xs tracking-tight">{item.name}</span>
                    <span className="text-[8px] bg-red-500/10 text-red-500 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-red-500/20">
                      {locale === 'en' ? "Empty" : "空仓"}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-400 font-semibold mt-2 space-y-0.5">
                    <p>{locale === 'en' ? `Size: ${item.quantity} ${getUnitLabel(item.unit)}` : `规格: ${item.quantity}${getUnitLabel(item.unit)}`}</p>
                    <p className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <Flame size={10} className="fill-emerald-600/20" />
                      {t.today.freqUsedLabel.replace('{count}', item.freq.toString())}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-end" style={{ borderColor: isDark ? '#222c44' : '#f3edd7/50' }}>
                  <button
                    onClick={() => triggerRestock(item.id, item.name)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus size={10} />
                    <span>{t.today.addBackToPantry}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-400">
            🌿 {t.today.smartRestockEmpty}
          </div>
        )}
      </div>

      {/* 4. Secondary Row: Shopping Suggestion & Waste Log entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Shopping list or supplementary advice */}
        <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <ShoppingBag className="text-emerald-600" size={16} />
            <span>{locale === 'en' ? "Shopping Insights" : "采购建议"}</span>
          </h3>

          {needShopping ? (
            <div className="space-y-2 text-xs leading-relaxed">
              <p className="text-gray-400">
                {locale === 'en'
                  ? "Your pantry is running low. Stock up on these essentials:"
                  : "库存即将耗尽，建议补充以下高频食材："}
              </p>
              <div className={`rounded-xl p-3 border flex flex-col gap-1.5 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-amber-50/50 border-amber-100 text-amber-900'}`}>
                <span className="font-bold">🛒 {locale === 'en' ? "Recommended Basket:" : "补仓清单："}</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-medium">
                  {locale === 'en' ? (
                    <>
                      <li>Eggs & Milk (daily protein staples)</li>
                      <li>Leafy greens (spinach, kale for micronutrients)</li>
                      <li>Lean proteins (chicken breast, ground turkey)</li>
                      <li>Versatile veggies (onions, garlic, bell peppers)</li>
                    </>
                  ) : (
                    <>
                      <li>鸡蛋、牛奶（每日蛋白刚需）</li>
                      <li>绿叶蔬菜（补充维生素）</li>
                      <li>常备肉类（鸡胸肉/牛肉片）</li>
                      <li>万能配菜（洋葱、大蒜、彩椒）</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs leading-relaxed text-gray-400">
              <p>
                {locale === 'en'
                  ? "Your pantry is well-stocked! Tips to keep waste at zero:"
                  : "库存健康饱满！以下是减损策略："}
              </p>
              <div className={`rounded-xl p-3 border flex flex-col gap-1 text-[11px] ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-emerald-50/40 border-emerald-100/50 text-emerald-800'}`}>
                <span className="font-bold">✨ {locale === 'en' ? "Zero-Waste Tips:" : "减损守则："}</span>
                {locale === 'en' ? (
                  <>
                    <p>1. Cook expiring ingredients first. Cooked food lasts 48h longer in the fridge.</p>
                    <p>2. Use freezer items and pantry staples before buying more.</p>
                  </>
                ) : (
                  <>
                    <p>1. 优先消耗临期食材，做熟后可多保存1-2天。</p>
                    <p>2. 先清空冷冻和常温库存再采购。</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expiring Ingredients card list */}
        <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <AlertCircle className="text-amber-500" size={16} />
            <span>{locale === 'en' ? "Expiry Radar" : "临期预警"}</span>
          </h3>

          <div className="space-y-2 text-xs">
            {expiringSoon.length > 0 ? (
              <>
                <p className="text-gray-400">
                  {locale === 'en'
                    ? "Use these within 48 hours to prevent spoilage:"
                    : "这些食材将在 2 天内过期："}
                </p>
                <div className={`divide-y divide-gray-100 border rounded-xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800 divide-slate-800' : 'bg-amber-50/5 border-amber-100/50'}`}>
                  {expiringSoon.slice(0, 3).map(item => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between">
                      <span className="font-bold">{item.name}</span>
                      <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-md font-bold text-[10px] border border-red-500/20">
                        {locale === 'en' ? `Expiring (${item.remainingQuantity} ${getUnitLabel(item.unit)})` : `即将到期 (${item.remainingQuantity}${getUnitLabel(item.unit)})`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={`border rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/10 border-emerald-100/50'}`}>
                <ChefHat size={20} className="text-emerald-600" />
                <span className="font-bold">{locale === 'en' ? "All Clear!" : "安全！"}</span>
                <p className="text-[10px] text-gray-400">
                  {locale === 'en'
                    ? "All ingredients have safe shelf life. Keep cooking!"
                    : "暂无临期食材。继续保持！"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Discovery Strip — below the fold, visually distinct from dashboard cards */}
      <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
        <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
          <div className="flex items-center gap-2">
            <Compass className="text-emerald-600" size={16} />
            <div>
              <h3 className="font-bold text-sm tracking-tight">{locale === 'en' ? 'Explore' : '探索'}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">{locale === 'en' ? 'Guides, tools & recipes to reduce food waste' : '减废指南、工具与食谱'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Food Storage Guide */}
          <a
            href="/guides/food-storage-guide.html"
            className={`group rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-600/40' : 'bg-emerald-50/30 border-emerald-100/50 hover:border-emerald-300'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Snowflake size={16} />
              </div>
              <ArrowUpRight size={12} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h4 className="font-black text-xs tracking-tight mb-1">{locale === 'en' ? 'Food Storage Guide' : '食材储存指南'}</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {locale === 'en'
                ? 'How long does eggs, spinach, chicken last in the fridge? Complete shelf-life reference.'
                : '鸡蛋、菠菜、鸡肉能在冰箱放多久？完整保质期参考。'}
            </p>
          </a>

          {/* Card 2: Zero-Waste Recipes */}
          <a
            href="/recipes/"
            className={`group rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-600/40' : 'bg-amber-50/30 border-amber-100/50 hover:border-amber-300'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <ChefHat size={16} />
              </div>
              <ArrowUpRight size={12} className="text-gray-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <h4 className="font-black text-xs tracking-tight mb-1">{locale === 'en' ? 'Zero-Waste Recipes' : '零浪费食谱'}</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {locale === 'en'
                ? 'Creative recipes using ingredients before they expire. From overripe bananas to wilting greens.'
                : '用临期食材做创意美食。从过熟香蕉到蔫掉的蔬菜。'}
            </p>
          </a>

          {/* Card 3: Storage Calculator Tool */}
          <a
            href="/tools/storage-calculator.html"
            className={`group rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-600/40' : 'bg-blue-50/30 border-blue-100/50 hover:border-blue-300'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <ArrowUpRight size={12} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h4 className="font-black text-xs tracking-tight mb-1">{locale === 'en' ? 'Storage Calculator' : '储存计算器'}</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {locale === 'en'
                ? 'Interactive tool: enter any ingredient to get exact fridge & freezer shelf-life in days.'
                : '交互工具：输入食材，获取精确冷藏/冷冻保质期。'}
            </p>
          </a>
        </div>
      </div>

      {/* RECIPE DETAIL MODAL */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className={`rounded-2xl border shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] ${cardStyle}`}
            >
              <div className="bg-emerald-800 p-6 text-white shrink-0 relative flex flex-col justify-end min-h-[140px]">
                <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-widest inline-block w-max mb-1">
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
                    <span className="text-[10px] text-gray-400 font-normal">{locale === 'en' ? "Per household size" : "按家庭份量"}</span>
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
