import React, { useState, useMemo } from 'react';
import { Recipe } from '../../types/recipe';
import { MealSlotType } from '../../types/mealPlan';
import { MEAL_SLOTS, recipeMatchesSlotFilter } from '../../utils/mealTags';
import { Search, GripVertical, Clock, Users, Plus, ChevronRight, ChevronLeft } from 'lucide-react';

interface RecipeDrawerProps {
  recipes: Recipe[];
  onSelectRecipeForSlot?: (recipe: Recipe) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const RecipeDrawer: React.FC<RecipeDrawerProps> = ({
  recipes,
  onSelectRecipeForSlot,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MealSlotType | 'all'>('all');

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.ingredients.some((i) => i.item.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSlot = recipeMatchesSlotFilter(r.tags, r.title, activeTab);

      return matchesSearch && matchesSlot;
    });
  }, [recipes, searchQuery, activeTab]);

  return (
    <div
      className={`transition-all duration-300 flex flex-col bg-stone-surface border-l border-stone-border ${
        isOpen ? 'w-full md:w-80 lg:w-96' : 'w-11'
      }`}
    >
      {/* Collapsed Toggle Button */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="h-full w-11 flex flex-col items-center py-4 bg-stone-surface hover:bg-stone-200/60 transition-colors group cursor-pointer border-none focus:outline-none"
          title="Open Recipe Drawer"
          aria-label="Open Recipe Drawer"
        >
          <div className="p-1.5 rounded-lg bg-alabaster border border-stone-border text-warm-grey group-hover:text-terracotta group-hover:border-terracotta/40 transition-colors shadow-2xs">
            <ChevronLeft className="w-4 h-4" />
          </div>

          <div className="my-3 w-5 h-px bg-stone-border" />

          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-alabaster border border-stone-border text-warm-grey group-hover:text-charcoal mb-4">
            {recipes.length}
          </span>

          <div className="flex-1 flex items-center justify-center">
            <span
              className="font-serif text-xs font-bold uppercase tracking-widest text-warm-grey group-hover:text-charcoal transition-colors whitespace-nowrap select-none"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              Recipe Drawer
            </span>
          </div>
        </button>
      )}

      {/* Expanded Drawer Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-stone-border bg-stone-surface flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2">
                Recipe Drawer
                <span className="font-mono text-xs font-normal text-warm-grey px-2 py-0.5 rounded-full bg-alabaster border border-stone-border">
                  {filteredRecipes.length}
                </span>
              </h3>
              <p className="font-sans text-[11px] text-warm-grey mt-0.5">
                Drag cards onto the planner grid
              </p>
            </div>
            <button
              onClick={onToggleOpen}
              className="p-1.5 rounded-lg text-warm-grey hover:text-charcoal hover:bg-stone-200 transition-colors"
              title="Collapse Drawer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Tabs */}
          <div className="p-3 border-b border-stone-border space-y-2.5 bg-alabaster/60">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-warm-light" />
              <input
                type="text"
                placeholder="Filter recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-stone-surface border border-stone-border rounded-lg text-xs text-charcoal placeholder-warm-light focus:outline-none focus:border-terracotta"
              />
            </div>

            {/* Pill Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-charcoal text-alabaster shadow-xs'
                    : 'bg-stone-surface border border-stone-border text-warm-grey hover:text-charcoal'
                }`}
              >
                All
              </button>
              {MEAL_SLOTS.map((s) => (
                <button
                  key={s.type}
                  onClick={() => setActiveTab(s.type)}
                  className={`px-2 py-1 rounded-md font-medium transition-all shrink-0 ${
                    activeTab === s.type
                      ? 'bg-terracotta text-white shadow-xs'
                      : 'bg-stone-surface border border-stone-border text-warm-grey hover:text-charcoal'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Draggable Recipe Chips List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-10 text-xs text-warm-grey">
                No recipes match this filter.
              </div>
            ) : (
              filteredRecipes.map((r) => {
                const totalMins = (r.times.prepMinutes || 0) + (r.times.cookMinutes || 0);

                return (
                  <div
                    key={r.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({
                          type: 'new_recipe',
                          recipeId: r.id,
                          servings: r.servings.amount || 2,
                        })
                      );
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="group bg-alabaster border border-stone-border hover:border-terracotta/60 rounded-xl p-2.5 cursor-grab active:cursor-grabbing hover:shadow-tactile transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="text-warm-light group-hover:text-terracotta transition-colors shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-charcoal group-hover:text-terracotta transition-colors truncate">
                          {r.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-warm-grey mt-0.5">
                          {totalMins > 0 && (
                            <span className="flex items-center gap-0.5 font-sans">
                              <Clock className="w-2.5 h-2.5 text-warm-light" />
                              {totalMins}m
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 font-sans">
                            <Users className="w-2.5 h-2.5 text-warm-light" />
                            {r.servings.amount} {r.servings.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {onSelectRecipeForSlot && (
                      <button
                        onClick={() => onSelectRecipeForSlot(r)}
                        className="p-1 rounded-md text-warm-grey hover:text-terracotta hover:bg-stone-surface transition-colors shrink-0"
                        title="Add to selected slot"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
