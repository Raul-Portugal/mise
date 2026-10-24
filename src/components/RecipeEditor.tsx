import React, { useState } from 'react';
import { Recipe, Step } from '../types/recipe';
import { DensityRecord } from '../types/density';
import { parseIngredientLine, tokenizeIngredientLine } from '../engine/ingredientParser';
import { extractTimers } from '../engine/stepParser';
import { findDensity, getCandidateDensities } from '../engine/converter';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Timer as TimerIcon,
  ChevronDown,
  Search,
  X,
  Check,
} from 'lucide-react';

interface RecipeEditorProps {
  recipe?: Recipe;
  densityDatabase: DensityRecord[];
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

interface ActivePicker {
  lineIndex: number;
  item: string;
  currentDensityId?: string;
}

export const RecipeEditor: React.FC<RecipeEditorProps> = ({
  recipe,
  densityDatabase,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(recipe?.title || '');
  const [subtitle, setSubtitle] = useState(recipe?.subtitle || '');
  const [servingsAmount, setServingsAmount] = useState(recipe?.servings.amount || 4);
  const [servingsUnit, setServingsUnit] = useState(recipe?.servings.unit || 'servings');
  const [prepMinutes, setPrepMinutes] = useState(recipe?.times.prepMinutes || 15);
  const [cookMinutes, setCookMinutes] = useState(recipe?.times.cookMinutes || 20);
  const [restingMinutes, setRestingMinutes] = useState(recipe?.times.restingMinutes || 0);
  const [tagsString, setTagsString] = useState(recipe?.tags.join(', ') || 'Baking, Dinner');
  const [notes, setNotes] = useState(recipe?.notes || '');

  // Raw text area for ingredients (Paste & Parse)
  const initialIngredientsText = recipe?.ingredients
    ? recipe.ingredients.map((i) => i.raw).join('\n')
    : '2 cups all-purpose flour, sifted\n1 cup granulated sugar\n1/2 cup (113g) butter, melted\n1 tsp active dry yeast\n1 tsp table salt';

  const [ingredientsText, setIngredientsText] = useState(initialIngredientsText);

  // User-selected density overrides: lineIndex -> densityId (or 'none' for explicitly unmapped)
  const [densityOverrides, setDensityOverrides] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    if (recipe?.ingredients) {
      recipe.ingredients.forEach((ing, i) => {
        if (ing.densityId) initial[i] = ing.densityId;
      });
    }
    return initial;
  });

  // Modal picker state
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  // Steps
  const initialSteps = recipe?.steps || [
    {
      stepNumber: 1,
      instruction: 'Combine the flour, sugar, and yeast in a bowl and let rest for 10 minutes.',
    },
    {
      stepNumber: 2,
      instruction: 'Bake in preheated oven at 350°F for 20 to 25 minutes until golden brown.',
    },
  ];
  const [steps, setSteps] = useState<Step[]>(initialSteps);

  // Real-time preview of parsed ingredients lines
  const parsedLines = React.useMemo(() => {
    return ingredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => {
        const parsed = parseIngredientLine(line, densityDatabase);
        // Apply manual override if user picked one
        if (densityOverrides[idx] !== undefined) {
          parsed.densityId = densityOverrides[idx] === 'none' ? undefined : densityOverrides[idx];
        }
        const resolvedDensity = findDensity(parsed.item, parsed.densityId, densityDatabase);
        if (resolvedDensity) {
          parsed.densityId = resolvedDensity.id;
        }

        return {
          raw: line,
          parsed,
          resolvedDensity,
          tokens: tokenizeIngredientLine(line, densityDatabase),
        };
      });
  }, [ingredientsText, densityDatabase, densityOverrides]);

  // Candidates for the active picker query
  const pickerCandidates = React.useMemo(() => {
    if (!activePicker) return [];
    const query = pickerQuery.trim() || activePicker.item;
    return getCandidateDensities(query, densityDatabase, 12);
  }, [activePicker, pickerQuery, densityDatabase]);

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        instruction: '',
      },
    ]);
  };

  const handleUpdateStepInstruction = (index: number, val: string) => {
    const updated = [...steps];
    const timers = extractTimers(val);
    updated[index] = {
      ...updated[index],
      instruction: val,
      timers: timers.length > 0 ? timers : undefined,
    };
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(updated);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a recipe title.');
      return;
    }

    const ingredients = parsedLines.map((l) => l.parsed);
    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const savedRecipe: Recipe = {
      id: recipe?.id || `rcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      schemaVersion: '1.0',
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      servings: {
        amount: Number(servingsAmount) || 4,
        unit: servingsUnit.trim() || 'servings',
      },
      times: {
        prepMinutes: Number(prepMinutes) || undefined,
        cookMinutes: Number(cookMinutes) || undefined,
        restingMinutes: Number(restingMinutes) || undefined,
      },
      tags,
      ingredients,
      steps: steps.filter((s) => s.instruction.trim().length > 0),
      notes: notes.trim() || undefined,
      createdAt: recipe?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(savedRecipe);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-warm-grey hover:text-charcoal px-2.5 py-1.5 rounded-lg hover:bg-stone-surface transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-xs sm:text-sm font-medium shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Recipe</span>
        </button>
      </div>

      {/* Editor Form */}
      <div className="space-y-8">
        {/* Title & Subtitle */}
        <div className="bg-stone-surface border border-stone-border rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-warm-grey uppercase tracking-wider mb-1">
              Recipe Title *
            </label>
            <input
              type="text"
              placeholder="e.g. 72-Hour Cold Fermented Pizza Dough"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full font-serif text-2xl sm:text-3xl font-bold text-charcoal bg-alabaster border border-stone-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-terracotta"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-warm-grey uppercase tracking-wider mb-1">
              Subtitle / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Crisp, blistered crust with airy cornicione"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full font-sans text-sm text-charcoal bg-alabaster border border-stone-border rounded-xl px-4 py-2 focus:outline-none focus:border-terracotta"
            />
          </div>

          {/* Servings & Times Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-mono text-warm-grey mb-1">Yield Amount</label>
              <input
                type="number"
                value={servingsAmount}
                onChange={(e) => setServingsAmount(parseFloat(e.target.value) || 1)}
                className="w-full text-sm font-mono bg-alabaster border border-stone-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-warm-grey mb-1">Yield Unit</label>
              <input
                type="text"
                value={servingsUnit}
                onChange={(e) => setServingsUnit(e.target.value)}
                className="w-full text-sm bg-alabaster border border-stone-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-warm-grey mb-1">Prep Time (mins)</label>
              <input
                type="number"
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full text-sm font-mono bg-alabaster border border-stone-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-warm-grey mb-1">Cook Time (mins)</label>
              <input
                type="number"
                value={cookMinutes}
                onChange={(e) => setCookMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full text-sm font-mono bg-alabaster border border-stone-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-warm-grey mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="Baking, Italian, Dinner, Make-Ahead"
              className="w-full text-xs font-mono bg-alabaster border border-stone-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-terracotta"
            />
          </div>
        </div>

        {/* Feature 2: "Paste & Parse" Ingredients Editor */}
        <div className="bg-stone-surface border border-stone-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal flex items-center gap-2">
                Ingredients ("Paste & Parse")
                <span className="text-xs font-sans font-normal text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Real-time NLP
                </span>
              </h3>
              <p className="font-sans text-xs text-warm-grey mt-0.5">
                Paste or type ingredients. Density matches resolve automatically, or click any match pill to choose a specific density.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Input Textarea */}
            <div>
              <label className="block text-xs font-mono text-warm-grey mb-1">Raw Ingredient Lines</label>
              <textarea
                rows={12}
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="1 1/2 cups (180g) all-purpose flour, sifted&#10;1 cup granulated sugar&#10;1 tsp active dry yeast"
                className="w-full font-mono text-xs sm:text-sm bg-alabaster border border-stone-border rounded-xl p-3 focus:outline-none focus:border-terracotta leading-relaxed"
              />
            </div>

            {/* Live Tokenizer & Density Match Visualizer with Match Picker */}
            <div>
              <label className="block text-xs font-mono text-warm-grey mb-1 flex items-center justify-between">
                <span>Parsed Ingredients ({parsedLines.length})</span>
                <span className="text-[10px] text-warm-grey">Click any pill to pick match</span>
              </label>

              <div className="h-[252px] overflow-y-auto bg-alabaster border border-stone-border rounded-xl p-3 space-y-2 text-xs">
                {parsedLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-surface/70 border border-stone-border/80 flex flex-col gap-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Ingredient Tokens */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {line.tokens.map((token, tIdx) => {
                          if (token.type === 'quantity') {
                            return (
                              <span
                                key={tIdx}
                                className="font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200"
                                title="Parsed Quantity"
                              >
                                {token.value}
                              </span>
                            );
                          }
                          if (token.type === 'unit') {
                            return (
                              <span
                                key={tIdx}
                                className="font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200"
                                title="Parsed Unit"
                              >
                                {token.value}
                              </span>
                            );
                          }
                          if (token.type === 'item') {
                            return (
                              <span
                                key={tIdx}
                                className="font-medium px-1.5 py-0.5 rounded bg-stone-200 text-charcoal border border-stone-300"
                              >
                                {token.value}
                              </span>
                            );
                          }
                          return (
                            <span key={tIdx} className="italic text-warm-grey text-[11px]">
                              ({token.value})
                            </span>
                          );
                        })}
                      </div>

                      {/* Density Match Pill Button (Click to pick match) */}
                      {line.resolvedDensity ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePicker({
                              lineIndex: idx,
                              item: line.parsed.item,
                              currentDensityId: line.resolvedDensity?.id,
                            });
                            setPickerQuery(line.parsed.item);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-xs shrink-0"
                          title="Click to select an alternative density match"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                          <span className="font-semibold truncate max-w-[130px] sm:max-w-[170px]">
                            {line.resolvedDensity.name}
                          </span>
                          <span className="text-emerald-700 font-bold shrink-0">
                            ({line.resolvedDensity.gramsPerCup}g)
                          </span>
                          <ChevronDown className="w-3 h-3 text-emerald-600 shrink-0" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePicker({
                              lineIndex: idx,
                              item: line.parsed.item,
                              currentDensityId: undefined,
                            });
                            setPickerQuery(line.parsed.item);
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-sans bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-xs shrink-0"
                          title="Optional: Click to match with density database"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Match Density</span>
                          <ChevronDown className="w-3 h-3 text-amber-600 shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Steps Editor */}
        <div className="bg-stone-surface border border-stone-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal">
                Instructions & Timers
              </h3>
              <p className="font-sans text-xs text-warm-grey mt-0.5">
                Durations (e.g. "5 minutes") and oven temperatures (e.g. "350°F") are automatically extracted.
              </p>
            </div>
            <button
              onClick={handleAddStep}
              className="flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const detectedTimers = extractTimers(step.instruction);

              return (
                <div
                  key={index}
                  className="p-3 bg-alabaster border border-stone-border rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-charcoal">
                      Step {step.stepNumber}
                    </span>
                    {steps.length > 1 && (
                      <button
                        onClick={() => handleRemoveStep(index)}
                        className="text-warm-grey hover:text-red-600 p-1 rounded"
                        title="Delete step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={step.instruction}
                    onChange={(e) => handleUpdateStepInstruction(index, e.target.value)}
                    placeholder="Describe step instruction..."
                    className="w-full text-xs sm:text-sm bg-stone-surface/40 border border-stone-border rounded-lg p-2.5 focus:outline-none focus:border-terracotta"
                  />

                  {detectedTimers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-terracotta">
                      <TimerIcon className="w-3 h-3" />
                      <span>Detected timers: {detectedTimers.map((t) => t.label).join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-stone-surface border border-stone-border rounded-2xl p-5 space-y-2">
          <label className="block text-xs font-mono font-medium text-warm-grey uppercase tracking-wider">
            Chef's Notes & Advice
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Culinary background, storage advice, variation ideas..."
            className="w-full text-xs sm:text-sm bg-alabaster border border-stone-border rounded-xl p-3 focus:outline-none focus:border-terracotta"
          />
        </div>
      </div>

      {/* Density Matcher Modal (Optional override) */}
      {activePicker && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-alabaster border border-stone-border rounded-2xl max-w-lg w-full shadow-dock overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-border bg-stone-surface flex items-center justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold text-charcoal">
                  Match Density for "{activePicker.item}"
                </h4>
                <p className="text-xs text-warm-grey">
                  Optional: Pick the best match from verified items, or search below.
                </p>
              </div>
              <button
                onClick={() => setActivePicker(null)}
                className="p-1 rounded-lg text-warm-grey hover:text-charcoal hover:bg-stone-border/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Search Input */}
            <div className="p-3 border-b border-stone-border bg-stone-surface/30">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-light" />
                <input
                  type="text"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search 2,500+ verified densities..."
                  className="w-full pl-9 pr-8 py-2 bg-alabaster border border-stone-border rounded-xl text-xs sm:text-sm text-charcoal focus:outline-none focus:border-terracotta"
                  autoFocus
                />
                {pickerQuery && (
                  <button
                    onClick={() => setPickerQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-warm-grey hover:text-charcoal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Candidate List */}
            <div className="p-3 overflow-y-auto flex-1 space-y-1.5 text-xs">
              {pickerCandidates.length > 0 ? (
                pickerCandidates.map((cand) => {
                  const isSelected = activePicker.currentDensityId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => {
                        setDensityOverrides((prev) => ({
                          ...prev,
                          [activePicker.lineIndex]: cand.id,
                        }));
                        setActivePicker(null);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium shadow-xs'
                          : 'bg-alabaster border-stone-border hover:border-stone-400 hover:bg-stone-surface'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="font-semibold text-charcoal truncate">
                            {cand.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-stone-200/80 text-warm-grey shrink-0">
                            {cand.source === 'king_arthur' ? 'King Arthur' : 'USDA'}
                          </span>
                        </div>
                        {cand.notes && (
                          <span className="text-[11px] text-warm-grey block truncate mt-0.5">
                            {cand.notes}
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-charcoal block">
                          {cand.gramsPerCup}g <span className="text-[10px] text-warm-grey font-normal">/ cup</span>
                        </span>
                        <span className="font-mono text-[10px] text-warm-grey">
                          {cand.gramsPerTbsp}g / tbsp
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-warm-grey text-xs">
                  <p>No verified items match "{pickerQuery}".</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-stone-border bg-stone-surface flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDensityOverrides((prev) => {
                    const next = { ...prev };
                    delete next[activePicker.lineIndex];
                    return next;
                  });
                  setActivePicker(null);
                }}
                className="text-warm-grey hover:text-charcoal hover:underline text-[11px]"
              >
                Reset to Auto-detect
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDensityOverrides((prev) => ({
                      ...prev,
                      [activePicker.lineIndex]: 'none',
                    }));
                    setActivePicker(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-border bg-alabaster text-warm-grey hover:text-charcoal hover:bg-stone-surface text-[11px]"
                >
                  Keep Unmapped
                </button>
                <button
                  type="button"
                  onClick={() => setActivePicker(null)}
                  className="px-3 py-1.5 rounded-lg bg-charcoal text-alabaster hover:bg-stone-800 text-[11px] font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
