import React, { useState } from 'react';
import { Recipe } from '../../types/recipe';
import { WeeklyMealPlan, MealSlotType, PlannedMealItem } from '../../types/mealPlan';
import { WeekDayInfo } from '../../utils/dateUtils';
import { MEAL_SLOTS } from '../../utils/mealTags';
import { MealSlotCard } from './MealSlotCard';
import { Plus } from 'lucide-react';

interface MealPlannerMobileProps {
  days: WeekDayInfo[];
  mealPlan: WeeklyMealPlan;
  recipes: Recipe[];
  onAddRecipeToSlot: (dateStr: string, slot: MealSlotType, recipeId: string, servings: number) => void;
  onRemovePlannedItem: (dateStr: string, slot: MealSlotType, itemId: string) => void;
  onUpdateServings: (dateStr: string, slot: MealSlotType, itemId: string, servings: number) => void;
  onRequestAssign: (dateStr: string, dayLabel: string, slot: MealSlotType) => void;
  onViewRecipe?: (recipe: Recipe) => void;
}

export const MealPlannerMobile: React.FC<MealPlannerMobileProps> = ({
  days,
  mealPlan,
  recipes,
  onRemovePlannedItem,
  onUpdateServings,
  onRequestAssign,
  onViewRecipe,
}) => {
  // Find initial active day (today or the first day)
  const [selectedDayIso, setSelectedDayIso] = useState<string>(() => {
    const today = days.find((d) => d.isToday);
    return today ? today.isoDate : days[0]?.isoDate || '';
  });

  const selectedDay = days.find((d) => d.isoDate === selectedDayIso) || days[0];

  const recipeMap = React.useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach((r) => map.set(r.id, r));
    return map;
  }, [recipes]);

  if (!selectedDay) return null;

  const currentDayData = mealPlan.days?.[selectedDay.isoDate];

  return (
    <div className="space-y-4">
      {/* Horizontal Day Scroller Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {days.map((day) => {
          const isSelected = day.isoDate === selectedDayIso;
          const dayData = mealPlan.days?.[day.isoDate];
          const totalMeals =
            (dayData?.breakfast?.length || 0) +
            (dayData?.lunch?.length || 0) +
            (dayData?.snacks?.length || 0) +
            (dayData?.dinner?.length || 0);

          return (
            <button
              key={day.isoDate}
              onClick={() => setSelectedDayIso(day.isoDate)}
              className={`flex-1 min-w-[56px] py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-charcoal text-alabaster border-charcoal shadow-sm'
                  : day.isToday
                  ? 'bg-terracotta/10 border-terracotta/40 text-terracotta'
                  : 'bg-stone-surface border-stone-border text-charcoal'
              }`}
            >
              <span
                className={`text-[10px] font-mono uppercase ${
                  isSelected ? 'text-alabaster/70' : 'text-warm-grey'
                }`}
              >
                {day.dayName}
              </span>
              <span className="font-serif text-base font-bold my-0.5">
                {day.dayNumber}
              </span>
              {totalMeals > 0 && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-terracotta text-white'
                      : 'bg-stone-200 text-charcoal'
                  }`}
                >
                  {totalMeals}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Banner */}
      <div className="p-3 bg-stone-surface border border-stone-border rounded-xl flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-charcoal">
            {selectedDay.fullDayName}
          </h3>
          <p className="font-sans text-xs text-warm-grey">
            {selectedDay.shortDate}, {selectedDay.date.getFullYear()}
          </p>
        </div>
        {selectedDay.isToday && (
          <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/20">
            Today
          </span>
        )}
      </div>

      {/* 4 Vertical Meal Slots */}
      <div className="space-y-4">
        {MEAL_SLOTS.map((slotConfig) => {
          const items: PlannedMealItem[] = currentDayData?.[slotConfig.type] || [];

          return (
            <div
              key={slotConfig.type}
              className="bg-alabaster border border-stone-border rounded-2xl p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base text-charcoal">
                    {slotConfig.label}
                  </span>
                  <span className="font-mono text-xs text-warm-grey">
                    ({items.length})
                  </span>
                </div>

                <button
                  onClick={() =>
                    onRequestAssign(
                      selectedDay.isoDate,
                      `${selectedDay.dayName} ${selectedDay.shortDate}`,
                      slotConfig.type
                    )
                  }
                  className="flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Items */}
              {items.length === 0 ? (
                <button
                  onClick={() =>
                    onRequestAssign(
                      selectedDay.isoDate,
                      `${selectedDay.dayName} ${selectedDay.shortDate}`,
                      slotConfig.type
                    )
                  }
                  className="w-full py-4 border border-dashed border-stone-300 hover:border-terracotta/60 rounded-xl text-xs text-warm-grey hover:text-terracotta flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Plan {slotConfig.label}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <MealSlotCard
                      key={item.id}
                      item={item}
                      recipe={recipeMap.get(item.recipeId)}
                      dateStr={selectedDay.isoDate}
                      slot={slotConfig.type}
                      onRemove={() =>
                        onRemovePlannedItem(selectedDay.isoDate, slotConfig.type, item.id)
                      }
                      onUpdateServings={(servings) =>
                        onUpdateServings(
                          selectedDay.isoDate,
                          slotConfig.type,
                          item.id,
                          servings
                        )
                      }
                      onViewRecipe={onViewRecipe}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
