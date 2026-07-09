/**
 * Receipt 2 meal Translation Strings & Mappings
 * English is the native language. Chinese (zh) is a localization.
 */

export const TRANSLATIONS = {
  en: {
    appName: "Receipt 2 meal",
    tagline: "Smart Pantry & Zero-Waste Meal Planner",
    footerText: "© 2026 Receipt 2 meal. Turn your fridge into a zero-waste kitchen.",
    privacyLink: "Privacy Policy",
    termsLink: "Terms of Service",
    recipesLink: "Zero-Waste Recipes",
    blogLink: "Food-Waste Guide",
    pantryTips: "💡 FOOD SAVER TIP:",
    pantryTipContent: "Store foods in the correct zones to prevent early spoilage. Receipt 2 meal helps maximize every ingredient's lifecycle, saving money and reducing your carbon footprint.",
    oneClickSeed: "Load Sample Pantry",
    addPurchase: "Add Groceries",
    tabs: {
      home: "Dashboard",
      pantry: "My Pantry",
      plan: "Meal Planner",
      analytics: "Analytics",
      profile: "Preferences"
    },
    common: {
      loading: "Loading your pantry...",
      save: "Save Changes",
      cancel: "Cancel",
      add: "Add",
      delete: "Delete",
      edit: "Edit",
      confirm: "Confirm",
      back: "Go Back",
      status: "Status",
      category: "Category",
      quantity: "Quantity",
      unit: "Unit",
      storage: "Storage",
      daysLeft: "days left",
      expired: "Expired",
      today: "Today",
      days: "days",
      actions: "Actions",
      searchPlaceholder: "Search ingredients...",
      noData: "No ingredients logged yet.",
      all: "All Categories"
    },
    today: {
      greeting: "Welcome back, Chef",
      summaryText: "You have {count} active ingredients in your pantry. Let's make something incredible.",
      getStarted: "Generate Your Weekly Plan",
      noPlanTitle: "No Active Meal Plan",
      noPlanDesc: "Let Receipt 2 meal's AI create a personalized 3-day or 7-day culinary experience tailored to your exact kitchen inventory and dietary preferences.",
      weeklyPlanBtn: "Curate Meal Plan",
      todaysMenu: "Today's Menu",
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      cookedBtn: "Mark as Cooked",
      cookedLabel: "Enjoyed & Ingredients Deducted",
      skipBtn: "Skip",
      replaceBtn: "Swap Recipe",
      quickStats: "Inventory Overview",
      expiringSoon: "Expiring Soon",
      freshItems: "Fresh",
      smartRestockTitle: "Smart Restock Planner",
      smartRestockDesc: "These ingredients are depleted but were frequently used in recent meals. Tap to add them back to your shopping list.",
      smartRestockEmpty: "No depleted ingredients with frequent cooking history yet. Cook more recipes to build your restock history!",
      addBackToPantry: "Restock",
      freqUsedLabel: "Used {count} times recently",
      restockSuccess: "Successfully restocked {name}!",
      difficulty: "Difficulty",
      cookTime: "Cook Time",
      nutrition: "Nutrition per Serving",
      calories: "Calories",
      protein: "Protein",
      fat: "Fat",
      carbs: "Carbs",
      steps: "Instructions",
      ingredientsNeeded: "Ingredients Used"
    },
    pantry: {
      title: "My Pantry Inventory",
      desc: "Manage and monitor your fridge, freezer, and pantry items.",
      chartTitle: "Category Breakdown",
      addItemTitle: "Add New Ingredient",
      nameLabel: "Ingredient Name",
      categoryLabel: "Category",
      quantityLabel: "Quantity",
      unitLabel: "Unit",
      storageLabel: "Storage",
      expireLabel: "Days to Expiry",
      remainingLabel: "Remaining",
      statusLabel: "Status",
      activeState: "Fresh / Active",
      depletedState: "Depleted / Used",
      expiredState: "Expired",
      discardedState: "Discarded / Wasted",
      saveItem: "Save Item",
      editItem: "Update Item",
      toastAdded: "Added {name} to your pantry!",
      toastUpdated: "Updated {name}.",
      toastDeleted: "Removed {name}.",
      confirmDelete: "Are you sure you want to remove this item?"
    },
    plan: {
      title: "AI Meal Planner",
      desc: "Tailored multi-day menus optimized to use ingredients before they expire.",
      duration: "Plan Duration",
      threeDays: "3-Day Plan",
      sevenDays: "7-Day Full Week",
      generating: "Curating your meal plan...",
      generateBtn: "Generate Meal Plan",
      activePlanTitle: "Active Plan ({start} to {end})",
      swapSuccess: "Recipe swapped successfully!",
      nutritionalTarget: "Target Macro Balance"
    },
    analytics: {
      title: "Kitchen Sustainability & Logs",
      desc: "Track inventory changes, cooking compliance, and food waste metrics.",
      foodWasteRate: "Food Waste Rate",
      foodWasteDesc: "Percentage of ingredients discarded or expired vs. cooked.",
      totalLogged: "Total Ingredients Managed",
      activeRatio: "Active Stock",
      txLogTitle: "Recent Activity Log",
      txCooked: "Cooked",
      txWasted: "Wasted",
      txAdded: "Added",
      txManual: "Adjusted",
      txExpired: "Expired",
      clearDataBtn: "Clear All Data",
      clearConfirm: "This will permanently delete all ingredients, meal plans, and logs. This action cannot be undone. Proceed?"
    },
    profile: {
      title: "Chef Profile & Kitchen Setup",
      desc: "Customize your dietary preferences, portion sizes, and cooking constraints.",
      household: "Household Size",
      householdDesc: "Portion multiplier applied to recipe ingredients.",
      cuisines: "Preferred Cuisines",
      allergens: "Allergies & Dietary Restrictions",
      cookingSkill: "Cooking Skill Level",
      kitchenTools: "Available Kitchen Tools",
      dietaryGoals: "Dietary Goals",
      saveSuccess: "Preferences saved successfully!",
      cookingSkills: {
        beginner: "Beginner",
        intermediate: "Home Chef",
        advanced: "Advanced"
      },
      skillsDesc: {
        beginner: "Simple, foolproof steps",
        intermediate: "Standard home recipes",
        advanced: "Creative & complex dishes"
      }
    },
    capture: {
      title: "Grocery Import Assistant",
      desc: "Use AI to parse grocery receipts, ingredient photos, or text lists.",
      photoTab: "Scan Receipt / Photo",
      textTab: "Paste Shopping List",
      photoDesc: "Upload an image of your grocery receipt or ingredients on your counter.",
      textDesc: "Type or paste your grocery list (e.g., '1lb chicken breast, 3 tomatoes, 1 dozen eggs').",
      dropzone: "Drag & drop an image, or click to browse",
      processing: "Analyzing with AI...",
      parseSuccess: "Found {count} items. Please review and import.",
      importBtn: "Import Selected ({count})",
      placeholderText: "Example:\n1lb chicken breast\n1 bag of spinach\n12 eggs\n3 apples",
      runParse: "Parse with AI"
    }
  },
  zh: {
    appName: "Receipt 2 meal 食盒",
    tagline: "智能食材管家与零浪费餐食规划",
    footerText: "© 2026 Receipt 2 meal. 让每一口食材都物尽其用。",
    privacyLink: "隐私政策",
    termsLink: "服务条款",
    recipesLink: "零浪费食谱",
    blogLink: "减废指南",
    pantryTips: "💡 减损小贴士：",
    pantryTipContent: "将食材存放在正确的区域可以防止过早变质。Receipt 2 meal 帮助最大化每种食材的使用周期，省钱又环保。",
    oneClickSeed: "导入示例食材",
    addPurchase: "录入采购",
    tabs: {
      home: "首页",
      pantry: "库存",
      plan: "计划",
      analytics: "复盘",
      profile: "我的"
    },
    common: {
      loading: "正在加载库存...",
      save: "保存",
      cancel: "取消",
      add: "添加",
      delete: "删除",
      edit: "编辑",
      confirm: "确认",
      back: "返回",
      status: "状态",
      category: "分类",
      quantity: "数量",
      unit: "单位",
      storage: "存放",
      daysLeft: "天后过期",
      expired: "已过期",
      today: "今天",
      days: "天",
      actions: "操作",
      searchPlaceholder: "搜索食材...",
      noData: "暂无食材。",
      all: "全部分类"
    },
    today: {
      greeting: "您好，大厨",
      summaryText: "您的库存中有 {count} 种活跃食材。让我们来做一顿美味吧！",
      getStarted: "生成本周食谱",
      noPlanTitle: "暂无活跃计划",
      noPlanDesc: "让 AI 根据您的库存和饮食偏好，定制 3 天或 7 天的专属食谱。",
      weeklyPlanBtn: "生成计划",
      todaysMenu: "今日菜单",
      breakfast: "早餐",
      lunch: "午餐",
      dinner: "晚餐",
      cookedBtn: "标记已做",
      cookedLabel: "已享用并扣减库存",
      skipBtn: "跳过",
      replaceBtn: "换一道",
      quickStats: "库存概览",
      expiringSoon: "临期",
      freshItems: "新鲜",
      smartRestockTitle: "智能补货",
      smartRestockDesc: "以下食材已用完，但在近期烹饪中被频繁使用。点击即可补货。",
      smartRestockEmpty: "暂无高频使用的已耗尽食材。多做几道菜来建立补货记录吧！",
      addBackToPantry: "补货",
      freqUsedLabel: "近期使用 {count} 次",
      restockSuccess: "已成功补货 {name}！",
      difficulty: "难度",
      cookTime: "烹饪时间",
      nutrition: "每份营养",
      calories: "热量",
      protein: "蛋白质",
      fat: "脂肪",
      carbs: "碳水",
      steps: "步骤",
      ingredientsNeeded: "所需食材"
    },
    pantry: {
      title: "我的食材库存",
      desc: "管理冰箱、冷冻柜和常温食材。",
      chartTitle: "分类占比",
      addItemTitle: "添加食材",
      nameLabel: "名称",
      categoryLabel: "分类",
      quantityLabel: "数量",
      unitLabel: "单位",
      storageLabel: "存放",
      expireLabel: "保质期天数",
      remainingLabel: "剩余",
      statusLabel: "状态",
      activeState: "新鲜",
      depletedState: "已用完",
      expiredState: "已过期",
      discardedState: "已丢弃",
      saveItem: "保存",
      editItem: "更新",
      toastAdded: "已添加 {name}！",
      toastUpdated: "已更新 {name}。",
      toastDeleted: "已移除 {name}。",
      confirmDelete: "确定要删除这个食材吗？"
    },
    plan: {
      title: "AI 餐食规划",
      desc: "根据临期食材优先配餐，实现零浪费。",
      duration: "计划天数",
      threeDays: "3天计划",
      sevenDays: "7天完整周",
      generating: "正在生成餐食计划...",
      generateBtn: "生成计划",
      activePlanTitle: "活跃计划 ({start} 至 {end})",
      swapSuccess: "已成功更换菜谱！",
      nutritionalTarget: "目标营养配比"
    },
    analytics: {
      title: "厨房数据复盘",
      desc: "追踪库存变化、烹饪完成率和食物浪费指标。",
      foodWasteRate: "浪费率",
      foodWasteDesc: "丢弃/过期食材占总量的百分比。",
      totalLogged: "累计管理食材",
      activeRatio: "活跃库存占比",
      txLogTitle: "近期活动日志",
      txCooked: "已烹饪",
      txWasted: "已浪费",
      txAdded: "已入库",
      txManual: "手动调整",
      txExpired: "已过期",
      clearDataBtn: "清空数据",
      clearConfirm: "这将永久删除所有食材、餐食计划和日志。不可撤销。确认吗？"
    },
    profile: {
      title: "大厨档案与厨房设置",
      desc: "定制饮食偏好、份量和烹饪限制。",
      household: "家庭人数",
      householdDesc: "食谱用量的份量乘数。",
      cuisines: "偏好菜系",
      allergens: "过敏与饮食限制",
      cookingSkill: "烹饪水平",
      kitchenTools: "厨房工具",
      dietaryGoals: "饮食目标",
      saveSuccess: "偏好已保存！",
      cookingSkills: {
        beginner: "新手",
        intermediate: "家常好手",
        advanced: "高级"
      },
      skillsDesc: {
        beginner: "简单易学",
        intermediate: "标准家常菜",
        advanced: "创意复杂菜"
      }
    },
    capture: {
      title: "食材录入助手",
      desc: "用 AI 解析购物小票、食材照片或文字清单。",
      photoTab: "扫描小票/照片",
      textTab: "粘贴文字清单",
      photoDesc: "上传购物小票或台面上食材的照片。",
      textDesc: "输入或粘贴购物清单（例如：1磅鸡胸肉，3个番茄，1打鸡蛋）。",
      dropzone: "拖拽图片到此处，或点击浏览",
      processing: "AI 分析中...",
      parseSuccess: "找到 {count} 个食材，请确认后导入。",
      importBtn: "导入选中的 {count} 个",
      placeholderText: "例如：\n1磅鸡胸肉\n1袋菠菜\n12个鸡蛋\n3个苹果",
      runParse: "AI 识别"
    }
  }
};

/**
 * Maps DB category keys to localized display labels.
 * Keys are now English-native.
 */
export const CATEGORY_MAP: Record<string, { en: string; zh: string }> = {
  'vegetables': { en: 'Vegetables', zh: '蔬菜' },
  'meat_poultry': { en: 'Meat & Poultry', zh: '肉禽' },
  'seafood': { en: 'Seafood', zh: '水产' },
  'dairy_eggs': { en: 'Dairy & Eggs', zh: '蛋奶' },
  'staples': { en: 'Staples & Grains', zh: '主食' },
  'soy_products': { en: 'Soy Products', zh: '豆制品' },
  'seasonings': { en: 'Seasonings', zh: '调味料' },
  'fruits': { en: 'Fruits', zh: '水果' },
  'dry_goods': { en: 'Dry Goods', zh: '干货' },
  'frozen': { en: 'Frozen Foods', zh: '冷冻' },
  'beverages': { en: 'Beverages', zh: '饮品' },
  'other': { en: 'Others', zh: '其他' }
};

/**
 * Maps DB storage keys to localized display labels.
 * Keys are now English-native.
 */
export const STORAGE_MAP: Record<string, { en: string; zh: string }> = {
  'pantry': { en: 'Pantry', zh: '常温' },
  'fridge': { en: 'Fridge', zh: '冷藏' },
  'freezer': { en: 'Freezer', zh: '冷冻' }
};

/**
 * Maps DB unit keys to localized display labels.
 * Keys are now English-native, including imperial units.
 */
export const UNIT_MAP: Record<string, { en: string; zh: string }> = {
  'g': { en: 'g', zh: 'g' },
  'kg': { en: 'kg', zh: 'kg' },
  'ml': { en: 'ml', zh: 'ml' },
  'L': { en: 'L', zh: 'L' },
  'lb': { en: 'lb', zh: '磅' },
  'oz': { en: 'oz', zh: '盎司' },
  'cup': { en: 'cup', zh: '杯' },
  'tbsp': { en: 'tbsp', zh: '汤匙' },
  'tsp': { en: 'tsp', zh: '茶匙' },
  'pcs': { en: 'pcs', zh: '个' },
  'bunch': { en: 'bunch', zh: '把' },
  'bag': { en: 'bag', zh: '袋' },
  'box': { en: 'box', zh: '盒' },
  'slice': { en: 'slice', zh: '片' },
  'fl_oz': { en: 'fl oz', zh: '液量盎司' },
  'gallon': { en: 'gallon', zh: '加仑' }
};

/**
 * Ordered list of all category keys for iteration.
 */
export const CATEGORY_KEYS = [
  'vegetables', 'meat_poultry', 'seafood', 'dairy_eggs', 'staples',
  'soy_products', 'seasonings', 'fruits', 'dry_goods', 'frozen',
  'beverages', 'other'
] as const;

/**
 * Ordered list of all unit keys for iteration.
 */
export const UNIT_KEYS = [
  'g', 'kg', 'ml', 'L', 'lb', 'oz', 'cup', 'tbsp', 'tsp',
  'pcs', 'bunch', 'bag', 'box', 'slice', 'fl_oz', 'gallon'
] as const;

/**
 * Ordered list of all storage keys for iteration.
 */
export const STORAGE_KEYS = ['pantry', 'fridge', 'freezer'] as const;
