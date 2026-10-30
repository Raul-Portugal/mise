import React, { useState, useMemo } from 'react';
import { Recipe } from '../../types/recipe';
import { MealSlotType } from '../../types/mealPlan';
import { MEAL_SLOTS, recipeMatchesSlotFilter } from '../../utils/mealTags';
import { X, Search, Clock, Users, Plus, Check } from 'lucide-react';

interface AssignRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  dayLabel: string;
  slot: MealSlotType;
  recipes: Recipe[];
  onAssignRecipe: (recipeId: string, servings: number) => void;
}

export const AssignRecipeModal: React.FC<AssignRecipeModalProps> = ({
  isOpen,
  onClose,
  dateStr: _dateStr,
  dayLabel,
  slot,
  recipes,
  onAssignRecipe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MealSlotType | 'all'>(slot);

  // Sync tab with initial slot when opened
  React.useEffect(() => {
    setActiveTab(slot);
    setSearchQuery('');
  }, [slot, isOpen]);

  const slotConfig = MEAL_SLOTS.find((s) => s.type === slot) || MEAL_SLOTS[0];

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSlot = recipeMatchesSlotFilter(r.tags, r.title, activeTab);

      return matchesSearch && matchesSlot;
    });
  }, [recipes, searchQuery, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-alabaster border border-stone-border rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-border bg-stone-surface/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-terracotta px-2 py-0.5 rounded-full bg-terracotta/10 border border-terracotta/20">
                {dayLabel} · {slotConfig.label}
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
              Add Recipe to Meal Plan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warm-grey hover:text-charcoal hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-stone-border space-y-3 bg-alabaster">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-light" />
            <input
              type="text"
              placeholder="Search by title, tag, or ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-stone-surface border border-stone-border rounded-xl text-sm text-charcoal placeholder-warm-light focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-warm-grey hover:text-charcoal px-1.5 py-0.5 rounded bg-alabaster border border-stone-border"
              >
                Clear
              </button>
            )}
          </div>

          {/* Meal Slot Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-charcoal text-alabaster shadow-sm'
                  : 'bg-stone-surface border border-stone-border text-warm-grey hover:text-charcoal'
              }`}
            >
              All ({recipes.length})
            </button>
            {MEAL_SLOTS.map((s) => (
              <button
                key={s.type}
                onClick={() => setActiveTab(s.type)}
                className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
                  activeTab === s.type
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-stone-surface border border-stone-border text-warm-grey hover:text-charcoal'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12 text-warm-grey font-sans text-sm">
              <p>No matching recipes found.</p>
              <p className="text-xs text-warm-light mt-1">
                Try a different search or switch meal categories.
              </p>
            </div>
          ) : (
            filteredRecipes.map((r) => {
              const totalMins = (r.times.prepMinutes || 0) + (r.times.cookMinutes || 0);

              return (
                <div
                  key={r.id}
                  className="group p-3 sm:p-3.5 bg-stone-surface border border-stone-border hover:border-terracotta/50 rounded-xl transition-all flex items-center justify-between gap-3 shadow-tactile hover:shadow-tactile-hover"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif font-bold text-base text-charcoal group-hover:text-terracotta transition-colors truncate">
                      {r.title}
                    </h4>
                    {r.subtitle && (
                      <p className="font-sans text-xs text-warm-grey truncate mt-0.5">
                        {r.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-warm-grey">
                      {totalMins > 0 && (
                        <span className="flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3 text-warm-light" />
                          {totalMins}m
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-sans">
                        <Users className="w-3 h-3 text-warm-light" />
                        {r.servings.amount} {r.servings.unit}
                      </span>
                      {r.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.2 rounded bg-alabaster border border-stone-border text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAssignRecipe(r.id, r.servings.amount || 2);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white text-xs font-medium transition-all shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
