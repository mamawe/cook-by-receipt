import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Client assets live in dist (prod) or public (dev).
const clientDir = IS_PROD
  ? path.join(process.cwd(), 'dist')
  : path.join(process.cwd(), 'public');

app.use(express.json({ limit: '20mb' }));

// ----------------------------------------------------
// Security headers (production only — avoid breaking Vite dev HMR)
// ----------------------------------------------------
if (IS_PROD) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://firebasestorage.googleapis.com', 'https://*.firebasestorage.app'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          styleSrcAttr: ["'unsafe-inline'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: [
            "'self'",
            'https://firestore.googleapis.com',
            'https://*.googleapis.com',
            'https://identitytoolkit.googleapis.com',
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
    }),
  );
}

// ----------------------------------------------------
// Abuse protection for AI endpoints
// ----------------------------------------------------
// Only allow same-origin requests (the SPA calls these from the browser).
// Cross-site scripts are rejected. ALLOWED_ORIGINS can extend this per env.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000,https://fridgechef.app,https://www.fridgechef.app'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedOrigin(req: express.Request): boolean {
  const origin = req.headers.origin;
  // Server-to-server / curl / same-origin navigations often omit Origin.
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function guardAi(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden: cross-origin request blocked.' });
  }
  next();
}

// Global safety net
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.GLOBAL_RATE_LIMIT) || 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use(globalLimiter);

// AI endpoints are expensive (Gemini tokens) — tighten hard.
const parseLimiter = rateLimit({
  windowMs: Number(process.env.RATE_WINDOW_MS) || 60_000,
  max: Number(process.env.PARSE_RATE_LIMIT) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded for ingredient parsing. Try again shortly.' },
});

const mealPlanLimiter = rateLimit({
  windowMs: Number(process.env.RATE_WINDOW_MS) || 60_000,
  max: Number(process.env.MEALPLAN_RATE_LIMIT) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded for meal plan generation. Try again shortly.' },
});

// ----------------------------------------------------
// Shared schema enums (English-native, matching types.ts)
// ----------------------------------------------------
const CATEGORY_ENUM = [
  'vegetables', 'meat_poultry', 'seafood', 'dairy_eggs', 'staples',
  'soy_products', 'seasonings', 'fruits', 'dry_goods', 'frozen',
  'beverages', 'other'
];

const UNIT_ENUM = [
  'g', 'kg', 'ml', 'L', 'lb', 'oz', 'cup', 'tbsp', 'tsp',
  'pcs', 'bunch', 'bag', 'box', 'slice', 'fl_oz', 'gallon'
];

const STORAGE_ENUM = ['pantry', 'fridge', 'freezer'];

const DIFFICULTY_ENUM = ['easy', 'medium', 'hard'];

// ----------------------------------------------------
// API Route 1: Parse ingredients (from receipt, photo or text)
// ----------------------------------------------------
app.post('/api/parse-ingredients', guardAi, parseLimiter, async (req, res) => {
  try {
    const { text, image, imageMimeType = 'image/jpeg' } = req.body;
    const ai = getAiClient();

    let contents: any[] = [];

    let promptText = `
You are a professional intelligent food manager AI. Analyze the user's food inputs (grocery receipt photo, food ingredient photo, or raw text list),
extract all items, and structure them as a JSON array.
Please normalize the item names in English (e.g., "Tomato" instead of "Tomatoes", "Chicken Breast" instead of "Chicken slices", quantity 2, unit "pcs" or standard metrics).
If the input contains non-English text (e.g., Chinese), translate all ingredient names to standard English food names.

The category MUST be strictly one of: ${CATEGORY_ENUM.join(' | ')}.
The unit MUST be strictly one of: ${UNIT_ENUM.join(' | ')}.
The recommended storage MUST be strictly one of: ${STORAGE_ENUM.join(' | ')}.
Predict the reasonable remaining shelf-life (expireDays) based on standard kitchen storage guidelines (e.g., fresh poultry: freezer 30 days, fridge 3 days; fresh vegetables: fridge 5-7 days). It must be a positive integer.
Use imperial units (lb, oz, cup, etc.) when the input appears to be from a US source; use metric (g, kg, ml, L) otherwise.

Return the result under the "ingredients" property of a JSON object. Do not include markdown markings or comments.
`;

    if (text) {
      promptText += `\nUser text input: "${text}"\n`;
    }

    contents.push(promptText);

    if (image) {
      // image should be base64 string
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType
        }
      });
    }

    const responseSchema = {
      type: "OBJECT",
      properties: {
        ingredients: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              category: {
                type: "STRING",
                enum: CATEGORY_ENUM
              },
              quantity: { type: "NUMBER" },
              unit: {
                type: "STRING",
                enum: UNIT_ENUM
              },
              storage: {
                type: "STRING",
                enum: STORAGE_ENUM
              },
              expireDays: { type: "INTEGER", description: "Estimated shelf-life in days (positive integer)" }
            },
            required: ["name", "category", "quantity", "unit", "storage", "expireDays"]
          }
        }
      },
      required: ["ingredients"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2
      }
    });

    const responseText = response.text;
    res.json(JSON.parse(responseText || '{}'));
  } catch (error: any) {
    console.error('API parse-ingredients error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse ingredients' });
  }
});

// ----------------------------------------------------
// API Route 2: Generate meal plan based on inventory and preferences
// ----------------------------------------------------
app.post('/api/generate-meal-plan', guardAi, mealPlanLimiter, async (req, res) => {
  try {
    const { ingredients, profile, daysCount = 3 } = req.body;
    const ai = getAiClient();

    // Compile active ingredients context
    const ingredientContext = ingredients
      .map((item: any) => `- ${item.name}: Remaining Qty: ${item.remainingQuantity} ${item.unit}, Location: ${item.storage}, Expires: ${item.expireAt} (Status: ${item.status})`)
      .join('\n');

    const prompt = `
You are a world-class creative master chef and intelligent dietary planner.
Based on the user's existing fridge inventory, pantry stocks, and personal preferences, design a scientific and delicious culinary meal plan covering ${daysCount} days, with 3 meals a day (breakfast, lunch, dinner).

**Your output MUST be entirely in natural, native, high-quality culinary English.** No non-English characters should appear in titles, steps, cuisines, or ingredient names.

**Input Data:**
[Active Pantry Ingredients]:
${ingredientContext}

[User Preferences & Constraints]:
- Household size: ${profile.householdSize} people (Servings multiplier: ${profile.servingsMultiplier}x)
- Preferred cuisines: ${profile.cuisinesPreferred.join(', ')}
- Allergens / Dietary constraints: ${profile.allergens.join(', ') || 'None'}
- Dietary goals: ${profile.dietaryGoals.join(', ') || 'Balanced diet'}
- Cooking skill level: ${profile.cookingSkill}
- Available kitchen tools: ${profile.kitchenTools.join(', ') || 'Stove, pan'}

**Culinary Planning Guidelines (CRITICAL):**
1. **Reduce Food Waste**: Prioritize consuming ingredients that expire earlier. Under each meal's ingredientsUsed section, list the exact pantry items consumed, matching their name as closely as possible to the English names in the input inventory. If an item is a common pantry essential (e.g. salt, pepper, oil, water), feel free to include it even if not present in the input inventory, but note it.
2. **Native Phrasing**: Use native English recipe titles (e.g., "Crispy Garlic Beef Stir-fry", "Sun-dried Tomato Omelette") and detailed culinary instructions.
3. **Skill Customization**: Adjust difficulty and steps for cooking skill. If they are a beginner, provide clear, step-by-step foolproof guidelines. If they are advanced, offer professional culinary touches.
4. **Meal Timing**: Breakfast should take 10-20 min, lunch/dinner 20-40 min.
5. **Dietary Compliance**: Strictly avoid any allergens listed. Honor dietary goals (e.g., keto = low carb high fat, vegan = no animal products, gluten-free = no wheat/barley/rye).

**Response Schema Guidelines**:
- The difficulty property MUST be strictly one of ${JSON.stringify(DIFFICULTY_ENUM)}.
- The mealSlot property MUST be strictly one of ["breakfast", "lunch", "dinner"].
- The unit in ingredientsUsed MUST be strictly one of ${JSON.stringify(UNIT_ENUM)}.
- All other textual fields (title, cuisine, steps, ingredients names) MUST be written in beautiful culinary English.
- Use imperial units (lb, oz, cup) if the user's inventory uses imperial units; use metric (g, kg, ml, L) otherwise. Match the user's existing unit system.

Please immediately generate this multi-day meal plan.
`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        recipes: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              title: { type: "STRING" },
              cuisine: { type: "STRING" },
              difficulty: { type: "STRING", enum: DIFFICULTY_ENUM },
              cookTimeMin: { type: "INTEGER" },
              steps: { type: "ARRAY", items: { type: "STRING" } },
              nutrition: {
                type: "OBJECT",
                properties: {
                  calories: { type: "INTEGER" },
                  protein: { type: "INTEGER" },
                  fat: { type: "INTEGER" },
                  carbs: { type: "INTEGER" }
                },
                required: ["calories", "protein", "fat", "carbs"]
              },
              ingredientsUsed: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    quantity: { type: "NUMBER" },
                    unit: { type: "STRING", enum: UNIT_ENUM }
                  },
                  required: ["name", "quantity", "unit"]
                }
              },
              date: { type: "STRING", description: "Planned date in YYYY-MM-DD format" },
              mealSlot: { type: "STRING", enum: ["breakfast", "lunch", "dinner"] }
            },
            required: ["id", "title", "cuisine", "difficulty", "cookTimeMin", "steps", "nutrition", "ingredientsUsed", "date", "mealSlot"]
          }
        }
      },
      required: ["recipes"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.3
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('API generate-meal-plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate meal plan' });
  }
});

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in .env.local');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// ----------------------------------------------------
// Serve static content pages (guides, recipes, tools, etc.)
// This MUST come before Vite middleware so crawable HTML
// pages are served as real files, not intercepted by SPA fallback.
// ----------------------------------------------------
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir, {
  extensions: ['html'],
  index: 'index.html',
}));

// ----------------------------------------------------
// Policy pages — serve branded HTML (NOT raw markdown)
// ----------------------------------------------------
app.get('/privacy', (_req, res) => {
  res.sendFile(path.join(publicDir, 'privacy.html'));
});
app.get('/terms', (_req, res) => {
  res.sendFile(path.join(publicDir, 'terms.html'));
});

// ----------------------------------------------------
// Serve client assets (Vite dev middleware or static dist)
// ----------------------------------------------------
async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Receipt 2 meal is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

startServer();
