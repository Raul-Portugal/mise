import React, { useState } from 'react';
import { Recipe, ActiveTimer } from '../types/recipe';
import { ConversionMode } from '../types/conversion';
import { DensityRecord } from '../types/density';
import { convertIngredient } from '../engine/converter';
import { parseStepTokens } from '../engine/stepParser';
import { formatTime } from '../utils/formatters';
import {
  ArrowLeft,
  Clock,
  Play,
  Edit3,
  Trash2,
  Minus,
  Plus,
  Check,
  Timer as TimerIcon,
  Sparkles,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

interface RecipeDetailProps {
  recipe: Recipe;
  unitMode: ConversionMode;
  onUnitModeChange: (mode: ConversionMode) => void;
  exactMode: boolean;
  onToggleExactMode: () => void;
  densityDatabase: DensityRecord[];
  onBack: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onStartCooking: (recipe: Recipe) => void;
  onStartTimer: (
    label: string,
    durationSeconds: number,
    options?: { stepNumber?: number; timerKey?: string }
  ) => void;
  activeTimers?: ActiveTimer[];
  onToggleTimer?: (id: string) => void;
  onAddMinute?: (id: string) => void;
  onResetTimer?: (id: string) => void;
  onRemoveTimer?: (id: string) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  unitMode,
  onUnitModeChange,
  exactMode,
  onToggleExactMode,
  densityDatabase,
  onBack,
  onEdit,
  onDelete,
  onStartCooking,
  onStartTimer,
  activeTimers = [],
  onToggleTimer,
  onAddMinute: _onAddMinute,
  onResetTimer: _onResetTimer,
  onRemoveTimer: _onRemoveTimer,
}) => {
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentServings = Math.round(recipe.servings.amount * multiplier * 10) / 10;

  // Group ingredients by group
  const groupedIngredients = React.useMemo(() => {
    const groups: Record<string, typeof recipe.ingredients> = {};
    for (const ing of recipe.ingredients) {
      const g = ing.group || 'Ingredients';
      if (!groups[g]) groups[g] = [];
      groups[g].push(ing);
    }
    return groups;
  }, [recipe.ingredients]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-16">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-warm-grey hover:text-charcoal px-2.5 py-1.5 rounded-lg hover:bg-stone-surface transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(recipe)}
            className="flex items-center gap-1 text-xs font-medium text-warm-grey hover:text-charcoal px-2.5 py-1.5 rounded-lg border border-stone-border bg-alabaster hover:bg-stone-surface transition-all"
            title="Edit recipe"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${recipe.title}"?`)) {
                onDelete(recipe.id);
              }
            }}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1.5 rounded-lg border border-stone-border bg-alabaster hover:bg-red-50 transition-all"
            title="Delete recipe"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editorial Title Header */}
      <div className="border-b border-stone-border pb-6 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-full bg-stone-surface border border-stone-border text-warm-grey"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-charcoal leading-tight mb-3">
          {recipe.title}
        </h1>

        {recipe.subtitle && (
          <p className="font-sans text-base sm:text-lg text-warm-grey leading-relaxed max-w-2xl mb-6">
            {recipe.subtitle}
          </p>
        )}

        {/* Times & Yield Badges */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-warm-grey pt-4 border-t border-stone-border/60">
          {recipe.times.prepMinutes && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-warm-light" />
              <span>Prep: <strong className="text-charcoal font-mono">{recipe.times.prepMinutes}m</strong></span>
            </div>
          )}
          {recipe.times.cookMinutes && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-warm-light" />
              <span>Cook: <strong className="text-charcoal font-mono">{recipe.times.cookMinutes}m</strong></span>
            </div>
          )}
          {recipe.times.restingMinutes && (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Rest/Ferment: <strong className="text-charcoal font-mono">{recipe.times.restingMinutes > 60 ? `${Math.round(recipe.times.restingMinutes / 60)}h` : `${recipe.times.restingMinutes}m`}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Control Strip: Scaler & Unit Switcher & Start Cooking */}
      <div className="bg-stone-surface border border-stone-border rounded-2xl p-4 sm:p-5 mb-10 shadow-tactile flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Dynamic Yield Scaler */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-warm-grey uppercase tracking-wider">Yield</span>
          <div className="flex items-center bg-alabaster border border-stone-border rounded-lg p-1">
            <button
              onClick={() => setMultiplier((m) => Math.max(0.25, Math.round((m - 0.25) * 100) / 100))}
              className="p-1 rounded text-warm-grey hover:text-charcoal hover:bg-stone-surface transition-all"
              title="Decrease servings"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-xs font-mono font-bold text-charcoal tabular-nums">
              {currentServings} {recipe.servings.unit}
            </span>
            <button
              onClick={() => setMultiplier((m) => Math.round((m + 0.25) * 100) / 100)}
              className="p-1 rounded text-warm-grey hover:text-charcoal hover:bg-stone-surface transition-all"
              title="Increase servings"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick multiplier chips */}
          <div className="flex items-center gap-1 text-xs font-mono">
            {[0.5, 1.0, 2.0].map((val) => (
              <button
                key={val}
                onClick={() => setMultiplier(val)}
                className={`px-2 py-0.5 rounded transition-all ${
                  multiplier === val
                    ? 'bg-charcoal text-alabaster font-bold'
                    : 'bg-alabaster border border-stone-border text-warm-grey hover:text-charcoal'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {/* Recipe-Specific Unit & Rounding Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unit Toggle Pill */}
          <div className="flex items-center bg-alabaster border border-stone-border rounded-xl p-0.5 shadow-2xs text-xs font-medium">
            <button
              onClick={() => onUnitModeChange('metric')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                unitMode === 'metric'
                  ? 'bg-charcoal text-alabaster shadow-xs font-semibold'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
              title="Weight-first metric conversions (g & ml)"
            >
              Metric (g)
            </button>
            <button
              onClick={() => onUnitModeChange('imperial')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                unitMode === 'imperial'
                  ? 'bg-charcoal text-alabaster shadow-xs font-semibold'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
              title="Imperial fractions & volumes"
            >
              Imperial
            </button>
            <button
              onClick={() => onUnitModeChange('original')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                unitMode === 'original'
                  ? 'bg-charcoal text-alabaster shadow-xs font-semibold'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
              title="Original author quantities"
            >
              Original
            </button>
          </div>

          {/* Exact / Culinary Rounding Toggle */}
          <button
            onClick={onToggleExactMode}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              exactMode
                ? 'bg-amber-100/80 border-amber-300 text-amber-900 font-semibold'
                : 'bg-alabaster border-stone-border text-warm-grey hover:text-charcoal'
            }`}
            title={exactMode ? 'Raw exact precision active' : 'Culinary smart rounding active'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{exactMode ? '= Exact' : '~ Rounded'}</span>
          </button>
        </div>

        {/* Start Cooking CTA Button */}
        <button
          onClick={() => onStartCooking(recipe)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-medium text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Cooking</span>
        </button>
      </div>

      {/* Main Content: Split Grid for Ingredients and Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Ingredients Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-border">
            <h2 className="font-serif text-2xl font-bold text-charcoal">Ingredients</h2>
            <span className="text-xs text-warm-grey font-mono">
              {recipe.ingredients.length} items
            </span>
          </div>

          {Object.entries(groupedIngredients).map(([groupName, items]) => (
            <div key={groupName} className="space-y-2">
              {groupName !== 'Ingredients' && (
                <h3 className="font-serif text-sm font-semibold text-charcoal/80 uppercase tracking-wider pt-2">
                  {groupName}
                </h3>
              )}

              <ul className="divide-y divide-stone-border/50 bg-stone-surface/40 rounded-xl border border-stone-border/70 overflow-hidden">
                {items.map((ing) => {
                  const converted = convertIngredient(
                    ing,
                    unitMode,
                    multiplier,
                    densityDatabase,
                    exactMode
                  );
                  const isChecked = !!checkedIngredients[ing.id];

                  return (
                    <li
                      key={ing.id}
                      onClick={() => toggleCheck(ing.id)}
                      className={`flex items-start gap-3 p-3 transition-colors cursor-pointer select-none hover:bg-stone-surface/90 ${
                        isChecked ? 'opacity-40 bg-stone-surface/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-sage border-sage text-white'
                            : 'border-stone-border bg-alabaster hover:border-charcoal'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>

                      {/* Ingredient Text */}
                      <div className="flex-1 text-sm leading-snug">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          {converted.displayQuantity && (
                            <span className="font-mono font-semibold text-charcoal tabular-nums">
                              {converted.displayQuantity}
                            </span>
                          )}
                          {converted.displayUnit && (
                            <span className="font-mono text-warm-grey text-xs">
                              {converted.displayUnit}
                            </span>
                          )}
                          {converted.subValue && (
                            <span className="font-mono text-xs text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              {converted.subValue}
                            </span>
                          )}
                          <span
                            className={`font-medium text-charcoal ${
                              isChecked ? 'line-through text-warm-grey' : ''
                            }`}
                          >
                            {ing.item}
                          </span>

                          {/* Density Dot Indicator */}
                          {ing.densityId && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-sage inline-block ml-0.5"
                              title="Matched with culinary density matrix"
                            />
                          )}
                        </div>

                        {ing.notes && (
                          <p className="text-xs text-warm-grey italic mt-0.5">{ing.notes}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Instructions Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-border">
            <h2 className="font-serif text-2xl font-bold text-charcoal">Instructions</h2>
            <span className="text-xs text-warm-grey font-mono">
              {recipe.steps.length} steps
            </span>
          </div>

          <div className="space-y-6">
            {recipe.steps.map((step) => {
              const tokens = parseStepTokens(
                step.instruction,
                recipe.ingredients,
                unitMode,
                multiplier,
                densityDatabase,
                exactMode
              );

              return (
                <div
                  key={step.stepNumber}
                  className="flex gap-4 p-4 rounded-xl bg-stone-surface/30 border border-stone-border/60"
                >
                  {/* Step Number in Serif */}
                  <span className="font-serif text-2xl font-bold text-warm-light/80 select-none">
                    {step.stepNumber}
                  </span>

                  {/* Step Text with interactive tokens */}
                  <div className="flex-1 space-y-3">
                    <p className="font-sans text-sm sm:text-base text-charcoal leading-relaxed">
                      {tokens.map((token, idx) => {
                        if (token.type === 'timer' && token.timerData) {
                          const timerKey = `${recipe.id}_s${step.stepNumber}_token_${idx}`;
                          const matchingTimer = activeTimers.find(
                            (t) =>
                              t.timerKey === timerKey ||
                              (t.stepNumber === step.stepNumber &&
                                Math.abs(t.durationSeconds - token.timerData!.durationSeconds) < 2)
                          );

                          if (matchingTimer) {
                            if (matchingTimer.isCompleted) {
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-xs font-semibold border border-emerald-300 animate-pulse"
                                >
                                  <TimerIcon className="w-3 h-3 text-emerald-600" />
                                  <span>Done! 00:00</span>
                                </span>
                              );
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => onToggleTimer?.(matchingTimer.id)}
                                className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold border transition-all cursor-pointer ${
                                  matchingTimer.isRunning
                                    ? 'bg-terracotta text-white border-terracotta shadow-sm'
                                    : 'bg-terracotta/10 text-terracotta border-terracotta/40'
                                }`}
                                title={matchingTimer.isRunning ? 'Pause timer' : 'Resume timer'}
                              >
                                <TimerIcon className={`w-3 h-3 ${matchingTimer.isRunning ? 'animate-pulse' : ''}`} />
                                <span className="tabular-nums">{formatTime(matchingTimer.remainingSeconds)}</span>
                                <span className="text-[10px] ml-0.5">{matchingTimer.isRunning ? '⏸' : '▶'}</span>
                              </button>
                            );
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                onStartTimer(
                                  `${recipe.title}: Step ${step.stepNumber} (${token.timerData?.label})`,
                                  token.timerData!.durationSeconds,
                                  { stepNumber: step.stepNumber, timerKey }
                                )
                              }
                              className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-terracotta/10 text-terracotta hover:bg-terracotta hover:text-white font-mono text-xs font-semibold border border-terracotta/20 transition-all cursor-pointer"
                              title="Tap to start timer"
                            >
                              <TimerIcon className="w-3 h-3" />
                              <span>⏱ {token.timerData.label}</span>
                            </button>
                          );
                        }

                        if (token.type === 'temperature') {
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center mx-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-semibold"
                            >
                              {token.value}
                            </span>
                          );
                        }

                        if (token.type === 'ingredient') {
                          return (
                            <span
                              key={idx}
                              className="font-semibold text-charcoal underline decoration-stone-300 underline-offset-2"
                            >
                              {token.value}
                            </span>
                          );
                        }

                        return <span key={idx}>{token.value}</span>;
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recipe Notes */}
          {recipe.notes && (
            <div className="mt-8 p-4 rounded-xl bg-alabaster border border-stone-border text-xs sm:text-sm text-warm-grey flex items-start gap-3">
              <Info className="w-4 h-4 text-warm-light shrink-0 mt-0.5" />
              <p className="leading-relaxed">{recipe.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
