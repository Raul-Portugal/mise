import React, { useState, useMemo } from 'react';
import { Recipe } from '../../types/recipe';
import { DensityRecord } from '../../types/density';
import { ConversionMode } from '../../types/conversion';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useShoppingListState } from '../../hooks/useShoppingListState';
import {
  aggregateShoppingList,
  formatShoppingListForClipboard,
} from '../../utils/shoppingListAggregator';
import { formatWeekRangeDisplay } from '../../utils/dateUtils';
import { GroceryAisle, ShoppingListItem } from '../../types/mealPlan';
import {
  ShoppingCart,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Sparkles,
  ArrowLeft,
  X,
  Info,
} from 'lucide-react';

interface ShoppingListViewProps {
  weekId: string;
  recipes: Recipe[];
  densityDatabase: DensityRecord[];
  globalUnitMode: ConversionMode;
  onBackToPlanner: () => void;
  onViewRecipe?: (recipe: Recipe) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  weekId,
  recipes,
  densityDatabase,
  globalUnitMode,
  onBackToPlanner,
  onViewRecipe,
}) => {
  const { mealPlan, totalPlannedMealsCount } = useMealPlan(weekId);
  const {
    checkedKeys,
    customItems,
    toggleItemChecked,
    addCustomItem,
    toggleCustomItem,
    removeCustomItem,
    clearCheckedItems,
  } = useShoppingListState(weekId);

  // Unit mode toggle specific to shopping list, initialized from global setting
  const [shoppingUnitMode, setShoppingUnitMode] = useState<ConversionMode>(
    globalUnitMode === 'imperial' ? 'imperial' : 'metric'
  );

  // Input state for custom quick-add
  const [customInputText, setCustomInputText] = useState('');

  // Expandable recipe breakdown rows (set of canonical keys)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Collapsible state for Pantry Staples section (collapsed by default)
  const [isPantrySectionOpen, setIsPantrySectionOpen] = useState(false);

  // Toast notification for clipboard copy
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Calculate aggregated shopping items from weekly meal plan
  const aggregatedItems = useMemo(() => {
    return aggregateShoppingList(
      mealPlan,
      recipes,
      densityDatabase,
      shoppingUnitMode,
      checkedKeys
    );
  }, [mealPlan, recipes, densityDatabase, shoppingUnitMode, checkedKeys]);

  // Separate regular items from pantry staples
  const regularItems = useMemo(
    () => aggregatedItems.filter((i) => !i.isPantryStaple),
    [aggregatedItems]
  );
  const pantryItems = useMemo(
    () => aggregatedItems.filter((i) => i.isPantryStaple),
    [aggregatedItems]
  );

  // Combined totals & stats
  const totalCount = aggregatedItems.length + customItems.length;
  const checkedCount =
    aggregatedItems.filter((i) => i.checked).length +
    customItems.filter((c) => c.checked).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Toggle row breakdown expansion
  const toggleRowExpansion = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Add custom item handler
  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputText.trim()) return;
    addCustomItem(customInputText.trim());
    setCustomInputText('');
  };

  // Copy list to clipboard
  const handleCopyClipboard = async () => {
    const text = formatShoppingListForClipboard(aggregatedItems, customItems, false);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Shopping list copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback('Failed to copy to clipboard.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  // Group regular items and custom items by Aisle
  const aisleGroups = useMemo(() => {
    const aisles: GroceryAisle[] = [
      'Produce',
      'Meat, Poultry & Seafood',
      'Dairy, Cheese & Eggs',
      'Bakery & Grains',
      'Baking, Canned & Dry Goods',
      'Pantry Staples & Spices',
      'Other',
    ];

    const map = new Map<
      GroceryAisle,
      { regular: ShoppingListItem[]; custom: typeof customItems }
    >();

    for (const a of aisles) {
      map.set(a, { regular: [], custom: [] });
    }

    for (const item of regularItems) {
      const g = map.get(item.aisle) || { regular: [], custom: [] };
      g.regular.push(item);
      map.set(item.aisle, g);
    }

    for (const c of customItems) {
      const g = map.get(c.aisle) || { regular: [], custom: [] };
      g.custom.push(c);
      map.set(c.aisle, g);
    }

    return aisles
      .map((a) => ({
        aisle: a,
        items: map.get(a)!.regular,
        custom: map.get(a)!.custom,
        total: map.get(a)!.regular.length + map.get(a)!.custom.length,
      }))
      .filter((g) => g.total > 0 && g.aisle !== 'Pantry Staples & Spices');
  }, [regularItems, customItems]);

  const weekRangeLabel = formatWeekRangeDisplay(weekId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Toast Feedback */}
      {copyFeedback && (
        <div className="fixed top-20 right-6 z-50 bg-charcoal text-alabaster px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBackToPlanner}
            className="flex items-center gap-1 text-xs font-medium text-warm-grey hover:text-terracotta mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Weekly Planner</span>
          </button>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-charcoal flex items-center gap-3">
            Shopping List
            <span className="font-mono text-xs font-normal text-warm-grey px-2.5 py-0.5 rounded-full bg-stone-surface border border-stone-border">
              {weekRangeLabel}
            </span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-warm-grey mt-1">
            Aggregated from {totalPlannedMealsCount} planned meals with market-smart grocery rounding.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Unit Toggle Pill */}
          <div className="flex items-center bg-stone-surface border border-stone-border rounded-xl p-0.5 shadow-xs text-xs font-medium">
            <button
              onClick={() => setShoppingUnitMode('metric')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                shoppingUnitMode === 'metric'
                  ? 'bg-charcoal text-alabaster shadow-xs'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
            >
              Metric (g / ml)
            </button>
            <button
              onClick={() => setShoppingUnitMode('imperial')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                shoppingUnitMode === 'imperial'
                  ? 'bg-charcoal text-alabaster shadow-xs'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
            >
              Imperial (lbs / oz)
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-surface border border-stone-border hover:bg-alabaster text-charcoal text-xs font-medium transition-all shadow-xs"
            title="Copy unchecked items formatted for Apple Reminders / Notes"
          >
            <Copy className="w-3.5 h-3.5 text-warm-grey" />
            <span className="hidden sm:inline">Copy List</span>
          </button>

          {/* Clear Checked Button */}
          {checkedCount > 0 && (
            <button
              onClick={clearCheckedItems}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-surface border border-stone-border hover:bg-red-50 hover:text-red-600 text-warm-grey text-xs font-medium transition-all shadow-xs"
              title="Reset all checkboxes"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Stats */}
      {totalCount > 0 && (
        <div className="bg-stone-surface border border-stone-border rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-warm-grey">
              Progress: <strong className="text-charcoal font-bold">{checkedCount}</strong> of{' '}
              {totalCount} items acquired
            </span>
            <span className="font-bold text-terracotta">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-stone-border/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick-Add Custom Items Input */}
      <form onSubmit={handleAddCustomSubmit} className="mb-6">
        <div className="flex items-center gap-2 bg-stone-surface border border-stone-border rounded-2xl p-2 shadow-tactile focus-within:border-terracotta focus-within:ring-1 focus-within:ring-terracotta/40 transition-all">
          <div className="p-1.5 text-warm-light pl-2">
            <Plus className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Add custom item (e.g. coffee beans, sparkling water, paper towels)..."
            value={customInputText}
            onChange={(e) => setCustomInputText(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-charcoal placeholder-warm-light focus:outline-none"
          />
          <button
            type="submit"
            disabled={!customInputText.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta-hover disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-xs shrink-0"
          >
            Add
          </button>
        </div>
      </form>

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="text-center py-16 bg-stone-surface/40 border border-dashed border-stone-300 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-charcoal">
            Your shopping list is empty
          </h3>
          <p className="font-sans text-xs text-warm-grey max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Plan recipes on the Weekly Meal Planner or use the input above to quickly add grocery items.
          </p>
          <button
            onClick={onBackToPlanner}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal text-alabaster text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Go to Meal Planner</span>
          </button>
        </div>
      )}

      {/* Categorized Grocery Aisles */}
      <div className="space-y-6">
        {aisleGroups.map((group) => (
          <div
            key={group.aisle}
            className="bg-stone-surface/60 border border-stone-border rounded-2xl p-4 sm:p-5 space-y-3"
          >
            {/* Aisle Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-border/70">
              <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2">
                {group.aisle}
                <span className="font-mono text-xs font-normal text-warm-grey px-2 py-0.2 rounded-full bg-alabaster border border-stone-border">
                  {group.total}
                </span>
              </h3>
            </div>

            {/* List of items in this aisle */}
            <div className="divide-y divide-stone-border/40">
              {/* Recipe-aggregated items */}
              {group.items.map((item) => {
                const isExpanded = expandedKeys.has(item.canonicalKey);

                return (
                  <div key={item.id} className="py-2.5 group">
                    <div className="flex items-center justify-between gap-3">
                      {/* Checkbox and Item Name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleItemChecked(item.canonicalKey)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            item.checked
                              ? 'bg-sage border-sage text-white'
                              : 'bg-alabaster border-stone-border hover:border-terracotta'
                          }`}
                          aria-label={`Toggle ${item.displayName}`}
                        >
                          {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <span
                            onClick={() => toggleItemChecked(item.canonicalKey)}
                            className={`text-sm cursor-pointer transition-colors ${
                              item.checked
                                ? 'line-through text-warm-light'
                                : 'text-charcoal font-medium'
                            }`}
                          >
                            {item.displayName}
                          </span>

                          {item.note && (
                            <span className="block text-[11px] font-sans text-warm-grey mt-0.5">
                              {item.note}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Provenance Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            item.checked ? 'text-warm-light' : 'text-charcoal'
                          }`}
                        >
                          {item.displayQuantity}{' '}
                          <span className="text-xs font-medium font-sans text-warm-grey">
                            {item.displayUnit}
                          </span>
                        </span>

                        {item.sourceRecipes.length > 0 && (
                          <button
                            onClick={() => toggleRowExpansion(item.canonicalKey)}
                            className="p-1 rounded text-warm-light hover:text-charcoal hover:bg-stone-200 transition-colors"
                            title="Inspect recipe breakdown"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Recipe Provenance Breakdown */}
                    {isExpanded && item.sourceRecipes.length > 0 && (
                      <div className="mt-2 ml-8 pl-3 border-l-2 border-stone-300 py-1 space-y-1 text-xs text-warm-grey bg-alabaster/50 rounded-r-lg p-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-warm-light mb-1">
                          Source Recipes:
                        </div>
                        {item.sourceRecipes.map((src, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="font-serif italic">{src.recipeTitle}</span>
                            <span className="font-mono text-warm-grey font-medium">
                              {src.originalText.replace(` (${src.recipeTitle})`, '')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Custom added items in this aisle */}
              {group.custom.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleCustomItem(c.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        c.checked
                          ? 'bg-sage border-sage text-white'
                          : 'bg-alabaster border-stone-border hover:border-terracotta'
                      }`}
                    >
                      {c.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <span
                      onClick={() => toggleCustomItem(c.id)}
                      className={`text-sm cursor-pointer ${
                        c.checked ? 'line-through text-warm-light' : 'text-charcoal font-medium'
                      }`}
                    >
                      {c.name}
                    </span>
                    <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-stone-200/60 text-warm-grey">
                      Custom
                    </span>
                  </div>

                  <button
                    onClick={() => removeCustomItem(c.id)}
                    className="p-1 rounded text-warm-light hover:text-red-600 transition-colors"
                    title="Delete custom item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Collapsible "Check Pantry First" Section */}
        {pantryItems.length > 0 && (
          <div className="bg-stone-surface/40 border border-stone-border rounded-2xl overflow-hidden transition-all">
            <button
              onClick={() => setIsPantrySectionOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-surface/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-charcoal">
                    Check Pantry First
                  </h3>
                  <p className="font-sans text-xs text-warm-grey">
                    {pantryItems.length} common kitchen staples (salt, pepper, oils, water)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-warm-grey text-xs">
                <span>{isPantrySectionOpen ? 'Hide' : 'Review'}</span>
                {isPantrySectionOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {isPantrySectionOpen && (
              <div className="p-4 pt-0 border-t border-stone-border/60 divide-y divide-stone-border/40">
                {pantryItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleItemChecked(item.canonicalKey)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          item.checked
                            ? 'bg-sage border-sage text-white'
                            : 'bg-alabaster border-stone-border hover:border-terracotta'
                        }`}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span
                        className={`${
                          item.checked ? 'line-through text-warm-light' : 'text-charcoal'
                        }`}
                      >
                        {item.displayName}
                      </span>
                    </div>

                    <span className="font-mono text-xs text-warm-grey font-medium tabular-nums">
                      {item.displayQuantity} {item.displayUnit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
