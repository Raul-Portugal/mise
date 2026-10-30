import React, { useState } from 'react';
import { Recipe } from '../../types/recipe';
import { PlannedMealItem, MealSlotType } from '../../types/mealPlan';
import { X, Minus, Plus, GripVertical, Users } from 'lucide-react';

interface MealSlotCardProps {
  item: PlannedMealItem;
  recipe?: Recipe;
  dateStr: string;
  slot: MealSlotType;
  onRemove: () => void;
  onUpdateServings: (servings: number) => void;
  onViewRecipe?: (recipe: Recipe) => void;
}

export const MealSlotCard: React.FC<MealSlotCardProps> = ({
  item,
  recipe,
  dateStr,
  slot,
  onRemove,
  onUpdateServings,
  onViewRecipe,
}) => {
  const [isEditingServings, setIsEditingServings] = useState(false);

  if (!recipe) {
    return (
      <div className="p-2.5 rounded-lg bg-stone-200/50 border border-stone-300 text-xs text-warm-grey flex items-center justify-between">
        <span className="italic">Recipe not found</span>
        <button onClick={onRemove} className="text-warm-grey hover:text-charcoal">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'move_recipe',
        fromDateStr: dateStr,
        fromSlot: slot,
        fromItemId: item.id,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable={!isEditingServings}
      onDragStart={handleDragStart}
      className="group relative bg-stone-surface border border-stone-border hover:border-terracotta/50 rounded-xl p-2.5 shadow-tactile hover:shadow-tactile-hover transition-all duration-150 cursor-grab active:cursor-grabbing text-left"
    >
      {/* Top row: Drag grip, Title & Remove */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <div className="text-warm-light group-hover:text-terracotta transition-colors pt-0.5 shrink-0">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={() => onViewRecipe && onViewRecipe(recipe)}
            className="font-serif font-bold text-xs sm:text-sm text-charcoal hover:text-terracotta transition-colors line-clamp-2 text-left"
            title="Click to view recipe details"
          >
            {recipe.title}
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-warm-light hover:text-terracotta p-0.5 rounded transition-colors shrink-0"
          title="Remove from meal plan"
          aria-label="Remove meal"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom row: Servings Pill & Stepper */}
      <div className="mt-2 pt-1.5 border-t border-stone-border/50 flex items-center justify-between text-[11px] font-mono">
        {isEditingServings ? (
          <div
            className="flex items-center gap-1 bg-alabaster border border-stone-border rounded-md px-1 py-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onUpdateServings(Math.max(1, item.servingsOverride - 1))}
              className="p-0.5 text-warm-grey hover:text-charcoal rounded hover:bg-stone-200"
              title="Decrease servings"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-charcoal px-1 min-w-[20px] text-center tabular-nums">
              {item.servingsOverride}
            </span>
            <button
              onClick={() => onUpdateServings(item.servingsOverride + 1)}
              className="p-0.5 text-warm-grey hover:text-charcoal rounded hover:bg-stone-200"
              title="Increase servings"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsEditingServings(false)}
              className="text-[10px] text-terracotta font-sans font-medium px-1 hover:underline"
            >
              Done
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingServings(true);
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-alabaster border border-stone-border text-warm-grey hover:text-charcoal hover:border-terracotta/40 transition-all font-sans text-[10px]"
            title="Click to adjust servings"
          >
            <Users className="w-2.5 h-2.5 text-warm-light" />
            <span className="font-mono font-medium">{item.servingsOverride}</span>
            <span>servings</span>
          </button>
        )}

        {recipe.times.prepMinutes || recipe.times.cookMinutes ? (
          <span className="text-[10px] font-sans text-warm-grey">
            {(recipe.times.prepMinutes || 0) + (recipe.times.cookMinutes || 0)}m
          </span>
        ) : null}
      </div>
    </div>
  );
};
