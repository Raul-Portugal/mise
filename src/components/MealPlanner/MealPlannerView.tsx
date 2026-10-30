import React, { useState } from 'react';
import { Recipe } from '../../types/recipe';
import { MealSlotType } from '../../types/mealPlan';
import { useMealPlan } from '../../hooks/useMealPlan';
import {
  getDaysOfISOWeek,
  formatWeekRangeDisplay,
} from '../../utils/dateUtils';
import { MealPlannerGrid } from './MealPlannerGrid';
import { MealPlannerMobile } from './MealPlannerMobile';
import { RecipeDrawer } from './RecipeDrawer';
import { AssignRecipeModal } from './AssignRecipeModal';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Trash2,
  CalendarDays,
  Sparkles,
  Printer,
} from 'lucide-react';
import { exportMealPlanToPdf } from '../../utils/pdfExport';

interface MealPlannerViewProps {
  recipes: Recipe[];
  onOpenShoppingList: (weekId: string) => void;
  onViewRecipe?: (recipe: Recipe) => void;
  initialWeekId?: string;
}

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  recipes,
  onOpenShoppingList,
  onViewRecipe,
  initialWeekId,
}) => {
  const {
    weekId,
    mealPlan,
    totalPlannedMealsCount,
    addRecipeToSlot,
    removePlannedItem,
    updateSlotServings,
    moveRecipeBetweenSlots,
    clearWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useMealPlan(initialWeekId);

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    dateStr: string;
    dayLabel: string;
    slot: MealSlotType;
  }>({
    isOpen: false,
    dateStr: '',
    dayLabel: '',
    slot: 'dinner',
  });

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const days = React.useMemo(() => getDaysOfISOWeek(weekId), [weekId]);
  const weekLabel = React.useMemo(() => formatWeekRangeDisplay(weekId), [weekId]);

  const handleOpenAssign = (dateStr: string, dayLabel: string, slot: MealSlotType) => {
    setAssignModal({
      isOpen: true,
      dateStr,
      dayLabel,
      slot,
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-warm-grey">
              Weekly Schedule · {weekId}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-charcoal flex items-center gap-3">
            Meal Planner
            {totalPlannedMealsCount > 0 && (
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/20">
                {totalPlannedMealsCount} planned
              </span>
            )}
          </h2>
        </div>

        {/* Action Controls & Shopping List CTA */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Week Navigator */}
          <div className="flex items-center bg-stone-surface border border-stone-border rounded-xl p-1 shadow-xs">
            <button
              onClick={goToPreviousWeek}
              className="p-1.5 rounded-lg text-warm-grey hover:text-charcoal hover:bg-alabaster transition-colors"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs font-semibold px-3 text-charcoal min-w-[150px] text-center">
              {weekLabel}
            </span>

            <button
              onClick={goToNextWeek}
              className="p-1.5 rounded-lg text-warm-grey hover:text-charcoal hover:bg-alabaster transition-colors"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={goToCurrentWeek}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-surface border border-stone-border text-warm-grey hover:text-charcoal hover:bg-alabaster text-xs font-medium transition-all shadow-xs"
            title="Jump to current week"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Clear Week */}
          {totalPlannedMealsCount > 0 && (
            <>
              {isConfirmingClear ? (
                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-xl p-1 text-xs">
                  <span className="text-red-700 px-2 font-medium">Clear all?</span>
                  <button
                    onClick={() => {
                      clearWeek();
                      setIsConfirmingClear(false);
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-2 py-1 bg-white border border-red-200 text-charcoal rounded-lg"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="p-2 rounded-xl bg-stone-surface border border-stone-border text-warm-grey hover:text-red-600 hover:bg-red-50 transition-all text-xs"
                  title="Clear entire week"
                  aria-label="Clear week"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Export PDF Button */}
          <button
            onClick={() => exportMealPlanToPdf(mealPlan, recipes, weekId)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-surface border border-stone-border hover:bg-alabaster hover:border-stone-400 text-charcoal text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-[0.99]"
            title="Export Weekly Meal Plan as PDF"
          >
            <Printer className="w-4 h-4 text-warm-grey" />
            <span>Export PDF</span>
          </button>

          {/* Primary CTA: Generate Shopping List */}
          <button
            onClick={() => onOpenShoppingList(weekId)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-xs sm:text-sm font-semibold shadow-tactile hover:shadow-tactile-hover transition-all active:scale-[0.99]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>
              Generate Shopping List
              {totalPlannedMealsCount > 0 ? ` (${totalPlannedMealsCount})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex gap-4 items-start">
        {/* Planner View Area */}
        <div className="flex-1 min-w-0 bg-stone-surface/30 border border-stone-border/60 rounded-2xl p-3 sm:p-5">
          {/* Desktop Grid (hidden on small viewports) */}
          <div className="hidden md:block">
            <MealPlannerGrid
              days={days}
              mealPlan={mealPlan}
              recipes={recipes}
              onAddRecipeToSlot={addRecipeToSlot}
              onRemovePlannedItem={removePlannedItem}
              onUpdateServings={updateSlotServings}
              onMoveRecipeBetweenSlots={moveRecipeBetweenSlots}
              onRequestAssign={handleOpenAssign}
              onViewRecipe={onViewRecipe}
            />
          </div>

          {/* Mobile Agenda / Day View (visible < 768px) */}
          <div className="block md:hidden">
            <MealPlannerMobile
              days={days}
              mealPlan={mealPlan}
              recipes={recipes}
              onAddRecipeToSlot={addRecipeToSlot}
              onRemovePlannedItem={removePlannedItem}
              onUpdateServings={updateSlotServings}
              onRequestAssign={handleOpenAssign}
              onViewRecipe={onViewRecipe}
            />
          </div>
        </div>

        {/* Collapsible Recipe Drawer (Desktop Lateral Panel) */}
        <div className="hidden md:block sticky top-20">
          <RecipeDrawer
            recipes={recipes}
            isOpen={isDrawerOpen}
            onToggleOpen={() => setIsDrawerOpen((prev) => !prev)}
            onSelectRecipeForSlot={(recipe) => {
              // Quick helper: adds to first day's dinner or open modal
              const today = days.find((d) => d.isToday) || days[0];
              addRecipeToSlot(today.isoDate, 'dinner', recipe.id, recipe.servings.amount || 2);
            }}
          />
        </div>
      </div>

      {/* Assign Recipe Modal */}
      <AssignRecipeModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal((prev) => ({ ...prev, isOpen: false }))}
        dateStr={assignModal.dateStr}
        dayLabel={assignModal.dayLabel}
        slot={assignModal.slot}
        recipes={recipes}
        onAssignRecipe={(recipeId, servings) => {
          addRecipeToSlot(assignModal.dateStr, assignModal.slot, recipeId, servings);
        }}
      />
    </div>
  );
};
