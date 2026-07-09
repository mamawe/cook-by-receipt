import React, { useState, useEffect } from 'react';
import { ChefHat, Utensils, BookOpen, Sparkles, Plus, Search, Calendar, User, ChartArea, Loader2, Sparkle, Sun, Moon, Eye, Compass, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IngredientItem, UserProfile, MealPlan, InventoryTransaction, MealSlot, MealPlanRecipe, Recipe, CookingSkill, RecipeDifficulty } from './types';
import {
  ensureAuth,
  getUserProfile,
  updateUserProfile,
  getIngredients,
  saveIngredient,
  deleteIngredient,
  getMealPlans,
  saveMealPlan,
  getTransactions,
  logTransaction,
  db
} from './lib/firebase';
import { doc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { TRANSLATIONS } from './lib/translations';
import { toLocalDateStr } from './lib/date';

// Subcomponents
import TodayTab from './components/TodayTab';
import PantryTab from './components/PantryTab';
import PlanTab from './components/PlanTab';
import ProfileTab from './components/ProfileTab';
import AnalyticsTab from './components/AnalyticsTab';
import CaptureModal from './components/CaptureModal';

// Tab keys are now English-native strings
type TabKey = 'home' | 'pantry' | 'plan' | 'analytics' | 'profile';

export default function App() {
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // App data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  // Active plan state (normally the one marked as draft/active)
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);

  // Modal control
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  // Globalization states — English is default
  const [locale, setLocale] = useState<'en' | 'zh'>('en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  const t = TRANSLATIONS[locale];

  // Dynamic colors based on active theme
  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const bgStyle = isDark
    ? 'bg-[#0B0F19] text-slate-100'
    : isSepia
    ? 'bg-[#F4EFE6] text-[#433422]'
    : 'bg-[#FAF9F6] text-gray-800';

  const headerStyle = isDark
    ? 'bg-[#151c2c] border-[#222c44] text-slate-100 shadow-sm'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422] shadow-sm'
    : 'bg-white border-amber-100/60 text-gray-800 shadow-xs';

  const sidebarCardStyle = isDark
    ? 'bg-[#151c2c] border-[#222c44]'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1]'
    : 'bg-white border-gray-150';

  // Initialize Auth & App State
  useEffect(() => {
    async function initApp() {
      try {
        setIsLoading(true);
        const uid = await ensureAuth();
        setUserId(uid);

        // Load Profile
        const userProf = await getUserProfile(uid);
        setProfile(userProf);

        // Load Ingredients
        const ingList = await getIngredients(uid);
        setIngredients(ingList);

        // Load Meal Plans
        const planList = await getMealPlans(uid);
        setMealPlans(planList);
        const curActive = planList.find(p => p.status === 'active' || p.status === 'draft') || null;
        setActivePlan(curActive);

        // Load Transactions
        const txList = await getTransactions(uid);
        setTransactions(txList);
      } catch (err) {
        console.error('Error loading app initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initApp();
  }, []);

  // Sync active plan updates back to mealPlans list and Firestore
  const updateActivePlanState = async (updatedPlan: MealPlan) => {
    setActivePlan(updatedPlan);
    setMealPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    await saveMealPlan(updatedPlan);
  };

  // ----------------------------------------------------
  // Ingredients Handlers
  // ----------------------------------------------------
  const handleAddIngredient = async (newItem: Omit<IngredientItem, 'id' | 'userId'>) => {
    const id = `ing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: IngredientItem = {
      id,
      userId,
      ...newItem
    };

    const updated = [...ingredients, fullItem];
    setIngredients(updated);
    await saveIngredient(fullItem);
  };

  const handleUpdateIngredient = async (id: string, updates: Partial<IngredientItem>) => {
    const updated = ingredients.map(item => {
      if (item.id === id) {
        const result = { ...item, ...updates };
        saveIngredient(result).catch(console.error);
        return result;
      }
      return item;
    });
    setIngredients(updated);
  };

  const handleDeleteIngredient = async (id: string) => {
    setIngredients(prev => prev.filter(item => item.id !== id));
    await deleteIngredient(id);
  };

  const handleRestockIngredient = async (id: string) => {
    const itemToRestock = ingredients.find(item => item.id === id);
    if (!itemToRestock) return;

    const updated = ingredients.map(item => {
      if (item.id === id) {
        const result = {
          ...item,
          status: 'active' as const,
          remainingQuantity: item.quantity // Restore to full initial quantity
        };
        saveIngredient(result).catch(console.error);
        return result;
      }
      return item;
    });
    setIngredients(updated);

    // Log transaction
    await handleLogTransaction(id, itemToRestock.name, itemToRestock.quantity, 'add', itemToRestock.unit);
  };

  // Import ingredients from scan/text confirmation page
  const handleImportIngredients = async (itemsToImport: any[]) => {
    const today = new Date();
    const batchList: IngredientItem[] = [];

    for (let i = 0; i < itemsToImport.length; i++) {
      const parsed = itemsToImport[i];
      const expireDate = new Date();
      expireDate.setDate(today.getDate() + Number(parsed.expireDays));
      const expireStr = toLocalDateStr(expireDate);

      const id = `ing_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`;
      const fullItem: IngredientItem = {
        id,
        userId,
        name: parsed.name,
        category: parsed.category,
        quantity: parsed.quantity,
        unit: parsed.unit,
        purchasedAt: toLocalDateStr(today),
        expireAt: expireStr,
        storage: parsed.storage,
        remainingQuantity: parsed.quantity,
        status: 'active',
        rawSource: 'text'
      };

      batchList.push(fullItem);
      await saveIngredient(fullItem);

      // Log transaction
      await handleLogTransaction(id, parsed.name, parsed.quantity, 'add', parsed.unit);
    }

    setIngredients(prev => [...prev, ...batchList]);
  };

  // ----------------------------------------------------
  // Transactions Handler
  // ----------------------------------------------------
  const handleLogTransaction = async (
    itemId: string,
    itemName: string,
    delta: number,
    reason: 'cook' | 'waste' | 'manual_edit' | 'expire' | 'add',
    unit: any
  ) => {
    const tx: Omit<InventoryTransaction, 'id'> = {
      userId,
      itemId,
      itemName,
      deltaQuantity: delta,
      unit,
      reason,
      createdAt: new Date().toISOString()
    };

    // Update state first
    const mockId = `tx_temp_${Date.now()}`;
    const fullTx: InventoryTransaction = { id: mockId, ...tx };
    setTransactions(prev => [fullTx, ...prev]);

    // Save to DB
    await logTransaction(tx);
  };

  // ----------------------------------------------------
  // Profile Handlers
  // ----------------------------------------------------
  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await updateUserProfile(userId, updates);
  };

  // ----------------------------------------------------
  // Meal Plan Handlers (Gemini API integration)
  // ----------------------------------------------------
  const handleGeneratePlan = async (days: number) => {
    if (!profile) return;

    try {
      const activeIngredients = ingredients.filter(i => i.status === 'active');

      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: activeIngredients,
          profile: profile,
          daysCount: days
        })
      });

      if (!response.ok) {
        let msg = 'Failed to generate meal plan. Please check the backend API service.';
        try {
          const errBody = await response.json();
          if (errBody?.error) msg = errBody.error;
        } catch {
          /* non-JSON error body — keep generic message */
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (data.recipes && data.recipes.length > 0) {
        const today = new Date();
        const startStr = toLocalDateStr(today);

        const end = new Date();
        end.setDate(today.getDate() + (days - 1));
        const endStr = toLocalDateStr(end);

        // Format recipes as MealPlanRecipes
        const formattedRecipes: MealPlanRecipe[] = data.recipes.map((recipe: any, index: number) => ({
          id: `meal_${Date.now()}_${index}`,
          date: recipe.date || startStr,
          mealSlot: recipe.mealSlot || 'lunch',
          recipe: {
            id: recipe.id || `rec_${Date.now()}_${index}`,
            title: recipe.title || 'Creative Dish',
            cuisine: recipe.cuisine || 'Continental',
            difficulty: (recipe.difficulty || 'easy') as RecipeDifficulty,
            cookTimeMin: recipe.cookTimeMin || 25,
            steps: recipe.steps || [],
            nutrition: recipe.nutrition || { calories: 350, protein: 15, fat: 10, carbs: 45 },
            ingredients: recipe.ingredientsUsed || [],
            source: 'llm_generated'
          },
          status: 'planned'
        }));

        const newPlan: MealPlan = {
          id: `plan_${Date.now()}`,
          userId,
          startDate: startStr,
          endDate: endStr,
          mealsPerDay: 3,
          cuisines: profile.cuisinesPreferred,
          constraints: {
            cookingSkill: profile.cookingSkill,
            allergens: profile.allergens
          },
          status: 'active',
          recipes: formattedRecipes,
          createdAt: new Date().toISOString()
        };

        // Complete any existing active plans first
        if (activePlan) {
          await saveMealPlan({ ...activePlan, status: 'completed' });
        }

        await updateActivePlanState(newPlan);
      }
    } catch (err) {
      console.error(err);
      alert('Error generating menu, please try again later.');
    }
  };

  const handleToggleMealStatus = async (mealId: string, status: 'planned' | 'cooked' | 'skipped' | 'replaced') => {
    if (!activePlan) return;

    const targetMeal = activePlan.recipes.find(r => r.id === mealId);
    if (!targetMeal) return;

    const previousStatus = targetMeal.status;

    const updatedRecipes = activePlan.recipes.map(meal => {
      if (meal.id === mealId) {
        return { ...meal, status };
      }
      return meal;
    });

    const updatedPlan = { ...activePlan, recipes: updatedRecipes };
    await updateActivePlanState(updatedPlan);

    // If transitioned to 'cooked' from another status, automatically deduct ingredients!
    if (status === 'cooked' && previousStatus !== 'cooked') {
      const itemsToDeduct = targetMeal.recipe.ingredients;

      for (const reqItem of itemsToDeduct) {
        const match = ingredients.find(ing =>
          ing.status === 'active' &&
          (ing.name.toLowerCase().includes(reqItem.name.toLowerCase()) ||
           reqItem.name.toLowerCase().includes(ing.name.toLowerCase()))
        );

        if (match) {
          const deductionAmount = reqItem.quantity;
          const currentAmount = match.remainingQuantity;
          const newAmount = Math.max(0, currentAmount - deductionAmount);

          if (newAmount === 0) {
            await handleUpdateIngredient(match.id, { remainingQuantity: 0, status: 'depleted' });
            await handleLogTransaction(match.id, match.name, -currentAmount, 'cook', match.unit);
          } else {
            await handleUpdateIngredient(match.id, { remainingQuantity: newAmount });
            await handleLogTransaction(match.id, match.name, -deductionAmount, 'cook', match.unit);
          }
        }
      }
    }
  };

  // Regenerate a single meal slot dynamically!
  const handleRegenerateSingleMeal = async (date: string, slot: MealSlot) => {
    if (!activePlan || !profile) return;

    try {
      const activeIngredients = ingredients.filter(i => i.status === 'active');
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: activeIngredients,
          profile: profile,
          daysCount: 1
        })
      });

      if (!response.ok) throw new Error('Failed to swap recipe');
      const data = await response.json();

      if (data.recipes && data.recipes.length > 0) {
        const newRecipeRaw = data.recipes[0];

        const freshRecipe: Recipe = {
          id: newRecipeRaw.id || `rec_single_${Date.now()}`,
          title: newRecipeRaw.title,
          cuisine: newRecipeRaw.cuisine,
          difficulty: newRecipeRaw.difficulty as RecipeDifficulty,
          cookTimeMin: newRecipeRaw.cookTimeMin,
          steps: newRecipeRaw.steps,
          nutrition: newRecipeRaw.nutrition,
          ingredients: newRecipeRaw.ingredientsUsed,
          source: 'llm_generated'
        };

        const updatedRecipes = activePlan.recipes.map(meal => {
          if (meal.date === date && meal.mealSlot === slot) {
            return {
              ...meal,
              recipe: freshRecipe,
              status: 'replaced' as const
            };
          }
          return meal;
        });

        const updatedPlan = { ...activePlan, recipes: updatedRecipes };
        await updateActivePlanState(updatedPlan);
      }
    } catch (err) {
      console.error('Error replacing meal recipe:', err);
      alert('Failed to swap recipe, please try again.');
    }
  };

  // ----------------------------------------------------
  // Seed Database Helper (for instant trial)
  // ----------------------------------------------------
  const handleSeedTestingData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();

      // Western sample pantry items with imperial units
      const testItems = [
        { name: 'Fresh Tomatoes', category: 'vegetables', quantity: 5, unit: 'pcs', storage: 'fridge', expireDays: 4 },
        { name: 'Organic Eggs', category: 'dairy_eggs', quantity: 12, unit: 'pcs', storage: 'fridge', expireDays: 14 },
        { name: 'Beef Sirloin', category: 'meat_poultry', quantity: 1.5, unit: 'lb', storage: 'freezer', expireDays: 30 },
        { name: 'Fresh Spinach', category: 'vegetables', quantity: 1, unit: 'bag', storage: 'fridge', expireDays: 3 },
        { name: 'Whole Milk', category: 'dairy_eggs', quantity: 1, unit: 'gallon', storage: 'fridge', expireDays: 6 },
        { name: 'Cheddar Cheese', category: 'dairy_eggs', quantity: 8, unit: 'oz', storage: 'fridge', expireDays: 21 },
        { name: 'Chicken Breast', category: 'meat_poultry', quantity: 2, unit: 'lb', storage: 'fridge', expireDays: 2 },
        { name: 'Bell Peppers', category: 'vegetables', quantity: 3, unit: 'pcs', storage: 'fridge', expireDays: 5 }
      ];

      const batchList: IngredientItem[] = [];

      for (let i = 0; i < testItems.length; i++) {
        const item = testItems[i];
        const expireDate = new Date();
        expireDate.setDate(today.getDate() + item.expireDays);

        const id = `ing_seed_${Date.now()}_${i}`;
        const fullItem: IngredientItem = {
          id,
          userId,
          name: item.name,
          category: item.category as any,
          quantity: item.quantity,
          unit: item.unit as any,
          purchasedAt: toLocalDateStr(today),
          expireAt: toLocalDateStr(expireDate),
          storage: item.storage as any,
          remainingQuantity: item.quantity,
          status: 'active'
        };

        batchList.push(fullItem);
        await saveIngredient(fullItem);
        await handleLogTransaction(id, item.name, item.quantity, 'add', item.unit);
      }

      setIngredients(batchList);
    } catch (err) {
      console.error('Error seeding demo data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      const ingSnap = await getDocs(query(collection(db, 'ingredients'), where('userId', '==', userId)));
      for (const d of ingSnap.docs) { await deleteDoc(doc(db, 'ingredients', d.id)); }

      const planSnap = await getDocs(query(collection(db, 'meal_plans'), where('userId', '==', userId)));
      for (const d of planSnap.docs) { await deleteDoc(doc(db, 'meal_plans', d.id)); }

      const txSnap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', userId)));
      for (const d of txSnap.docs) { await deleteDoc(doc(db, 'transactions', d.id)); }

      setIngredients([]);
      setMealPlans([]);
      setActivePlan(null);
      setTransactions([]);
    } catch (err) {
      console.error('Reset database failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${bgStyle}`}>
        <Loader2 size={40} className="text-emerald-700 animate-spin mb-4" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.common.loading}</span>
      </div>
    );
  }

  const activeIngredientsCount = ingredients.filter(i => i.status === 'active').length;

  // Tab navigation config — English-native keys
  const navItems: { key: TabKey; icon: React.ReactNode; label: string; badge?: number; highlight?: boolean }[] = [
    { key: 'home', icon: <Utensils size={18} />, label: t.tabs.home },
    { key: 'pantry', icon: <Search size={18} />, label: t.tabs.pantry, badge: activeIngredientsCount > 0 ? activeIngredientsCount : undefined },
    { key: 'plan', icon: <Calendar size={18} />, label: t.tabs.plan, highlight: !!activePlan },
    { key: 'analytics', icon: <ChartArea size={18} />, label: t.tabs.analytics },
    { key: 'profile', icon: <User size={18} />, label: t.tabs.profile }
  ];

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${bgStyle}`}>
      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 transition-colors duration-200 ${headerStyle}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-black shadow-md">
                FC
              </div>
              <div>
                <h1 className="font-black tracking-tight text-base leading-none">
                  {t.appName}
                </h1>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mt-1">
                  {t.tagline}
                </span>
              </div>
            </div>

            {/* Config & Action controls */}
            <div className="flex items-center gap-4">
              {/* Theme Selector */}
              <div className="flex bg-gray-500/10 p-0.5 rounded-xl border border-gray-400/10">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  title="Day Mode"
                  aria-label="Light mode"
                >
                  <Sun size={14} />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-slate-900 text-amber-500 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  title="Night Mode"
                  aria-label="Dark mode"
                >
                  <Moon size={14} />
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`p-1.5 rounded-lg transition-all ${theme === 'sepia' ? 'bg-[#fcfaf2] text-[#5c4a37] shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  title="Eye Care Mode"
                  aria-label="Sepia mode"
                >
                  <Eye size={14} />
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex bg-gray-500/10 p-0.5 rounded-xl border border-gray-400/10 text-[10px] font-black uppercase tracking-wider">
                <button
                  onClick={() => setLocale('en')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${locale === 'en' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLocale('zh')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${locale === 'zh' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  ZH
                </button>
              </div>

              {activeIngredientsCount === 0 && (
                <button
                  onClick={handleSeedTestingData}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 active:scale-98"
                >
                  <Sparkle size={12} className="fill-amber-600" />
                  <span>{t.oneClickSeed}</span>
                </button>
              )}

              <button
                onClick={() => setIsCaptureModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Plus size={14} />
                <span>{t.addPurchase}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Column Sidebar (Menu navigation) */}
          <div className="md:col-span-1 space-y-4 shrink-0">
            <div className={`rounded-2xl border p-4 space-y-1.5 ${sidebarCardStyle}`}>
              <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">
                {locale === 'en' ? "NAVIGATION" : "导航栏"}
              </span>

              {navItems.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between group ${
                    activeTab === tab.key
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={activeTab === tab.key ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </div>

                  {tab.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === tab.key ? 'bg-white text-emerald-800' : 'bg-emerald-500/20 text-emerald-600'}`}>
                      {tab.badge}
                    </span>
                  )}

                  {tab.highlight && !tab.badge && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Explore content links — minimal, passive, non-intrusive */}
            <div className={`rounded-2xl border p-4 space-y-2.5 ${sidebarCardStyle}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Compass size={12} className="text-emerald-600" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Explore</span>
              </div>
              <a href="/guides/food-storage-guide.html" className="flex items-center justify-between text-[11px] font-bold text-gray-500 hover:text-emerald-600 transition-colors group">
                <span className="flex items-center gap-1.5"><BookOpen size={11} /> Food Storage Guide</span>
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="/recipes/" className="flex items-center justify-between text-[11px] font-bold text-gray-500 hover:text-emerald-600 transition-colors group">
                <span className="flex items-center gap-1.5"><Utensils size={11} /> Zero-Waste Recipes</span>
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="/tools/storage-calculator.html" className="flex items-center justify-between text-[11px] font-bold text-gray-500 hover:text-emerald-600 transition-colors group">
                <span className="flex items-center gap-1.5"><Clock size={11} /> Storage Calculator</span>
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="/guides/meal-planning-101.html" className="flex items-center justify-between text-[11px] font-bold text-gray-500 hover:text-emerald-600 transition-colors group">
                <span className="flex items-center gap-1.5"><Calendar size={11} /> Meal Planning 101</span>
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            {/* Micro branding card */}
            <div className={`rounded-2xl border p-4 text-[11px] leading-relaxed font-semibold uppercase tracking-wide text-amber-700 bg-amber-500/[0.03] border-amber-500/15`}>
              <span>{t.pantryTips}</span>
              <p className="mt-1 font-medium lowercase first-letter:uppercase leading-normal text-gray-400">
                {t.pantryTipContent}
              </p>
            </div>
          </div>

          {/* Right Column (Dynamic Tabs content) */}
          <div className="md:col-span-3 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'home' && (
                  <TodayTab
                    activePlan={activePlan}
                    ingredients={ingredients}
                    profile={profile!}
                    onNavigateToTab={(tabName) => setActiveTab(tabName as TabKey)}
                    onToggleMealStatus={handleToggleMealStatus}
                    onRegenerateSingleMeal={handleRegenerateSingleMeal}
                    locale={locale}
                    theme={theme}
                    transactions={transactions}
                    onRestockIngredient={handleRestockIngredient}
                  />
                )}

                {activeTab === 'pantry' && (
                  <PantryTab
                    ingredients={ingredients}
                    onAddIngredient={handleAddIngredient}
                    onUpdateIngredient={handleUpdateIngredient}
                    onDeleteIngredient={handleDeleteIngredient}
                    onLogTransaction={handleLogTransaction}
                    locale={locale}
                    theme={theme}
                  />
                )}

                {activeTab === 'plan' && (
                  <PlanTab
                    activePlan={activePlan}
                    ingredients={ingredients}
                    profile={profile!}
                    onGeneratePlan={handleGeneratePlan}
                    onToggleMealStatus={handleToggleMealStatus}
                    onRegenerateSingleMeal={handleRegenerateSingleMeal}
                    locale={locale}
                    theme={theme}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsTab
                    ingredients={ingredients}
                    transactions={transactions}
                    onResetDatabase={handleResetDatabase}
                    locale={locale}
                    theme={theme}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileTab
                    profile={profile!}
                    onSaveProfile={handleSaveProfile}
                    locale={locale}
                    theme={theme}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Capture scan modal */}
      <AnimatePresence>
        {isCaptureModalOpen && (
          <CaptureModal
            onClose={() => setIsCaptureModalOpen(false)}
            onImport={handleImportIngredients}
            locale={locale}
            theme={theme}
          />
        )}
      </AnimatePresence>

      <footer className="py-6 mt-12 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>{t.footerText}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a href="/privacy" className="hover:text-emerald-600 transition-colors">{t.privacyLink}</a>
            <span className="text-gray-300">·</span>
            <a href="/terms" className="hover:text-emerald-600 transition-colors">{t.termsLink}</a>
            <span className="text-gray-300">·</span>
            <a href="/recipes/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">{t.recipesLink}</a>
            <span className="text-gray-300">·</span>
            <a href="/blog/reduce-food-waste.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">{t.blogLink}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
