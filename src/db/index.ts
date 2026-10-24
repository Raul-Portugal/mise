import Dexie, { type Table } from 'dexie';
import { Recipe } from '../types/recipe';
import { DensityRecord } from '../types/density';
import { SEED_RECIPES } from '../data/seedRecipes';
import { INITIAL_DENSITIES } from '../data/densityDatabase';

export interface SettingItem {
  key: string;
  value: any;
}

export class MiseDatabase extends Dexie {
  recipes!: Table<Recipe, string>;
  customDensities!: Table<DensityRecord, string>;
  settings!: Table<SettingItem, string>;

  constructor() {
    super('MiseKitchenDB');
    this.version(1).stores({
      recipes: 'id, title, *tags, createdAt, updatedAt',
      customDensities: 'id, name, *aliases',
      settings: 'key',
    });
  }
}

export const db = new MiseDatabase();

export async function initializeDatabase(): Promise<void> {
  const recipeCount = await db.recipes.count();
  if (recipeCount === 0) {
    await db.recipes.bulkAdd(SEED_RECIPES);
  }

  const settingUnit = await db.settings.get('unitMode');
  if (!settingUnit) {
    await db.settings.put({ key: 'unitMode', value: 'metric' });
  }

  const soundSetting = await db.settings.get('soundEnabled');
  if (!soundSetting) {
    await db.settings.put({ key: 'soundEnabled', value: true });
  }

  const exactSetting = await db.settings.get('exactMode');
  if (!exactSetting) {
    await db.settings.put({ key: 'exactMode', value: false });
  }
}

export async function getAllDensities(): Promise<DensityRecord[]> {
  const custom = await db.customDensities.toArray();
  // Combine custom densities with bundled matrix (custom overrides bundled by id)
  const map = new Map<string, DensityRecord>();
  for (const d of INITIAL_DENSITIES) map.set(d.id, d);
  for (const c of custom) map.set(c.id, c);
  return Array.from(map.values());
}
