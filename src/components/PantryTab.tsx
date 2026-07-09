import React, { useState } from 'react';
import { Search, Plus, Calendar, ShieldAlert, SlidersHorizontal, Trash2, Edit3, Minus, EyeOff, AlertTriangle, Check, PieChart as PieIcon, LayoutGrid } from 'lucide-react';
import { IngredientItem, IngredientCategory, IngredientUnit, StorageType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TRANSLATIONS, CATEGORY_MAP, STORAGE_MAP, UNIT_MAP, CATEGORY_KEYS, UNIT_KEYS, STORAGE_KEYS } from '../lib/translations';
import { toLocalDateStr } from '../lib/date';

interface PantryTabProps {
  ingredients: IngredientItem[];
  onAddIngredient: (item: Omit<IngredientItem, 'id' | 'userId'>) => void;
  onUpdateIngredient: (id: string, updates: Partial<IngredientItem>) => void;
  onDeleteIngredient: (id: string) => void;
  onLogTransaction: (itemId: string, itemName: string, delta: number, reason: 'cook' | 'waste' | 'manual_edit' | 'expire' | 'add', unit: any) => void;
  locale: 'en' | 'zh';
  theme: 'light' | 'dark' | 'sepia';
}

export default function PantryTab({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onLogTransaction,
  locale,
  theme
}: PantryTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStorage, setSelectedStorage] = useState<string>('all');

  // Modal for editing or adding manually
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IngredientItem | null>(null);

  // Form states — English-native defaults
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<IngredientCategory>('vegetables');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnit, setFormUnit] = useState<IngredientUnit>('pcs');
  const [formStorage, setFormStorage] = useState<StorageType>('fridge');
  const [formExpireDays, setFormExpireDays] = useState(5);

  const t = TRANSLATIONS[locale];

  // Colors & styling variables
  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const cardStyle = isDark
    ? 'bg-[#151c2c] border-[#222c44] text-slate-100'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422]'
    : 'bg-white border-neutral-200/70 text-gray-800';

  const badgeStyle = isDark ? 'bg-slate-800 text-slate-300' : isSepia ? 'bg-[#f3edd7] text-[#5c4a37]' : 'bg-gray-100 text-gray-600';

  // Filters setup
  const filtered = ingredients.filter(item => {
    if (item.status === 'depleted' || item.status === 'discarded') return false;

    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStorage = selectedStorage === 'all' || item.storage === selectedStorage;

    return matchesSearch && matchesCategory && matchesStorage;
  });

  // Calculate days remaining helper
  const getDaysRemaining = (expireAtStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expire = new Date(expireAtStr + 'T00:00:00');
    expire.setHours(0,0,0,0);
    const diffTime = expire.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadgeColor = (days: number) => {
    if (days <= 0) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (days <= 2) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  };

  const getUnitLabel = (unit: string) => UNIT_MAP[unit]?.[locale] || unit;

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('vegetables');
    setFormQuantity(1);
    setFormUnit('pcs');
    setFormStorage('fridge');
    setFormExpireDays(5);
    setIsManualModalOpen(true);
  };

  const openEditModal = (item: IngredientItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity);
    setFormUnit(item.unit);
    setFormStorage(item.storage);

    const days = getDaysRemaining(item.expireAt);
    setFormExpireDays(days > 0 ? days : 5);

    setIsManualModalOpen(true);
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const today = new Date();
    const expireDate = new Date();
    expireDate.setDate(today.getDate() + Number(formExpireDays));
    const expireStr = toLocalDateStr(expireDate);

    if (editingItem) {
      onUpdateIngredient(editingItem.id, {
        name: formName.trim(),
        category: formCategory,
        quantity: formQuantity,
        remainingQuantity: Math.min(editingItem.remainingQuantity, formQuantity),
        unit: formUnit,
        storage: formStorage,
        expireAt: expireStr
      });
      onLogTransaction(
        editingItem.id,
        formName.trim(),
        formQuantity - editingItem.quantity,
        'manual_edit',
        formUnit
      );
    } else {
      onAddIngredient({
        name: formName.trim(),
        category: formCategory,
        quantity: formQuantity,
        unit: formUnit,
        purchasedAt: today.toISOString().split('T')[0],
        expireAt: expireStr,
        storage: formStorage,
        remainingQuantity: formQuantity,
        status: 'active',
        rawSource: 'manual'
      });
    }

    setIsManualModalOpen(false);
  };

  const handleDecrement = (item: IngredientItem, amount = 1) => {
    const newRemaining = Math.max(0, item.remainingQuantity - amount);
    if (newRemaining === 0) {
      onUpdateIngredient(item.id, { remainingQuantity: 0, status: 'depleted' });
      onLogTransaction(item.id, item.name, -item.remainingQuantity, 'cook', item.unit);
    } else {
      onUpdateIngredient(item.id, { remainingQuantity: newRemaining });
      onLogTransaction(item.id, item.name, -amount, 'cook', item.unit);
    }
  };

  const handleWaste = (item: IngredientItem) => {
    onUpdateIngredient(item.id, { status: 'discarded', remainingQuantity: 0 });
    onLogTransaction(item.id, item.name, -item.remainingQuantity, 'waste', item.unit);
  };

  // ---------------------------------------------------------------------------
  // Category Distribution Recharts Pie Chart
  // ---------------------------------------------------------------------------
  const activeItems = ingredients.filter(i => i.status === 'active');

  const categoryCounts = activeItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryCounts)
    .map(([cat, count]) => {
      const label = CATEGORY_MAP[cat]?.[locale] || cat;
      return {
        name: label,
        value: count,
        rawCat: cat
      };
    })
    .sort((a, b) => b.value - a.value);

  const COLORS_LIGHT = ['#0f766e', '#0369a1', '#b45309', '#be123c', '#6d28d9', '#4d7c0f', '#c2410c', '#0284c7', '#701a75', '#a21caf', '#15803d', '#57534e'];
  const COLORS_DARK = ['#14b8a6', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#84cc16', '#f97316', '#3b82f6', '#d946ef', '#a855f7', '#10b981', '#78716c'];
  const COLORS_SEPIA = ['#7c2d12', '#1e3a1e', '#854d0e', '#78350f', '#5c3d2e', '#2e4a3f', '#a16207', '#451a03', '#5c3a21', '#4a1d1d', '#14532d', '#44403c'];

  const palette = isDark ? COLORS_DARK : isSepia ? COLORS_SEPIA : COLORS_LIGHT;

  return (
    <div className="space-y-6" id="pantry-tab-container">
      {/* 1. Header with Title and Add Button */}
      <div className={`rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${cardStyle}`}>
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <span>{t.pantry.title}</span>
            <span className="text-xs font-bold text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full">
              {locale === 'en'
                ? `${activeItems.length} items active`
                : `${activeItems.length} 种在库`}
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">{t.pantry.desc}</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>{locale === 'en' ? "Add Item" : "添加食材"}</span>
        </button>
      </div>

      {/* 2. Recharts Pie Chart Section */}
      {activeItems.length > 0 && (
        <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
          <div className="flex items-center gap-2 mb-4 border-b pb-2" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
            <PieIcon size={16} className="text-emerald-600" />
            <h3 className="font-bold text-sm tracking-tight">{t.pantry.chartTitle}</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#151c2c' : '#ffffff',
                      borderColor: isDark ? '#222c44' : '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: isDark ? '#f1f5f9' : '#0f172a'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pieData.map((item, idx) => {
                const percentage = ((item.value / activeItems.length) * 100).toFixed(0);
                return (
                  <div
                    key={item.name}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${isDark ? 'bg-[#1a233a] border-slate-800' : 'bg-neutral-50/50 border-gray-150'}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: palette[idx % palette.length] }}
                    />
                    <div className="min-w-0">
                      <p className="font-black text-xs truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {locale === 'en' ? `${item.value} items (${percentage}%)` : `${item.value}件 (${percentage}%)`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter and Search Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t.common.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none text-xs transition-all ${
                isDark
                  ? 'bg-[#151c2c] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-600'
                  : isSepia
                  ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422] placeholder-[#a1927d] focus:border-[#c4a478]'
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-emerald-700'
              }`}
            />
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl shrink-0 ${isDark ? 'bg-[#151c2c] border-slate-800' : isSepia ? 'bg-[#fcfaf2] border-[#e8dfd1]' : 'bg-white border-gray-200'}`}>
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1 border-none text-gray-400"
            >
              <option value="all">{locale === 'en' ? "All Storage" : "全部仓储"}</option>
              {STORAGE_KEYS.map(key => (
                <option key={key} value={key}>{STORAGE_MAP[key][locale]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 border ${
              selectedCategory === 'all'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : isDark
                ? 'bg-[#151c2c] text-slate-400 border-slate-800 hover:text-slate-100'
                : isSepia
                ? 'bg-[#fcfaf2] text-[#7a6953] border-[#e8dfd1] hover:text-[#433422]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.common.all}
          </button>
          {CATEGORY_KEYS.map(cat => {
            const label = CATEGORY_MAP[cat]?.[locale] || cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : isDark
                    ? 'bg-[#151c2c] text-slate-400 border-slate-800 hover:text-slate-100'
                    : isSepia
                    ? 'bg-[#fcfaf2] text-[#7a6953] border-[#e8dfd1] hover:text-[#433422]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Grid of Ingredients */}
      {filtered.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-12 text-center flex flex-col items-center justify-center ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-4">
            <LayoutGrid size={26} />
          </div>
          <h3 className="text-base font-black">{locale === 'en' ? "No ingredients found" : "未找到食材"}</h3>
          <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
            {search || selectedCategory !== 'all' || selectedStorage !== 'all'
              ? (locale === 'en' ? 'Try clearing your filters to see all ingredients.' : '请重置筛选条件。')
              : (locale === 'en' ? 'Your pantry is empty! Upload a receipt or add items manually.' : '库存为空，请添加食材！')}
          </p>
          {(search || selectedCategory !== 'all' || selectedStorage !== 'all') && (
            <button
              onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedStorage('all'); }}
              className="mt-4 text-emerald-600 font-bold text-xs hover:underline uppercase tracking-wider"
            >
              {locale === 'en' ? "Reset Filters" : "重置筛选"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(item => {
              const daysRemaining = getDaysRemaining(item.expireAt);
              const isExpired = daysRemaining <= 0;
              const isAboutToExpire = daysRemaining <= 2 && daysRemaining > 0;

              const catLabel = CATEGORY_MAP[item.category]?.[locale] || item.category;
              const storeLabel = STORAGE_MAP[item.storage]?.[locale] || item.storage;
              const unitLabel = getUnitLabel(item.unit);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl border p-4.5 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between ${cardStyle}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b pb-2.5 mb-3" style={{ borderColor: isDark ? '#222c44' : '#f3edd7/50' }}>
                      <div>
                        <h4 className="font-black text-sm tracking-tight">{item.name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-md mt-1 inline-block">
                          {catLabel}
                        </span>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {storeLabel}
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-emerald-600">{item.remainingQuantity}</span>
                      <span className="text-xs font-bold text-gray-400">{unitLabel}</span>
                      {item.remainingQuantity < item.quantity && (
                        <span className="text-[10px] text-gray-400 line-through ml-2">
                          {locale === 'en' ? `was ${item.quantity} ${unitLabel}` : `原 ${item.quantity}${unitLabel}`}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getExpiryBadgeColor(daysRemaining)}`}>
                        <Calendar size={11} />
                        {isExpired
                          ? (locale === 'en' ? "Expired" : "已过期")
                          : daysRemaining === 1
                          ? (locale === 'en' ? "Expires tomorrow" : "明天过期")
                          : (locale === 'en' ? `${daysRemaining} days left` : `剩 ${daysRemaining} 天`)}
                      </span>
                      {isAboutToExpire && (
                        <span className="text-amber-500 animate-pulse">
                          <AlertTriangle size={14} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t flex items-center justify-between gap-1" style={{ borderColor: isDark ? '#222c44' : '#f3edd7/50' }}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        title={locale === 'en' ? "Edit" : "编辑"}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        aria-label="Edit item"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleWaste(item)}
                        title={locale === 'en' ? "Mark as wasted" : "标记浪费"}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label="Mark as wasted"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDecrement(item, 1)}
                        className="px-2 py-1 bg-gray-500/10 hover:bg-gray-500/15 text-gray-400 hover:text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-colors border border-transparent"
                      >
                        <Minus size={10} />
                        <span>1 {unitLabel}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MANUAL ADD/EDIT MODAL */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-2xl border shadow-2xl max-w-md w-full overflow-hidden ${cardStyle}`}
            >
              <div className="p-5 border-b flex items-center justify-between bg-gray-500/[0.02]" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                <h3 className="font-bold text-base">
                  {editingItem ? t.pantry.editItem : t.pantry.addItemTitle}
                </h3>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="text-gray-400 hover:text-gray-200 text-xs font-bold"
                >
                  {t.common.cancel}
                </button>
              </div>

              <form onSubmit={handleSubmitManual} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t.pantry.nameLabel} *</label>
                  <input
                    type="text"
                    required
                    placeholder={locale === 'en' ? "e.g., Tomato, Chicken, Milk" : "例如：番茄、鸡肉、牛奶"}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/20 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 focus:border-emerald-600'
                        : 'bg-white border-gray-200 focus:border-emerald-700'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t.pantry.categoryLabel}</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as IngredientCategory)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                      }`}
                    >
                      {CATEGORY_KEYS.map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_MAP[cat][locale]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t.pantry.storageLabel}</label>
                    <select
                      value={formStorage}
                      onChange={(e) => setFormStorage(e.target.value as StorageType)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                      }`}
                    >
                      {STORAGE_KEYS.map(key => (
                        <option key={key} value={key}>{STORAGE_MAP[key][locale]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t.pantry.quantityLabel}</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t.pantry.unitLabel}</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value as IngredientUnit)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                      }`}
                    >
                      {UNIT_KEYS.map(unit => (
                        <option key={unit} value={unit}>{UNIT_MAP[unit][locale]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 flex justify-between">
                    <span>{t.pantry.expireLabel}</span>
                    <span className="text-emerald-600 font-bold">{formExpireDays} {locale === 'en' ? 'Days' : '天'}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={formExpireDays}
                    onChange={(e) => setFormExpireDays(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-bold">
                    <span>1d ({locale === 'en' ? 'Short' : '极短'})</span>
                    <span>15d</span>
                    <span>30d</span>
                    <span>60d ({locale === 'en' ? 'Long' : '极长'})</span>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:bg-gray-500/10 rounded-xl transition-all"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>{t.pantry.saveItem}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
