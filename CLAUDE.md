# CLAUDE.md — Mise Project Guide & Context

## Project Overview
**Mise** (short for *mise en place*) is a tactile, minimal, browser-based recipe and cooking companion built with a **Warm Editorial Minimalist** aesthetic. Inspired by print publications (Kinfolk, Cereal) and tactile hardware (Braun, Things 3), Mise solves the longstanding frustrations of kitchen software:
1. **Accurate Volume-to-Weight Culinary Conversions**: Converts dry volumes (cups/tbsp) into metric weights (grams) using an ingredient density database (King Arthur Baking + USDA SR Legacy), rather than naive volume-to-volume math.
2. **Culinary Rounding**: Prevents awkward fractional numbers (e.g., 236.59 ml) through culinary rounding tiers and an Imperial fraction snapper.
3. **Hands-Free Cooking Mode**: Transforms the UI into a high-contrast dark Cast Iron theme (`#141413`) with giant typography, Screen Wake Lock API (keeps screen awake), inline ingredient quantity injection, mise-en-place checklist, and contextual Web Audio synthesized chimes.
4. **Smart "Paste & Parse" Editor & Multi-Format Importer**: Real-time tokenizer for recipe text, schema.org / JSON-LD scraping, Cooklang (`.cook`), and native JSON import/export.
5. **Offline-First**: All data, densities, and recipes are stored locally in the browser via IndexedDB (Dexie.js). Zero accounts, zero external tracking, works seamlessly offline.

---

## Tech Stack
- **Framework**: React 19 + TypeScript (Strict)
- **Bundler & Tooling**: Vite 6+
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Icons**: Lucide React
- **Storage**: IndexedDB via `dexie` & `dexie-react-hooks`
- **Testing**: Vitest + @testing-library/react
- **Hardware APIs**: Screen Wake Lock API (`navigator.wakeLock`), Web Audio API (`AudioContext`)

---

## Directory Structure
```
Mise/
├── CLAUDE.md                    # Project context & instructions for AI/developers
├── README.md                    # Public overview, features, and setup
├── initial_plan.txt             # Original product and architectural design plan
├── index.html                   # Entry HTML with custom typography links
├── vite.config.ts               # Vite configuration with Vitest setup
├── tailwind.config.js           # Theme colors, font families, and plugins
├── tsconfig.json                # TypeScript strict configuration
├── data_sources/                # Factually verified raw data & audit manifest
│   ├── verified_densities_manifest.json # Complete data source audit trail
│   └── usda_sr_legacy/          # Official USDA FoodData Central SR Legacy CSVs
├── scripts/
│   └── build_verified_database.js # Scrapes King Arthur & parses USDA SR Legacy
├── src/
│   ├── main.tsx                 # App mount & global styles
│   ├── App.tsx                  # Root navigation & modal manager
│   ├── types/                   # TypeScript interfaces
│   │   ├── recipe.ts            # Recipe, Step, Timer, Serving types
│   │   ├── ingredient.ts        # Ingredient & tokenization types
│   │   ├── density.ts           # Density record & database types
│   │   ├── conversion.ts        # Units, conversion modes, and rounding types
│   │   └── mealPlan.ts          # Weekly meal plans, slots, and smart shopping list
│   ├── data/
│   │   ├── densityDatabase.ts   # 2,505 factually verified culinary density records
│   │   └── seedRecipes.ts       # Curated initial recipes (Pizza, Cookies, Omelette)
│   ├── db/
│   │   ├── index.ts             # Dexie IndexedDB client & schema definition
│   │   └── recipes.ts           # CRUD helper operations for recipes
│   ├── hooks/
│   │   ├── useMealPlan.ts       # Persistent weekly meal plan state & actions
│   │   └── useShoppingListState.ts # Custom items & persistent checklist state
│   ├── engine/                  # Core algorithmic & mathematical culinary logic
│   │   ├── units.ts             # Unit definitions & volume/weight base scales
│   │   ├── fractions.ts         # Fraction parser & Imperial culinary fraction snapper
│   │   ├── converter.ts         # Volume-to-weight, weight-to-volume, yield scaling
│   │   ├── rounding.ts          # Culinary rounding rules (<10g, 10-100g, >100g)
│   │   ├── stepParser.ts        # NLP/Regex duration, temp, & ingredient extractor
│   │   └── __tests__/           # Vitest unit test suites
│   ├── utils/
│   │   ├── audio.ts             # Web Audio API chime synthesis (zero external audio)
│   │   ├── wakeLock.ts          # Screen Wake Lock manager
│   │   ├── formatters.ts        # Time and duration formatters
│   │   ├── dateUtils.ts         # ISO 8601 week calculations and date formatters
│   │   ├── mealTags.ts          # Recipe tag normalizer & meal category mapper
│   │   ├── shoppingListAggregator.ts # 4-stage cross-recipe grocery aggregation
│   │   └── __tests__/           # Date, tags, and shopping aggregator tests
│   └── components/
│       ├── Header.tsx           # Editorial top header with view switcher tabs
│       ├── Navigation.tsx       # Bottom-anchored mobile thumb navigation (48px targets)
│       ├── RecipeList.tsx       # Recipe library, search, and tag filters
│       ├── RecipeCard.tsx       # Editorial recipe card
│       ├── RecipeDetail.tsx     # Warm Editorial reading view with Scaler & Units
│       ├── CookingMode.tsx      # Dark Cast Iron hands-free kitchen interface
│       ├── TimerDock.tsx        # Persistent multi-timer dock with chimes
│       ├── RecipeEditor.tsx     # "Paste & Parse" editor with quick meal-tags
│       ├── ImportExportModal.tsx # JSON-LD, Cooklang, and JSON file importer/exporter
│       ├── DensityManager.tsx   # Ingredient density browser and custom manager
│       ├── MealPlanner/         # 7-day editorial planner & drag-and-drop drawer
│       │   ├── MealPlannerView.tsx   # Main weekly planner coordinator
│       │   ├── MealPlannerGrid.tsx   # Desktop 7x4 editorial schedule
│       │   ├── MealPlannerMobile.tsx # Mobile day ribbon & meal agenda
│       │   ├── MealSlotCard.tsx      # Draggable planned recipe card with servings stepper
│       │   ├── RecipeDrawer.tsx      # Collapsible lateral drawer with tagged chips
│       │   └── AssignRecipeModal.tsx # Quick-assign meal selector modal
│       └── ShoppingList/        # Smart shopping list with sensible rounding
│           └── ShoppingListView.tsx  # Categorized grocery aisles & pantry breakdown
```

---

## Design System Tokens
### Palette ("Warm Kitchen")
- **Primary Background**: `bg-alabaster` (`#FAF8F5`) — warm paper, non-sterile
- **Surface / Cards**: `bg-stone-surface` (`#F3EFEA`) with `border-stone-border` (`#E6E1DA`)
- **Primary Typography**: `text-charcoal` (`#1C1B18`)
- **Muted Typography**: `text-warm-grey` (`#78736A`)
- **Primary Accent**: `text-terracotta` / `bg-terracotta` (`#C85A32`) — active states, timers, CTAs
- **Secondary Accent**: `text-sage` / `bg-sage` (`#4A6B53`) — completion checks, metric badges
- **Cast Iron (Cooking Mode)**: `bg-cast-iron` (`#141413`), cards `bg-smoked-obsidian` (`#1E1D1B`), text `text-cream` (`#F5F2EB`), accent `text-amber-glow` (`#E06B43`)

### Typography
- **Headers & Titles**: `font-serif` (Playfair Display / Newsreader)
- **UI & Instructions**: `font-sans` (Inter / Plus Jakarta Sans)
- **Quantities, Timers, Weights**: `font-mono tabular-nums` (JetBrains Mono / monospace tabular numerals)

---

## Developer Commands
```bash
# Start local development server
npm run dev
# (or in PowerShell: npm.cmd run dev)

# Run unit tests (Vitest)
npm test
# (or in PowerShell: npm.cmd test)

# Re-compile verified density database from live King Arthur + USDA SR Legacy
npm run db:compile
# (or in PowerShell: node scripts/build_verified_database.js)

# Build for production
npm run build
# (or in PowerShell: npm.cmd run build)

# Preview production build
npm run preview
```

> [!NOTE]
> On Windows PowerShell, invoke `npm.cmd` or ensure PowerShell script execution policy permits `npm.ps1`. Node.js LTS v24 is installed at `C:\Program Files\nodejs` and configured in User PATH.

---

## Key Domain Logic & Rules
1. **Conversion Mode Rules**:
   - `Original`: Render ingredient quantity and unit exactly as authored.
   - `Metric`: Convert dry volumes (cups, tbsp, tsp) of known ingredients to grams using density. Convert liquid volumes to ml or grams based on liquid density.
   - `Imperial`: Convert weights into ounces/pounds, volumes into snapped kitchen fractions (e.g., `1/2 cup + 2 tbsp`).
2. **Culinary Rounding Rules**:
   - Items `< 10g` (salt, yeast, baking powder): Round to nearest `0.1g` or `1/8 tsp`.
   - Items `10g – 100g`: Round to nearest `1g`.
   - Items `> 100g` & liquids `> 100ml`: Round to nearest `5g` / `5ml`. An optional "Exact" toggle in UI reveals raw math values.
3. **Cooking Mode Ergonomics**:
   - All touch targets must be at least `48x48px` to support messy kitchen hands.
   - Request Screen WakeLock automatically on entry; gracefully handle release on exit or tab switch.
   - Synthesize chime sounds on Web Audio API; do not rely on remote MP3 network requests.
4. **Interactive Density Resolution & Manual Overrides**:
   - In `RecipeEditor.tsx`, each parsed ingredient displays an interactive match pill button.
   - If unclicked, the app defaults to automatic resolution via `findDensity`.
   - Clicking opens the Density Matcher Modal, letting the user pick specific alternatives from ranked candidate suggestions (`getCandidateDensities`) or search across all 2,505 verified items.
   - The selected `densityId` is saved directly with the recipe and respected in both reader and cooking mode.
