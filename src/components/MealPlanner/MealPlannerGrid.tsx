import React, { useState } from 'react';
import { Recipe } from '../../types/recipe';
import { WeeklyMealPlan, MealSlotType, PlannedMealItem } from '../../types/mealPlan';
import { WeekDayInfo } from '../../utils/dateUtils';
import { MEAL_SLOTS } from '../../utils/mealTags';
import { MealSlotCard } from './MealSlotCard';
import { Plus } from 'lucide-react';

interface MealPlannerGridProps {
  days: WeekDayInfo[];
  mealPlan: WeeklyMealPlan;
  recipes: Recipe[];
  onAddRecipeToSlot: (dateStr: string, slot: MealSlotType, recipeId: string, servings: number) => void;
  onRemovePlannedItem: (dateStr: string, slot: MealSlotType, itemId: string) => void;
  onUpdateServings: (dateStr: string, slot: MealSlotType, itemId: string, servings: number) => void;
  onMoveRecipeBetweenSlots: (
    fromDateStr: string,
    fromSlot: MealSlotType,
    fromItemId: string,
    toDateStr: string,
    toSlot: MealSlotType
  ) => void;
  onRequestAssign: (dateStr: string, dayLabel: string, slot: MealSlotType) => void;
  onViewRecipe?: (recipe: Recipe) => void;
}

export const MealPlannerGrid: React.FC<MealPlannerGridProps> = ({
  days,
  mealPlan,
  recipes,
  onAddRecipeToSlot,
  onRemovePlannedItem,
  onUpdateServings,
  onMoveRecipeBetweenSlots,
  onRequestAssign,
  onViewRecipe,
}) => {
  const recipeMap = React.useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach((r) => map.set(r.id, r));
    return map;
  }, [recipes]);

  // Track which slot has active drag over: `${dateStr}_${slot}`
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, dateStr: string, slot: MealSlotType) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setActiveDropTarget(`${dateStr}_${slot}`);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, toDateStr: string, toSlot: MealSlotType) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropTarget(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.type === 'new_recipe' && data.recipeId) {
        onAddRecipeToSlot(toDateStr, toSlot, data.recipeId, data.servings || 2);
      } else if (data.type === 'move_recipe' && data.fromItemId) {
        onMoveRecipeBetweenSlots(
          data.fromDateStr,
          data.fromSlot,
          data.fromItemId,
          toDateStr,
          toSlot
        );
      }
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[850px] select-none">
        {/* Days Header Row */}
        <div className="grid grid-cols-7 gap-3 mb-3">
          {days.map((day) => (
            <div
              key={day.isoDate}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                day.isToday
                  ? 'bg-terracotta/10 border-terracotta/40 shadow-xs'
                  : 'bg-stone-surface border-stone-border'
              }`}
            >
              <div className="text-[11px] font-mono uppercase tracking-wider text-warm-grey">
                {day.dayName}
              </div>
              <div
                className={`font-serif text-lg font-bold ${
                  day.isToday ? 'text-terracotta' : 'text-charcoal'
                }`}
              >
                {day.shortDate}
              </div>
              {day.isToday && (
                <span className="inline-block text-[9px] font-sans font-semibold uppercase tracking-wider text-terracotta mt-0.5">
                  Today
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 4 Meal Rows */}
        <div className="space-y-4">
          {MEAL_SLOTS.map((slotConfig) => (
            <div key={slotConfig.type} className="space-y-1.5">
              {/* Row Header Label */}
              <div className="flex items-center gap-2 px-1">
                <span className="font-serif font-bold text-sm tracking-wide text-charcoal">
                  {slotConfig.label}
                </span>
                <div className="h-px bg-stone-border/70 flex-1" />
              </div>

              {/* 7 Columns for this meal slot */}
              <div className="grid grid-cols-7 gap-3">
                {days.map((day) => {
                  const dayData = mealPlan.days?.[day.isoDate];
                  const items: PlannedMealItem[] = dayData?.[slotConfig.type] || [];
                  const isDropActive = activeDropTarget === `${day.isoDate}_${slotConfig.type}`;

                  return (
                    <div
                      key={`${day.isoDate}_${slotConfig.type}`}
                      onDragOver={(e) => handleDragOver(e, day.isoDate, slotConfig.type)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day.isoDate, slotConfig.type)}
                      className={`min-h-[96px] rounded-xl p-2 transition-all flex flex-col justify-between ${
                        isDropActive
                          ? 'bg-terracotta/10 border-2 border-dashed border-terracotta scale-[1.01]'
                          : items.length > 0
                          ? 'bg-alabaster/60 border border-stone-border'
                          : 'bg-transparent border border-dashed border-stone-300 hover:border-terracotta/50'
                      }`}
                    >
                      {/* Stack of planned items in this slot */}
                      <div className="space-y-2">
                        {items.map((item) => (
                          <MealSlotCard
                            key={item.id}
                            item={item}
                            recipe={recipeMap.get(item.recipeId)}
                            dateStr={day.isoDate}
                            slot={slotConfig.type}
                            onRemove={() =>
                              onRemovePlannedItem(day.isoDate, slotConfig.type, item.id)
                            }
                            onUpdateServings={(servings) =>
                              onUpdateServings(day.isoDate, slotConfig.type, item.id, servings)
                            }
                            onViewRecipe={onViewRecipe}
                          />
                        ))}
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() =>
                          onRequestAssign(day.isoDate, `${day.dayName} ${day.shortDate}`, slotConfig.type)
                        }
                        className={`w-full py-1.5 rounded-lg text-xs font-sans font-medium transition-all flex items-center justify-center gap-1 ${
                          items.length === 0
                            ? 'text-warm-light hover:text-terracotta hover:bg-stone-surface/80 mt-auto'
                            : 'text-warm-grey hover:text-terracotta hover:bg-stone-surface mt-2 text-[11px]'
                        }`}
                        title={`Add to ${day.dayName} ${slotConfig.label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{items.length === 0 ? 'Add' : 'Add another'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
