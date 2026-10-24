# Mise (Mise en Place) 🍳

> A minimal, tactile, browser-based recipe and cooking companion built with a Warm Editorial Minimalist aesthetic.

Mise replaces clunky, ad-filled, mathematically broken recipe blogs with a calm, tactile culinary instrument designed for real kitchen use.

---

## ✨ Highlights

- **Accurate Volume-to-Weight Conversions**: Bakers measure flour in grams, not cups. Mise maps dry volumes to exact weights using a curated ~500 item culinary density database (King Arthur Baking + USDA SR Legacy).
- **Culinary Rounding**: No awkward `236.59 ml` or `0.625 cups`. Mise applies kitchen-smart rounding tiers and snaps imperial decimals to readable fractions like `1/2 cup + 2 tbsp`.
- **Hands-Free Cooking Mode**: High-contrast Cast Iron dark theme (`#141413`) with huge typography ($28\text{px}-32\text{px}$), Step 0 Mise-en-Place checklist, automatic Screen Wake Lock to prevent dimming, and inline converted quantity injection.
- **Contextual Chime Timers**: Detects durations in steps (e.g., *"simmer for 12–15 minutes"*) as interactive timer pills. Starts a persistent floating multi-timer dock with warm harmonic bell alerts synthesized via the Web Audio API.
- **Smart "Paste & Parse" Recipe Creator**: Real-time tokenizer parses raw ingredient strings into structured quantities, units, ingredient entities, and prep notes.
- **Multi-Format Import / Export**: Import from Schema.org / JSON-LD web recipes, Cooklang (`.cook`), or standard JSON. Export recipes to JSON or Markdown.
- **100% Offline-First**: Powered by Dexie.js (IndexedDB). No mandatory logins, no internet required in kitchens with weak Wi-Fi.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Node.js 24 LTS recommended)
- npm or pnpm

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Launch development server
npm run dev

# 3. Run unit tests
npm test

# 4. Build for production
npm run build
```

---

## 🎨 Design System ("Warm Kitchen")

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Alabaster** | `#FAF8F5` | Primary background (Warm paper, eye-friendly) |
| **Stone Surface** | `#F3EFEA` | Recipe cards and panels |
| **Stone Border** | `#E6E1DA` | 1px tactile borders |
| **Espresso Charcoal** | `#1C1B18` | Primary typography |
| **Warm Grey** | `#78736A` | Secondary & metadata typography |
| **Terracotta / Burnt Sienna** | `#C85A32` | Active states, primary buttons, running timers |
| **Sage Herb** | `#4A6B53` | Completion checks, metric badges |
| **Cast Iron** | `#141413` | Cooking mode background |
| **Cream** | `#F5F2EB` | Cooking mode high-contrast text |

---

## 📖 Architecture & Documentation
See [CLAUDE.md](file:///c:/Users/ralpo/Desktop/Mise/CLAUDE.md) for deep technical architecture, module definitions, and developer guidance.
