import fs from 'fs';
import path from 'path';
import readline from 'readline';

const CSV_DIR = path.resolve('data_sources/usda_sr_legacy/FoodData_Central_sr_legacy_food_csv_2018-04');
const OUT_FILE = path.resolve('src/data/densityDatabase.ts');
const MANIFEST_FILE = path.resolve('data_sources/verified_densities_manifest.json');

function cleanHtmlEntities(str) {
  return str
    .replace(/\u00ad/g, '') // strip soft hyphen
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseKingArthurVolume(volumeStr) {
  const v = cleanHtmlEntities(volumeStr).toLowerCase();

  if (v.includes('8 tablespoons (1/2 cup)') || v.includes('8 tbsp (1/2 cup)')) return 0.5;
  if (v.includes('1 cup')) return 1.0;
  if (v.includes('1/2 cup')) return 0.5;
  if (v.includes('1/3 cup')) return 1 / 3;
  if (v.includes('1/4 cup')) return 0.25;
  if (v.includes('4 cups')) return 4.0;
  if (v.includes('2 tablespoons') || v.includes('2 tbsp')) return 2 / 16;
  if (v.includes('1 tablespoon') || v.includes('1 tbsp')) return 1 / 16;
  if (v.includes('2 1/4 teaspoons') || v.includes('2 1/4 tsp')) return 2.25 / 48;
  if (v.includes('2 teaspoons') || v.includes('2 tsp')) return 2 / 48;
  if (v.includes('1 teaspoon') || v.includes('1 tsp')) return 1 / 48;
  if (v.includes('1/2 teaspoon') || v.includes('1/2 tsp')) return 0.5 / 48;

  if (v.includes('1 large') || v.includes('head')) return null;
  return 1.0;
}

function categorize(name) {
  const n = name.toLowerCase();
  if (n.includes('flour') || n.includes('starch') || n.includes('meal') || (n.includes('powder') && !n.includes('baking') && !n.includes('cocoa'))) return 'flour';
  if (n.includes('sugar') || n.includes('syrup') || n.includes('honey') || n.includes('molasses') || n.includes('sweetener') || n.includes('agave')) return 'sugar';
  if (n.includes('butter') || n.includes('oil') || n.includes('milk') || n.includes('cream') || n.includes('cheese') || n.includes('yogurt') || n.includes('ghee') || n.includes('lard') || n.includes('shortening')) return 'fat_dairy';
  if (n.includes('water') || n.includes('juice') || n.includes('cider') || n.includes('broth') || n.includes('stock') || n.includes('vinegar') || n.includes('sauce') || n.includes('wine')) return 'liquid';
  if (n.includes('salt') || n.includes('yeast') || n.includes('baking powder') || n.includes('baking soda') || n.includes('tartar')) return 'leavener_salt';
  if (n.includes('chocolate') || n.includes('cocoa') || n.includes('chips') || n.includes('cacao')) return 'chocolate';
  if (n.includes('nut') || n.includes('almond') || n.includes('walnut') || n.includes('pecan') || n.includes('seed') || n.includes('peanut') || n.includes('cashew') || n.includes('pistachio')) return 'nut_seed';
  if (n.includes('oat') || n.includes('rice') || n.includes('cereal') || n.includes('grain') || n.includes('wheat') || n.includes('barley') || n.includes('cornmeal') || n.includes('quinoa')) return 'grain_cereal';
  if (n.includes('apple') || n.includes('berry') || n.includes('raisin') || n.includes('fruit') || n.includes('cherry') || n.includes('pumpkin') || n.includes('onion') || n.includes('garlic') || n.includes('tomato') || n.includes('potato') || n.includes('carrot')) return 'fruit_veg';
  if (n.includes('cinnamon') || n.includes('vanilla') || n.includes('ginger') || n.includes('nutmeg') || n.includes('pepper') || n.includes('herb') || n.includes('thyme') || n.includes('oregano') || n.includes('basil')) return 'spice_herb';
  return 'other';
}

function generateAliases(name) {
  const aliases = new Set();
  const lower = name.toLowerCase().trim();
  aliases.add(lower);

  // Strip parentheses and add clean version
  const noParen = lower.replace(/\s*\([^)]+\)/g, '').trim();
  if (noParen && noParen !== lower) aliases.add(noParen);

  // Common culinary synonyms
  if (lower.includes('all-purpose flour')) {
    aliases.add('ap flour');
    aliases.add('all purpose flour');
    aliases.add('plain flour');
    aliases.add('white flour');
    aliases.add('flour');
  }
  if (lower.includes('bread flour')) {
    aliases.add('strong flour');
    aliases.add('hard flour');
  }
  if (lower.includes('sugar (granulated white)')) {
    aliases.add('granulated sugar');
    aliases.add('white sugar');
    aliases.add('sugar');
    aliases.add('cane sugar');
    aliases.add('caster sugar');
  }
  if (lower.includes('brown sugar')) {
    aliases.add('brown sugar');
    aliases.add('light brown sugar');
    aliases.add('dark brown sugar');
  }
  if (lower.includes('confectioners')) {
    aliases.add('powdered sugar');
    aliases.add('icing sugar');
    aliases.add('confectioners sugar');
  }
  if (lower.includes('diamond crystal')) {
    aliases.add('diamond crystal kosher salt');
    aliases.add('diamond crystal salt');
    aliases.add('diamond crystal');
    aliases.add('kosher salt');
  }
  if (lower.includes('morton')) {
    aliases.add('morton kosher salt');
    aliases.add('morton salt');
  }
  if (lower === 'salt (table)') {
    aliases.add('table salt');
    aliases.add('fine salt');
    aliases.add('salt');
    aliases.add('fine sea salt');
  }
  if (lower === 'butter') {
    aliases.add('unsalted butter');
    aliases.add('salted butter');
    aliases.add('sweet cream butter');
  }
  if (lower === 'yeast (instant)') {
    aliases.add('instant yeast');
    aliases.add('rapid rise yeast');
    aliases.add('saf-instant');
  }
  if (lower === 'yeast (active dry)') {
    aliases.add('active dry yeast');
    aliases.add('dry yeast');
    aliases.add('yeast');
  }
  if (lower === "'00' pizza flour") {
    aliases.add('pizza flour');
    aliases.add('00 flour');
    aliases.add('double zero flour');
  }

  return Array.from(aliases);
}

// Clean USDA SR Legacy descriptions into natural culinary names
function cleanUsdaDescription(desc) {
  let clean = desc;

  if (clean.startsWith('Butter, without salt')) return 'Unsalted Butter';
  if (clean.startsWith('Butter, salted')) return 'Salted Butter';
  if (clean.startsWith('Sugars, granulated')) return 'Granulated Sugar (USDA)';
  if (clean.startsWith('Sugars, brown')) return 'Brown Sugar (USDA)';
  if (clean.startsWith('Sugars, powdered')) return 'Powdered Sugar (USDA)';
  if (clean.startsWith('Oil, olive')) return 'Olive Oil';
  if (clean.startsWith('Oil, canola')) return 'Canola Oil';
  if (clean.startsWith('Oil, vegetable')) return 'Vegetable Oil';
  if (clean.startsWith('Oil, coconut')) return 'Coconut Oil';
  if (clean.startsWith('Milk, whole')) return 'Whole Milk';
  if (clean.startsWith('Cream, fluid, heavy whipping')) return 'Heavy Whipping Cream';
  if (clean.startsWith('Cheese, mozzarella')) return 'Mozzarella Cheese';
  if (clean.startsWith('Cheese, cheddar')) return 'Cheddar Cheese';
  if (clean.startsWith('Cheese, parmesan')) return 'Parmesan Cheese';
  if (clean.startsWith('Wheat flour, white, all-purpose')) return 'All-Purpose Flour (USDA)';
  if (clean.startsWith('Wheat flour, white, bread')) return 'Bread Flour (USDA)';
  if (clean.startsWith('Salt, table')) return 'Table Salt (USDA)';

  const commaParts = clean.split(',').map(p => p.trim());
  if (commaParts.length === 2 && !commaParts[1].includes('with') && !commaParts[1].includes('without')) {
    return `${commaParts[1]} ${commaParts[0]}`;
  }

  return clean;
}

async function fetchKingArthur() {
  console.log('Fetching live King Arthur Baking Ingredient Weight Chart...');
  const res = await fetch('https://www.kingarthurbaking.com/learn/ingredient-weight-chart', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) throw new Error('No table in King Arthur HTML');

  const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const records = [];

  for (let i = 1; i < rows.length; i++) {
    const rawCells = rows[i].match(/<td[\s\S]*?<\/td>/gi) || [];
    if (rawCells.length < 4) continue;

    const cells = rawCells.map(c => cleanHtmlEntities(c.replace(/<[^>]+>/g, '')));
    const ingredientName = cells[0];
    const volumeStr = cells[1];
    const ouncesStr = cells[2];
    const gramsStr = cells[3];

    const rawGrams = parseFloat(gramsStr);
    if (isNaN(rawGrams) || rawGrams <= 0) continue;

    const cupsFraction = parseKingArthurVolume(volumeStr);
    if (cupsFraction === null || cupsFraction <= 0) continue;

    const gramsPerCup = Math.round((rawGrams / cupsFraction) * 10) / 10;
    let gramsPerTbsp = Math.round((gramsPerCup / 16) * 10) / 10;

    // If volume was specifically in tablespoons (e.g. 1 tbsp = 8g for Diamond Crystal)
    if (volumeStr.toLowerCase().includes('1 tablespoon') || volumeStr.toLowerCase().includes('1 tbsp')) {
      gramsPerTbsp = rawGrams;
    } else if (volumeStr.toLowerCase().includes('2 tablespoons') || volumeStr.toLowerCase().includes('2 tbsp')) {
      gramsPerTbsp = rawGrams / 2;
    }

    const densityGPerMl = Number((gramsPerCup / 236.588).toFixed(4));
    const aliases = generateAliases(ingredientName);

    const stateModifiers = [];
    const parenMatch = ingredientName.match(/\(([^)]+)\)/);
    if (parenMatch) {
      stateModifiers.push(parenMatch[1].toLowerCase());
    }

    const safeId = 'ka_' + ingredientName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    records.push({
      id: safeId,
      name: ingredientName,
      aliases,
      category: categorize(ingredientName),
      gramsPerCup,
      gramsPerTbsp,
      densityGPerMl,
      stateModifiers: stateModifiers.length > 0 ? stateModifiers : undefined,
      notes: `King Arthur verified: ${volumeStr} = ${gramsStr}g (${ouncesStr} oz)`,
      source: 'king_arthur',
    });
  }

  console.log(`Parsed ${records.length} verified items from King Arthur Baking.`);
  return records;
}

async function parseUsdaSrLegacy() {
  console.log('Parsing USDA FoodData Central SR Legacy CSVs...');
  const foods = new Map();

  const rlFood = readline.createInterface({
    input: fs.createReadStream(path.join(CSV_DIR, 'food.csv')),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  for await (const line of rlFood) {
    if (isHeader) { isHeader = false; continue; }
    const match = line.match(/^"(\d+)","[^"]*","([^"]+)"/);
    if (match) {
      foods.set(match[1], match[2]);
    }
  }

  const rlPortion = readline.createInterface({
    input: fs.createReadStream(path.join(CSV_DIR, 'food_portion.csv')),
    crlfDelay: Infinity,
  });

  isHeader = true;
  const usdaItems = new Map();

  for await (const line of rlPortion) {
    if (isHeader) { isHeader = false; continue; }
    const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
    if (parts.length < 8) continue;

    const fdcId = parts[1];
    const amount = parseFloat(parts[3]);
    const measureUnitId = parts[4];
    const modifier = parts[6] ? parts[6].toLowerCase() : '';
    const gramWeight = parseFloat(parts[7]);

    if (!foods.has(fdcId) || amount <= 0 || gramWeight <= 0) continue;

    const rawDesc = foods.get(fdcId);

    if (rawDesc.startsWith('Babyfood') || rawDesc.startsWith('Infant') || rawDesc.startsWith('Fast foods') || rawDesc.startsWith('CAMPBELL') || rawDesc.startsWith('KRAFT') || rawDesc.startsWith('SWANSON') || rawDesc.startsWith('MORNINGSTAR') || rawDesc.startsWith('Restaurant')) {
      continue;
    }

    let isCup = false;
    let isTbsp = false;

    if (measureUnitId === '1000' || modifier === 'cup' || modifier.startsWith('cup,')) {
      isCup = true;
    } else if (measureUnitId === '1001' || modifier === 'tbsp' || modifier.includes('tablespoon')) {
      isTbsp = true;
    }

    if (!isCup && !isTbsp) continue;

    let gramsPerCup = 0;
    let gramsPerTbsp = 0;

    if (isCup) {
      gramsPerCup = Math.round((gramWeight / amount) * 10) / 10;
      gramsPerTbsp = Math.round((gramsPerCup / 16) * 10) / 10;
    } else {
      gramsPerTbsp = Math.round((gramWeight / amount) * 10) / 10;
      gramsPerCup = Math.round((gramsPerTbsp * 16) * 10) / 10;
    }

    if (gramsPerCup < 15 || gramsPerCup > 500) continue;

    const naturalName = cleanUsdaDescription(rawDesc);
    const key = naturalName.toLowerCase();

    if (!usdaItems.has(key)) {
      const densityGPerMl = Number((gramsPerCup / 236.588).toFixed(4));
      const safeId = 'usda_' + fdcId;

      const aliases = [naturalName.toLowerCase()];
      if (rawDesc.toLowerCase() !== naturalName.toLowerCase()) {
        aliases.push(rawDesc.toLowerCase());
      }

      // Add common aliases for essential staples
      if (naturalName === 'Salted Butter' || naturalName === 'Unsalted Butter') {
        aliases.push('butter');
      }
      if (naturalName === 'Olive Oil') {
        aliases.push('extra virgin olive oil', 'evoo');
      }

      const stateModifiers = [];
      if (modifier.includes('chopped')) stateModifiers.push('chopped');
      if (modifier.includes('diced')) stateModifiers.push('diced');
      if (modifier.includes('shredded')) stateModifiers.push('shredded');
      if (modifier.includes('sliced')) stateModifiers.push('sliced');
      if (modifier.includes('grated')) stateModifiers.push('grated');
      if (modifier.includes('melted')) stateModifiers.push('melted');
      if (modifier.includes('packed')) stateModifiers.push('packed');

      usdaItems.set(key, {
        id: safeId,
        name: naturalName,
        aliases,
        category: categorize(naturalName),
        gramsPerCup,
        gramsPerTbsp,
        densityGPerMl,
        stateModifiers: stateModifiers.length > 0 ? stateModifiers : undefined,
        notes: `USDA SR Legacy (FDC ${fdcId}): ${amount} ${modifier || (isCup ? 'cup' : 'tbsp')} = ${gramWeight}g`,
        source: 'usda',
      });
    }
  }

  const records = Array.from(usdaItems.values());
  console.log(`Extracted ${records.length} culinary items from USDA SR Legacy.`);
  return records;
}

async function run() {
  const kaRecords = await fetchKingArthur();
  const usdaRecords = await parseUsdaSrLegacy();

  const mergedMap = new Map();

  // Add King Arthur first (highest precedence for baking)
  for (const item of kaRecords) {
    mergedMap.set(item.name.toLowerCase(), item);
  }

  // Add USDA items
  let addedFromUsda = 0;
  for (const item of usdaRecords) {
    const key = item.name.toLowerCase();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
      addedFromUsda++;
    }
  }

  const finalRecords = Array.from(mergedMap.values());
  console.log(`Merged Total: ${finalRecords.length} verified culinary density records.`);
  console.log(`  - ${kaRecords.length} from King Arthur Baking`);
  console.log(`  - ${addedFromUsda} added from USDA SR Legacy`);

  const manifest = {
    generatedAt: new Date().toISOString(),
    sources: {
      kingArthur: {
        url: 'https://www.kingarthurbaking.com/learn/ingredient-weight-chart',
        recordsCount: kaRecords.length,
      },
      usdaSrLegacy: {
        dataset: 'FoodData_Central_sr_legacy_food_csv_2018-04.zip',
        url: 'https://fdc.nal.usda.gov/download-datasets.html',
        recordsCount: addedFromUsda,
      },
    },
    totalRecords: finalRecords.length,
    sampleRecords: finalRecords.slice(0, 5),
  };
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

  const tsContent = `// FACTUALLY VERIFIED CULINARY DENSITY DATABASE
// Automatically compiled from:
// 1. King Arthur Baking Ingredient Weight Chart (https://www.kingarthurbaking.com/learn/ingredient-weight-chart)
// 2. USDA FoodData Central SR Legacy Standard Weights (https://fdc.nal.usda.gov/download-datasets.html)
//
// Total verified records: ${finalRecords.length}
// Generated at: ${manifest.generatedAt}

import { DensityRecord } from '../types/density';

export const INITIAL_DENSITIES: DensityRecord[] = ${JSON.stringify(finalRecords, null, 2)};
`;

  fs.writeFileSync(OUT_FILE, tsContent, 'utf-8');
  console.log(`Wrote ${finalRecords.length} verified records to: ${OUT_FILE}`);
}

run().catch(console.error);
