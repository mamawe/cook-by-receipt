// Food Storage Calculator — external JS (CSP-safe, no inline scripts)
document.addEventListener('DOMContentLoaded', function () {
  // Ingredient database — English-native, based on USDA/FDA guidelines
  var INGREDIENT_DB = {
    // Meat & Poultry
    "chicken": { fridge: "1–2 days", freezer: "9 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Store on bottom shelf in original packaging", spoilage: "Sour smell, slimy texture, gray color", link: "/guides/how-long-does-chicken-last-in-fridge.html" },
    "chicken breast": { fridge: "1–2 days", freezer: "9 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Freeze if not cooking within 48 hours", spoilage: "Sour smell, slimy texture, gray color", link: "/guides/how-long-does-chicken-last-in-fridge.html" },
    "beef": { fridge: "3–5 days", freezer: "6–12 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Store on bottom shelf, use or freeze within 5 days", spoilage: "Brown/gray color, sour smell, slimy surface", link: "/guides/food-storage-guide.html" },
    "steak": { fridge: "3–5 days", freezer: "6–12 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Wrap tightly in butcher paper for freezing", spoilage: "Brown/gray color, sour smell, slimy surface", link: "/guides/food-storage-guide.html" },
    "ground beef": { fridge: "1–2 days", freezer: "3–4 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Freeze flat in freezer bags for quick thawing", spoilage: "Brown/gray color, sour smell, slimy texture", link: "/guides/food-storage-guide.html" },
    "pork": { fridge: "3–5 days", freezer: "6 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Store on bottom shelf, cook to 145°F", spoilage: "Gray color, sour smell, slimy surface", link: "/guides/food-storage-guide.html" },
    "bacon": { fridge: "7 days", freezer: "1 month", pantry: "—", temp: "≤40°F (4°C)", tip: "Keep sealed until ready to open", spoilage: "Sour smell, slimy texture, gray color", link: "/guides/food-storage-guide.html" },
    "sausage": { fridge: "1–2 days", freezer: "1–2 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Cook or freeze within 2 days of purchase", spoilage: "Sour smell, slimy surface, discoloration", link: "/guides/food-storage-guide.html" },

    // Seafood
    "fish": { fridge: "1–2 days", freezer: "3–6 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Store on ice if possible, cook within 24 hours", spoilage: "Strong fishy/ammonia odor, cloudy eyes, mushy flesh", link: "/guides/food-storage-guide.html" },
    "shrimp": { fridge: "1–2 days", freezer: "3–6 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Keep on ice in fridge, freeze if not using next day", spoilage: "Ammonia smell, slimy texture, black spots on shell", link: "/guides/food-storage-guide.html" },
    "salmon": { fridge: "1–2 days", freezer: "3–6 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Cook same day as purchase for best quality", spoilage: "Strong fishy odor, slimy texture, fading color", link: "/guides/food-storage-guide.html" },

    // Dairy & Eggs
    "eggs": { fridge: "3–5 weeks", freezer: "Not in shell", pantry: "—", temp: "≤40°F (4°C)", tip: "Store in carton on middle shelf, not door", spoilage: "Floats in water, sulfur smell when cracked", link: "/guides/how-long-do-eggs-last.html" },
    "milk": { fridge: "5–7 days", freezer: "3 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Keep on shelf, not in door. Freeze if about to expire", spoilage: "Sour smell, clumpy texture, yellowish color", link: "/guides/food-storage-guide.html" },
    "cheese": { fridge: "3–4 weeks", freezer: "6 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Wrap in parchment paper then loosely in plastic", spoilage: "Mold (except on hard cheese), sour smell, slimy surface", link: "/guides/food-storage-guide.html" },
    "cheddar": { fridge: "3–4 weeks", freezer: "6 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Wrap in parchment paper, then loosely in plastic", spoilage: "Mold, sour smell, slimy surface", link: "/guides/food-storage-guide.html" },
    "yogurt": { fridge: "7–14 days", freezer: "1–2 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Keep sealed, don't eat after mold appears", spoilage: "Mold, sour/off smell, liquid separation beyond normal", link: "/guides/food-storage-guide.html" },
    "butter": { fridge: "1–3 months", freezer: "6–9 months", pantry: "1–2 days", temp: "≤40°F (4°C)", tip: "Wrap tightly to prevent absorbing fridge odors", spoilage: "Rancid smell, discoloration, off taste", link: "/guides/food-storage-guide.html" },

    // Vegetables
    "spinach": { fridge: "5–7 days", freezer: "10–12 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Store unwashed with paper towels to absorb moisture", spoilage: "Slimy texture, dark wet spots, sour smell", link: "/guides/how-long-does-spinach-last.html" },
    "lettuce": { fridge: "5–7 days", freezer: "—", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Wrap in paper towels and store in a bag", spoilage: "Slimy leaves, brown edges, foul smell", link: "/guides/food-storage-guide.html" },
    "tomatoes": { fridge: "1 week", freezer: "2–3 months", pantry: "3–5 days", temp: "55–70°F (13–21°C)", tip: "Keep at room temp until ripe, then refrigerate", spoilage: "Soft/mushy, mold, fermented smell, leaking juice", link: "/guides/food-storage-guide.html" },
    "bell peppers": { fridge: "1–2 weeks", freezer: "8 months", pantry: "—", temp: "45–50°F (7–10°C)", tip: "Store in crisper drawer unwashed", spoilage: "Wrinkled, soft, moldy spots", link: "/guides/food-storage-guide.html" },
    "carrots": { fridge: "3–4 weeks", freezer: "10–12 months", pantry: "—", temp: "32–40°F (0–4°C)", tip: "Remove green tops before storing (they draw moisture)", spoilage: "Slimy, soft, rubbery texture", link: "/guides/food-storage-guide.html" },
    "onions": { fridge: "—", freezer: "—", pantry: "2–3 months", temp: "45–55°F (7–13°C)", tip: "Store in ventilated bag, away from potatoes", spoilage: "Soft, moldy, sprouting, foul smell", link: "/guides/food-storage-guide.html" },
    "garlic": { fridge: "—", freezer: "—", pantry: "3–5 months", temp: "55–60°F (13–16°C)", tip: "Store in ventilated container, not in plastic", spoilage: "Soft, green sprouts, mold, sour smell", link: "/guides/food-storage-guide.html" },
    "potatoes": { fridge: "—", freezer: "—", pantry: "2–3 months", temp: "45–50°F (7–10°C)", tip: "Keep away from onions and sunlight", spoilage: "Green skin, sprouts, soft/wrinkled, moldy", link: "/guides/food-storage-guide.html" },
    "broccoli": { fridge: "3–5 days", freezer: "10–12 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Store unwashed in a perforated bag", spoilage: "Yellow color, soft/slimy, foul smell", link: "/guides/food-storage-guide.html" },
    "mushrooms": { fridge: "7–10 days", freezer: "10–12 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Store in paper bag (not plastic) to absorb moisture", spoilage: "Slimy, dark spots, sour smell", link: "/guides/food-storage-guide.html" },
    "cucumber": { fridge: "1 week", freezer: "—", pantry: "—", temp: "45–50°F (7–10°C)", tip: "Store in crisper drawer, use within a week", spoilage: "Soft, wrinkled, slimy, mold", link: "/guides/food-storage-guide.html" },
    "celery": { fridge: "2–3 weeks", freezer: "10–12 months", pantry: "—", temp: "32–36°F (0–2°C)", tip: "Wrap in aluminum foil to keep crisp", spoilage: "Limp, rubbery, brown discoloration", link: "/guides/food-storage-guide.html" },
    "avocado": { fridge: "3–5 days", freezer: "3 months", pantry: "3–7 days", temp: "40–45°F (4–7°C)", tip: "Refrigerate only after ripe to slow ripening", spoilage: "Very soft, brown/black flesh, stringy texture, rancid smell", link: "/guides/food-storage-guide.html" },

    // Fruits
    "banana": { fridge: "5–7 days", freezer: "2–3 months", pantry: "3–5 days", temp: "56–58°F (13–14°C)", tip: "Freeze overripe bananas (peeled) for smoothies", spoilage: "Black skin (OK inside), fermented smell, mushy", link: "/guides/food-storage-guide.html" },
    "apples": { fridge: "3–4 weeks", freezer: "8 months", pantry: "1–2 weeks", temp: "30–35°F (-1–2°C)", tip: "Store in crisper drawer away from other produce", spoilage: "Soft/mealy, brown spots, fermented smell", link: "/guides/food-storage-guide.html" },
    "strawberries": { fridge: "3–7 days", freezer: "6 months", pantry: "1 day", temp: "32–36°F (0–2°C)", tip: "Don't wash until ready to eat; store in original container", spoilage: "Mold, mushy texture, fermented smell", link: "/guides/food-storage-guide.html" },
    "lemon": { fridge: "3–4 weeks", freezer: "3–4 months", pantry: "1 week", temp: "45–50°F (7–10°C)", tip: "Store in sealed bag in crisper for longest life", spoilage: "Soft, shriveled, mold, fermented smell", link: "/guides/food-storage-guide.html" },

    // Herbs
    "basil": { fridge: "Not recommended", freezer: "6 months", pantry: "1 week", temp: "Room temp", tip: "Store in water glass on counter — basil turns black in fridge", spoilage: "Black spots, slimy leaves, wilted", link: "/guides/how-to-keep-herbs-fresh.html" },
    "cilantro": { fridge: "2 weeks", freezer: "6 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Treat like flowers: trim stems, place in water glass, bag loosely", spoilage: "Wilted, slimy, yellow/brown leaves", link: "/guides/how-to-keep-herbs-fresh.html" },
    "parsley": { fridge: "2–3 weeks", freezer: "6 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Bouquet method: trim stems, water glass, plastic bag", spoilage: "Wilted, slimy, yellow leaves", link: "/guides/how-to-keep-herbs-fresh.html" },
    "mint": { fridge: "2 weeks", freezer: "6 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Bouquet method in the fridge", spoilage: "Wilted, slimy, brown leaves", link: "/guides/how-to-keep-herbs-fresh.html" },
    "rosemary": { fridge: "2–3 weeks", freezer: "6 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Wrap in slightly damp paper towel, store in bag", spoilage: "Dry, brittle, brown needles", link: "/guides/how-to-keep-herbs-fresh.html" },
    "thyme": { fridge: "2–3 weeks", freezer: "6 months", pantry: "—", temp: "35–40°F (2–4°C)", tip: "Wrap in slightly damp paper towel, store in bag", spoilage: "Dry, brittle, brown leaves", link: "/guides/how-to-keep-herbs-fresh.html" },

    // Grains & Pantry
    "rice (cooked)": { fridge: "4–6 days", freezer: "6 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Cool quickly and store in airtight container", spoilage: "Hard/dry texture, sour smell, mold", link: "/guides/food-storage-guide.html" },
    "pasta (cooked)": { fridge: "3–5 days", freezer: "2 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Toss with oil before storing to prevent sticking", spoilage: "Slimy texture, sour smell, mold", link: "/guides/food-storage-guide.html" },
    "bread": { fridge: "1 week", freezer: "3–6 months", pantry: "3–5 days", temp: "Room temp", tip: "Freeze sliced bread and toast as needed", spoilage: "Visible mold, hard/stale, sour smell", link: "/guides/food-storage-guide.html" },

    // Leftovers
    "leftovers": { fridge: "3–4 days", freezer: "2–3 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Cool within 2 hours, store in shallow containers", spoilage: "Sour smell, slimy texture, mold, off color", link: "/guides/food-storage-guide.html" },
    "soup": { fridge: "3–4 days", freezer: "2–3 months", pantry: "—", temp: "≤40°F (4°C)", tip: "Cool completely before refrigerating", spoilage: "Sour smell, cloudy appearance, mold", link: "/guides/food-storage-guide.html" }
  };

  // Build datalist and popular grid
  var popularItems = ["chicken", "eggs", "spinach", "beef", "milk", "tomatoes", "bananas", "basil", "leftovers", "bread", "salmon", "cheese"];

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function lookupIngredient() {
    var query = document.getElementById('ingredientSearch').value.trim().toLowerCase();
    var resultBox = document.getElementById('resultBox');
    var noResult = document.getElementById('noResult');

    if (!query) return;

    // Exact match first
    var data = INGREDIENT_DB[query];

    // Partial match
    if (!data) {
      var key = Object.keys(INGREDIENT_DB).find(function(k) { return k.includes(query) || query.includes(k); });
      if (key) data = INGREDIENT_DB[key];
    }

    if (data) {
      document.getElementById('resultName').textContent = capitalize(query);
      document.getElementById('resultFridge').textContent = data.fridge;
      document.getElementById('resultFreezer').textContent = data.freezer;
      document.getElementById('resultPantry').textContent = data.pantry;
      document.getElementById('resultTemp').textContent = data.temp;
      document.getElementById('resultTip').textContent = data.tip;
      document.getElementById('resultSpoilage').innerHTML = '⚠️ <strong>Signs of spoilage:</strong> ' + data.spoilage;

      if (data.link && data.link !== '/guides/food-storage-guide.html') {
        document.getElementById('resultLink').innerHTML = '<a href="' + data.link + '">📖 Read the full guide →</a>';
      } else {
        document.getElementById('resultLink').innerHTML = '<a href="/guides/food-storage-guide.html">📖 Read the full storage guide →</a>';
      }

      resultBox.classList.add('show');
      noResult.style.display = 'none';
    } else {
      resultBox.classList.remove('show');
      noResult.style.display = 'block';
    }
  }

  // Expose for button click
  window.lookupIngredient = lookupIngredient;

  // Init datalist
  var datalist = document.getElementById('ingredientList');
  Object.keys(INGREDIENT_DB).sort().forEach(function(key) {
    var option = document.createElement('option');
    option.value = key;
    datalist.appendChild(option);
  });

  // Init popular grid
  var grid = document.getElementById('popularGrid');
  popularItems.forEach(function(key) {
    var data = INGREDIENT_DB[key];
    if (!data) return;
    var card = document.createElement('a');
    card.className = 'fc-cluster-card';
    card.href = '#';
    card.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('ingredientSearch').value = key;
      lookupIngredient();
    });
    card.innerHTML = '<h3>' + capitalize(key) + '</h3><p>Fridge: ' + data.fridge + '</p><span class="fc-cluster-card-arrow">Look up →</span>';
    grid.appendChild(card);
  });

  // Enter key support
  document.getElementById('ingredientSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') lookupIngredient();
  });

  // Button click
  var lookUpBtn = document.getElementById('lookUpBtn');
  if (lookUpBtn) {
    lookUpBtn.addEventListener('click', lookupIngredient);
  }
});
