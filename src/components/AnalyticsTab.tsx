import React, { useState } from 'react';
import { ChartArea, Trash2, TrendingDown, ShoppingBag, AlertCircle, Clock, ChefHat, ShieldCheck } from 'lucide-react';
import { IngredientItem, InventoryTransaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS, UNIT_MAP } from '../lib/translations';

interface AnalyticsTabProps {
  ingredients: IngredientItem[];
  transactions: InventoryTransaction[];
  onResetDatabase: () => void;
  locale: 'en' | 'zh';
  theme: 'light' | 'dark' | 'sepia';
}

export default function AnalyticsTab({
  ingredients,
  transactions,
  onResetDatabase,
  locale,
  theme
}: AnalyticsTabProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const t = TRANSLATIONS[locale];

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const cardStyle = isDark
    ? 'bg-[#151c2c] border-[#222c44] text-slate-100'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422]'
    : 'bg-white border-neutral-200/70 text-gray-800';

  // Calculate stats
  const totalLogged = ingredients.length;
  const activeItems = ingredients.filter(i => i.status === 'active').length;
  const depletedItems = ingredients.filter(i => i.status === 'depleted').length;
  const expiredItems = ingredients.filter(i => i.status === 'expired').length;
  const discardedItems = ingredients.filter(i => i.status === 'discarded').length;

  // Waste rate = (discarded + expired) / total
  const wasteRate = totalLogged > 0
    ? ((discardedItems + expiredItems) / totalLogged * 100).toFixed(1)
    : '0.0';

  const activeRatio = totalLogged > 0
    ? (activeItems / totalLogged * 100).toFixed(1)
    : '0.0';

  const getUnitLabel = (unit: string) => UNIT_MAP[unit]?.[locale] || unit;

  const getReasonBadge = (reason: string) => {
    const map: Record<string, { en: string; zh: string; class: string }> = {
      'cook': {
        en: 'Cooked',
        zh: '已烹饪',
        class: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25'
      },
      'waste': {
        en: 'Wasted',
        zh: '已浪费',
        class: 'bg-red-500/15 text-red-500 border-red-500/25'
      },
      'add': {
        en: 'Added',
        zh: '已入库',
        class: 'bg-blue-500/15 text-blue-500 border-blue-500/25'
      },
      'manual_edit': {
        en: 'Adjusted',
        zh: '手动调整',
        class: 'bg-amber-500/15 text-amber-600 border-amber-500/25'
      },
      'expire': {
        en: 'Expired',
        zh: '已过期',
        class: 'bg-gray-500/15 text-gray-400 border-gray-500/25'
      }
    };
    return map[reason] || { en: reason, zh: reason, class: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    if (locale === 'en') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' · ' +
             date.toLocaleTimeString('zh-CN', { hour: 'numeric', minute: '2-digit' });
    }
  };

  return (
    <div className="space-y-6" id="analytics-tab-container">
      {/* 1. Header */}
      <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
        <h2 className="text-xl font-black flex items-center gap-2">
          <ChartArea className="text-emerald-600" size={20} />
          <span>{t.analytics.title}</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">{t.analytics.desc}</p>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Waste Rate */}
        <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
              Number(wasteRate) < 10
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : Number(wasteRate) < 25
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {Number(wasteRate) < 10 ? (locale === 'en' ? 'Excellent' : '优秀') :
               Number(wasteRate) < 25 ? (locale === 'en' ? 'Fair' : '一般') :
               (locale === 'en' ? 'Needs Work' : '需改善')}
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.analytics.foodWasteRate}</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-gray-800 dark:text-slate-100">{wasteRate}</span>
            <span className="text-sm font-bold text-gray-400">%</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{t.analytics.foodWasteDesc}</p>
        </div>

        {/* Total Logged */}
        <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.analytics.totalLogged}</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-gray-800 dark:text-slate-100">{totalLogged}</span>
            <span className="text-sm font-bold text-gray-400">{locale === 'en' ? 'items' : '种'}</span>
          </div>
          <div className="flex gap-3 mt-2 text-[10px] text-gray-400 font-bold">
            <span>{locale === 'en' ? `Active: ${activeItems}` : `活跃: ${activeItems}`}</span>
            <span>{locale === 'en' ? `Depleted: ${depletedItems}` : `已用: ${depletedItems}`}</span>
          </div>
        </div>

        {/* Active Ratio */}
        <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.analytics.activeRatio}</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-emerald-600">{activeRatio}</span>
            <span className="text-sm font-bold text-gray-400">%</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
            {locale === 'en'
              ? `${activeItems} of ${totalLogged} ingredients are fresh in your pantry`
              : `${activeItems} / ${totalLogged} 种食材在库中`}
          </p>
        </div>
      </div>

      {/* 3. Transaction Log */}
      <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
        <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
          <div className="flex items-center gap-2">
            <Clock className="text-emerald-600" size={16} />
            <h3 className="font-bold text-sm tracking-tight">{t.analytics.txLogTitle}</h3>
          </div>
          <span className="text-[10px] text-gray-400 font-bold">
            {locale === 'en' ? `${transactions.length} entries` : `共 ${transactions.length} 条`}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            <ChefHat size={24} className="mx-auto mb-2 text-gray-300" />
            {locale === 'en' ? "No activity logged yet. Start by adding ingredients!" : "暂无活动记录。先添加一些食材吧！"}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {transactions.slice(0, 50).map((tx, idx) => {
              const reasonInfo = getReasonBadge(tx.reason);
              const isPositive = tx.deltaQuantity > 0;

              return (
                <div
                  key={tx.id || idx}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-neutral-50/50 border-gray-150'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-md ${reasonInfo.class}`}>
                      {reasonInfo[locale]}
                    </span>
                    <div>
                      <span className="font-bold">{tx.itemName}</span>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {formatTime(tx.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-black text-sm ${
                      isPositive ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {isPositive ? '+' : ''}{tx.deltaQuantity} {getUnitLabel(tx.unit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Danger Zone */}
      <div className={`rounded-2xl p-5 border border-red-500/30 shadow-xs ${isDark ? 'bg-red-500/5' : 'bg-red-50/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={16} />
            <div>
              <h3 className="font-bold text-sm text-red-500">{t.analytics.clearDataBtn}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {locale === 'en'
                  ? "Permanently delete all ingredients, plans, and logs"
                  : "永久删除所有食材、计划和日志"}
              </p>
            </div>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold transition-all"
            >
              {t.analytics.clearDataBtn}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-2 text-gray-400 hover:bg-gray-500/10 rounded-xl text-xs font-bold transition-all"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => { onResetDatabase(); setShowResetConfirm(false); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {locale === 'en' ? "Confirm Delete" : "确认删除"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
