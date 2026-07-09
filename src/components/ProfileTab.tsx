import React, { useState } from 'react';
import { ChefHat, Users, ChefHat as UtensilsCrossed, ShieldCheck, Wrench, Save, Check, AlertCircle, Heart, Target, Flame, Clock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { UserProfile, CookingSkill } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../lib/translations';

interface ProfileTabProps {
  profile: UserProfile;
  onSaveProfile: (updates: Partial<UserProfile>) => void;
  locale: 'en' | 'zh';
  theme: 'light' | 'dark' | 'sepia';
}

// Western cuisine list
const CUISINE_OPTIONS = [
  'American', 'Italian', 'Mexican', 'Asian Fusion', 'Mediterranean',
  'French', 'Japanese', 'Korean', 'Chinese', 'Indian',
  'Thai', 'Vietnamese', 'Middle Eastern', 'Greek', 'Spanish',
  'BBQ', 'Cajun', 'German', 'British'
];

// Western allergens
const ALLERGEN_OPTIONS = [
  'Gluten', 'Dairy', 'Eggs', 'Peanuts', 'Tree Nuts',
  'Shellfish', 'Soy', 'Fish', 'Sesame', 'Mustard',
  'Sulfites', 'Celery', 'Lupin', 'Mollusks'
];

// Western dietary goals
const DIETARY_GOAL_OPTIONS = [
  'Balanced Nutrition', 'High Protein', 'Low Carb', 'Keto',
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Low Sodium', 'Low Fat', 'Mediterranean Diet', 'Whole30',
  'Paleo', 'Pescatarian'
];

// Kitchen tools
const KITCHEN_TOOL_OPTIONS = [
  'Stove', 'Oven', 'Microwave', 'Air Fryer', 'Blender',
  'Food Processor', 'Slow Cooker', 'Instant Pot', 'Grill',
  'Rice Cooker', 'Toaster Oven', 'Stand Mixer', 'Dutch Oven',
  'Cast Iron Skillet', 'Pressure Cooker', 'Immersion Blender'
];

export default function ProfileTab({ profile, onSaveProfile, locale, theme }: ProfileTabProps) {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    household: true,
    cuisines: true,
    dietary: true,
    skills: true,
    tools: true
  });

  const t = TRANSLATIONS[locale];

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const cardStyle = isDark
    ? 'bg-[#151c2c] border-[#222c44] text-slate-100'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422]'
    : 'bg-white border-neutral-200/70 text-gray-800';

  const inputStyle = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-600'
    : isSepia
    ? 'bg-[#fcfaf2] border-[#e8dfd1] text-[#433422] placeholder-[#a1927d] focus:border-[#c4a478]'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-emerald-700';

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveProfile({
        householdSize: localProfile.householdSize,
        servingsMultiplier: localProfile.servingsMultiplier,
        cuisinesPreferred: localProfile.cuisinesPreferred,
        allergens: localProfile.allergens,
        dietaryGoals: localProfile.dietaryGoals,
        cookingSkill: localProfile.cookingSkill,
        kitchenTools: localProfile.kitchenTools
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArrayItem = (key: 'cuisinesPreferred' | 'allergens' | 'dietaryGoals' | 'kitchenTools', value: string) => {
    setLocalProfile(prev => {
      const arr = prev[key];
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  const renderChipSelector = (
    options: string[],
    selected: string[],
    onToggle: (val: string) => void,
    accentColor: string = 'emerald'
  ) => {
    const colorClasses: Record<string, { active: string; idle: string }> = {
      emerald: {
        active: 'bg-emerald-700 text-white border-emerald-700',
        idle: isDark
          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      },
      red: {
        active: 'bg-red-600 text-white border-red-600',
        idle: isDark
          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      },
      amber: {
        active: 'bg-amber-600 text-white border-amber-600',
        idle: isDark
          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      },
      blue: {
        active: 'bg-blue-600 text-white border-blue-600',
        idle: isDark
          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }
    };

    const cls = colorClasses[accentColor] || colorClasses.emerald;

    return (
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                isSelected ? cls.active : cls.idle
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  };

  const SectionHeader = ({ icon, title, sectionKey }: { icon: React.ReactNode; title: string; sectionKey: string }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-emerald-600">{icon}</span>
        <h3 className="font-bold text-sm tracking-tight">{title}</h3>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
    </button>
  );

  return (
    <div className="space-y-5" id="profile-tab-container">
      {/* Save Success Banner */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-xs shadow-lg"
          >
            <Check size={16} />
            <span>{t.profile.saveSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <div className={`rounded-2xl p-5 border shadow-xs ${cardStyle}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
            <ChefHat size={28} />
          </div>
          <div>
            <h2 className="text-lg font-black">{t.profile.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t.profile.desc}</p>
          </div>
        </div>
      </div>

      {/* Household Size Section */}
      <div className={`rounded-2xl p-5 border shadow-xs space-y-4 ${cardStyle}`}>
        <SectionHeader icon={<Users size={16} />} title={t.profile.household} sectionKey="household" />
        <AnimatePresence>
          {expandedSections.household && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.profile.household}</label>
                    <span className="text-2xl font-black text-emerald-600">{localProfile.householdSize}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={localProfile.householdSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setLocalProfile(prev => ({
                        ...prev,
                        householdSize: newSize,
                        servingsMultiplier: newSize / 2
                      }));
                    }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-bold">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  {t.profile.householdDesc} ({locale === 'en' ? `Multiplier: ${localProfile.servingsMultiplier.toFixed(1)}x` : `份量乘数: ${localProfile.servingsMultiplier.toFixed(1)}x`})
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cuisines Section */}
      <div className={`rounded-2xl p-5 border shadow-xs space-y-4 ${cardStyle}`}>
        <SectionHeader icon={<UtensilsCrossed size={16} />} title={t.profile.cuisines} sectionKey="cuisines" />
        <AnimatePresence>
          {expandedSections.cuisines && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                {renderChipSelector(CUISINE_OPTIONS, localProfile.cuisinesPreferred, (val) => toggleArrayItem('cuisinesPreferred', val), 'emerald')}
                {localProfile.cuisinesPreferred.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {locale === 'en' ? "Select at least one cuisine preference" : "请至少选择一种菜系偏好"}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Allergens & Dietary Goals Section */}
      <div className={`rounded-2xl p-5 border shadow-xs space-y-4 ${cardStyle}`}>
        <SectionHeader icon={<ShieldCheck size={16} />} title={t.profile.allergens} sectionKey="dietary" />
        <AnimatePresence>
          {expandedSections.dietary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 pt-2">
                {/* Allergens */}
                <div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <AlertCircle size={12} />
                    {locale === 'en' ? "Allergies (Strictly Avoided):" : "过敏原（严格避开）："}
                  </span>
                  {renderChipSelector(ALLERGEN_OPTIONS, localProfile.allergens, (val) => toggleArrayItem('allergens', val), 'red')}
                </div>

                {/* Dietary Goals */}
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Target size={12} />
                    {t.profile.dietaryGoals}:
                  </span>
                  {renderChipSelector(DIETARY_GOAL_OPTIONS, localProfile.dietaryGoals, (val) => toggleArrayItem('dietaryGoals', val), 'amber')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cooking Skill Section */}
      <div className={`rounded-2xl p-5 border shadow-xs space-y-4 ${cardStyle}`}>
        <SectionHeader icon={<Flame size={16} />} title={t.profile.cookingSkill} sectionKey="skills" />
        <AnimatePresence>
          {expandedSections.skills && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {(['beginner', 'intermediate', 'advanced'] as CookingSkill[]).map(skill => {
                  const isSelected = localProfile.cookingSkill === skill;
                  return (
                    <button
                      key={skill}
                      onClick={() => setLocalProfile(prev => ({ ...prev, cookingSkill: skill }))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-100'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {skill === 'beginner' ? '1' : skill === 'intermediate' ? '2' : '3'}
                        </span>
                        <span className="font-black text-xs">{t.profile.cookingSkills[skill]}</span>
                      </div>
                      <p className="text-[10px] mt-2 opacity-80 leading-relaxed">
                        {t.profile.skillsDesc[skill]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kitchen Tools Section */}
      <div className={`rounded-2xl p-5 border shadow-xs space-y-4 ${cardStyle}`}>
        <SectionHeader icon={<Wrench size={16} />} title={t.profile.kitchenTools} sectionKey="tools" />
        <AnimatePresence>
          {expandedSections.tools && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                {renderChipSelector(KITCHEN_TOOL_OPTIONS, localProfile.kitchenTools, (val) => toggleArrayItem('kitchenTools', val), 'blue')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => setLocalProfile(profile)}
          className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:bg-gray-500/10 rounded-xl transition-all"
        >
          {t.common.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{locale === 'en' ? "Saving..." : "保存中..."}</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check size={14} />
              <span>{t.profile.saveSuccess}</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>{t.common.save}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
