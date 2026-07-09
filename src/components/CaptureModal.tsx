import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2, Check, AlertCircle, Sparkles, Camera, Type, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS, CATEGORY_MAP, STORAGE_MAP, UNIT_MAP, CATEGORY_KEYS } from '../lib/translations';

interface CaptureModalProps {
  onClose: () => void;
  onImport: (items: any[]) => Promise<void>;
  locale: 'en' | 'zh';
  theme: 'light' | 'dark' | 'sepia';
}

interface ParsedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  storage: string;
  expireDays: number;
  selected: boolean;
}

export default function CaptureModal({ onClose, onImport, locale, theme }: CaptureModalProps) {
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(locale === 'en' ? 'Please select an image file' : '请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImage(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(locale === 'en' ? 'Please drop an image file' : '请拖入图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImage(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (activeTab === 'photo' && !image) {
      setError(locale === 'en' ? 'Please upload an image first' : '请先上传图片');
      return;
    }
    if (activeTab === 'text' && !text.trim()) {
      setError(locale === 'en' ? 'Please enter some text first' : '请先输入文字');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const body: any = {};
      if (activeTab === 'photo' && image) {
        body.image = image;
      }
      if (activeTab === 'text' && text.trim()) {
        body.text = text.trim();
      }

      const response = await fetch('/api/parse-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let msg = locale === 'en' ? 'Failed to parse. Please try again.' : '解析失败，请重试。';
        try {
          const errBody = await response.json();
          if (errBody?.error) msg = errBody.error;
        } catch {
          /* non-JSON error body — keep generic message */
        }
        throw new Error(msg);
      }

      const data = await response.json();

      if (data.ingredients && data.ingredients.length > 0) {
        const items: ParsedItem[] = data.ingredients.map((item: any) => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          storage: item.storage,
          expireDays: item.expireDays,
          selected: true
        }));
        setParsedItems(items);
      } else {
        setError(locale === 'en' ? 'No ingredients found. Try a clearer image or text.' : '未找到食材，请重试。');
      }
    } catch (err: any) {
      setError(err.message || (locale === 'en' ? 'An error occurred during parsing' : '解析时发生错误'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportSelected = async () => {
    const selected = parsedItems.filter(item => item.selected);
    if (selected.length === 0) return;

    try {
      await onImport(selected);
      onClose();
    } catch (err) {
      console.error(err);
      setError(locale === 'en' ? 'Failed to import. Please try again.' : '导入失败，请重试。');
    }
  };

  const toggleItemSelected = (index: number) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const updateParsedItem = (index: number, field: keyof ParsedItem, value: any) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const getUnitLabel = (unit: string) => UNIT_MAP[unit]?.[locale] || unit;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`rounded-2xl border shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] ${cardStyle}`}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t.capture.title}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.capture.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* Tab selector */}
          <div className="flex border-b" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Camera size={14} />
              <span>{t.capture.photoTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'text'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Type size={14} />
              <span>{t.capture.textTab}</span>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Photo upload */}
            {activeTab === 'photo' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">{t.capture.photoDesc}</p>

                {!image ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDark
                        ? 'border-slate-700 hover:border-emerald-600 hover:bg-slate-900/50'
                        : 'border-gray-200 hover:border-emerald-600 hover:bg-gray-50/50'
                    }`}
                  >
                    <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-xs font-bold text-gray-400">{t.capture.dropzone}</p>
                    <p className="text-[10px] text-gray-400 mt-1 opacity-60">
                      {locale === 'en' ? 'JPG, PNG, WEBP' : '支持 JPG、PNG、WEBP'}
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: isDark ? '#222c44' : '#f3edd7' }}>
                    <img src={image} alt="Upload preview" className="w-full max-h-48 object-cover" />
                    <button
                      onClick={() => setImage(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Text input */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">{t.capture.textDesc}</p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.capture.placeholderText}
                  rows={6}
                  className={`w-full px-3.5 py-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none ${inputStyle}`}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Parse button */}
            {parsedItems.length === 0 && (
              <button
                onClick={handleParse}
                disabled={isProcessing || (activeTab === 'photo' ? !image : !text.trim())}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{t.capture.processing}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="fill-white" />
                    <span>{t.capture.runParse}</span>
                  </>
                )}
              </button>
            )}

            {/* Parsed results */}
            {parsedItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check size={14} />
                    {t.capture.parseSuccess.replace('{count}', parsedItems.filter(i => i.selected).length.toString())}
                  </span>
                  <button
                    onClick={() => setParsedItems([])}
                    className="text-[10px] text-gray-400 hover:text-gray-200 font-bold"
                  >
                    {locale === 'en' ? "Start Over" : "重新解析"}
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {parsedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        item.selected
                          ? isDark
                            ? 'bg-slate-900 border-slate-700'
                            : 'bg-emerald-50/30 border-emerald-200/50'
                          : isDark
                          ? 'bg-slate-900/50 border-slate-800 opacity-50'
                          : 'bg-gray-50/50 border-gray-150 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleItemSelected(idx)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                            item.selected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {item.selected && <Check size={12} />}
                        </button>

                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateParsedItem(idx, 'name', e.target.value)}
                          className={`flex-1 bg-transparent text-xs font-bold focus:outline-none border-b border-transparent focus:border-emerald-600/30 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}
                        />

                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateParsedItem(idx, 'quantity', Number(e.target.value))}
                            className={`w-12 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-center border ${inputStyle}`}
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => updateParsedItem(idx, 'unit', e.target.value)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${inputStyle}`}
                          >
                            {Object.entries(UNIT_MAP).map(([key, val]) => (
                              <option key={key} value={key}>{val[locale]}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 pl-7.5">
                        <select
                          value={item.category}
                          onChange={(e) => updateParsedItem(idx, 'category', e.target.value)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${inputStyle}`}
                        >
                          {CATEGORY_KEYS.map(cat => (
                            <option key={cat} value={cat}>{CATEGORY_MAP[cat][locale]}</option>
                          ))}
                        </select>

                        <select
                          value={item.storage}
                          onChange={(e) => updateParsedItem(idx, 'storage', e.target.value)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${inputStyle}`}
                        >
                          {Object.entries(STORAGE_MAP).map(([key, val]) => (
                            <option key={key} value={key}>{val[locale]}</option>
                          ))}
                        </select>

                        <span className="text-[10px] text-gray-400 font-bold ml-auto flex items-center gap-0.5">
                          <ChevronRight size={10} />
                          {locale === 'en' ? `${item.expireDays}d shelf-life` : `${item.expireDays}天保质期`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import button */}
                <button
                  onClick={handleImportSelected}
                  disabled={parsedItems.filter(i => i.selected).length === 0}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
                >
                  <Check size={14} />
                  <span>{t.capture.importBtn.replace('{count}', parsedItems.filter(i => i.selected).length.toString())}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
