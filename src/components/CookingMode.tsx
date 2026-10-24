import React, { useState, useEffect } from 'react';
import { Recipe, ActiveTimer } from '../types/recipe';
import { ConversionMode } from '../types/conversion';
import { DensityRecord } from '../types/density';
import { convertIngredient } from '../engine/converter';
import { parseStepTokens } from '../engine/stepParser';
import { createWakeLockManager } from '../utils/wakeLock';
import { formatTime } from '../utils/formatters';
import { CookModeTimerHUD } from './CookModeTimerHUD';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Timer as TimerIcon,
  ChefHat,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Plus,
} from 'lucide-react';

interface CookingModeProps {
  recipe: Recipe;
  unitMode: ConversionMode;
  exactMode: boolean;
  densityDatabase: DensityRecord[];
  onExit: () => void;
  activeTimers?: ActiveTimer[];
  onStartTimer: (
    label: string,
    durationSeconds: number,
    options?: { stepNumber?: number; timerKey?: string }
  ) => void;
  onToggleTimer?: (id: string) => void;
  onAddMinute?: (id: string) => void;
  onResetTimer?: (id: string) => void;
  onRemoveTimer?: (id: string) => void;
  onClearAllTimers?: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({
  recipe,
  unitMode,
  exactMode,
  densityDatabase,
  onExit,
  activeTimers = [],
  onStartTimer,
  onToggleTimer,
  onAddMinute,
  onResetTimer,
  onRemoveTimer,
  onClearAllTimers,
}) => {
  // Step 0 is Mise en Place checklist, followed by step 1..N
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({});
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // Initialize Screen Wake Lock
  useEffect(() => {
    const manager = createWakeLockManager((active) => setWakeLockActive(active));
    manager.request().then((acquired) => setWakeLockActive(acquired));

    return () => {
      manager.release();
    };
  }, []);

  // Keyboard navigation: Space/Right for Next, Left for Prev, Esc to Exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Space if the user is focused on an interactive element like a button
      if (
        (e.target as HTMLElement)?.tagName === 'BUTTON' ||
        (e.target as HTMLElement)?.tagName === 'INPUT'
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentStepIndex((idx) => Math.min(recipe.steps.length, idx + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStepIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recipe.steps.length, onExit]);

  const togglePrep = (id: string) => {
    setPrepChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalSteps = recipe.steps.length;
  const isMiseEnPlace = currentStepIndex === 0;
  const currentStep = !isMiseEnPlace ? recipe.steps[currentStepIndex - 1] : null;

  return (
    <div className="fixed inset-0 z-50 bg-cast-iron text-cream flex flex-col justify-between selection:bg-amber-glow/20 selection:text-amber-glow-bright overflow-hidden">
      {/* Top Utility Bar */}
      <div className="h-16 px-4 sm:px-8 border-b border-cast-iron-border flex items-center justify-between shrink-0 bg-cast-iron-surface/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-glow/10 text-amber-glow flex items-center justify-center border border-amber-glow/20">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-cream line-clamp-1">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Wake Lock & Step Progress & Exit */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Active Timer Pill in Top Bar */}
          {activeTimers.length > 0 && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
                activeTimers.some((t) => t.isCompleted)
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 animate-pulse'
                  : 'bg-amber-glow/20 border-amber-glow/50 text-amber-glow-bright shadow-[0_0_12px_rgba(224,107,67,0.25)]'
              }`}
              title="Active kitchen timer running"
            >
              <TimerIcon
                className={`w-3.5 h-3.5 ${
                  activeTimers.some((t) => t.isRunning)
                    ? 'animate-pulse text-amber-glow-bright'
                    : 'text-cream-dim'
                }`}
              />
              <span className="tabular-nums">
                {activeTimers.some((t) => t.isCompleted)
                  ? 'Done!'
                  : formatTime(
                      (
                        activeTimers.find((t) => t.stepNumber === currentStepIndex) ||
                        activeTimers.find((t) => t.isRunning) ||
                        activeTimers[0]
                      ).remainingSeconds
                    )}
              </span>
              {activeTimers.length > 1 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-glow/30 text-cream">
                  +{activeTimers.length - 1}
                </span>
              )}
            </div>
          )}

          {/* Wake Lock Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors ${
              wakeLockActive
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-stone-900 border-stone-800 text-cream-dim'
            }`}
            title={wakeLockActive ? 'Screen will stay awake' : 'Wake Lock inactive'}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {wakeLockActive ? 'Awake' : 'Standard Screen'}
            </span>
          </div>

          {/* Step Counter */}
          <span className="font-mono text-xs sm:text-sm text-cream-muted">
            {isMiseEnPlace ? 'Prep: Step 0' : `Step ${currentStepIndex} of ${totalSteps}`}
          </span>

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-cast-iron-card hover:bg-cast-iron-border text-cream-muted hover:text-cream transition-all border border-cast-iron-border"
            title="Exit Cooking Mode (Esc)"
            aria-label="Exit Cooking Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-cast-iron-surface">
        <div
          className="h-full bg-amber-glow transition-all duration-300"
          style={{
            width: `${(currentStepIndex / totalSteps) * 100}%`,
          }}
        />
      </div>

      {/* Main Content Area (Focused Step or Step 0 Mise en Place) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
        {isMiseEnPlace ? (
          /* Step 0: Mise en Place Prep Checklist */
          <div className="space-y-6 my-auto">
            <div className="space-y-2">
              <span className="font-mono text-xs text-amber-glow uppercase tracking-wider font-semibold">
                Step 0: Mise en Place
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-cream">
                Measure & Gather
              </h3>
              <p className="font-sans text-sm sm:text-base text-cream-muted">
                Pre-scale your ingredients before heating pans or starting timers. Check off items as you ready them.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {recipe.ingredients.map((ing) => {
                const converted = convertIngredient(
                  ing,
                  unitMode,
                  1.0,
                  densityDatabase,
                  exactMode
                );
                const isReady = !!prepChecklist[ing.id];

                return (
                  <div
                    key={ing.id}
                    onClick={() => togglePrep(ing.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                      isReady
                        ? 'bg-emerald-950/20 border-emerald-800/60 text-cream-dim'
                        : 'bg-cast-iron-surface border-cast-iron-border hover:border-amber-glow/60 text-cream'
                    }`}
                  >
                    {isReady ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-cream-dim shrink-0" />
                    )}

                    <div className="flex-1 text-sm font-sans">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        {converted.displayQuantity && (
                          <span className="font-mono font-bold text-cream tabular-nums">
                            {converted.displayQuantity}
                          </span>
                        )}
                        {converted.displayUnit && (
                          <span className="font-mono text-xs text-cream-muted">
                            {converted.displayUnit}
                          </span>
                        )}
                        <span className={isReady ? 'line-through text-cream-dim' : 'font-medium'}>
                          {ing.item}
                        </span>
                      </div>
                      {ing.notes && (
                        <span className="text-xs text-cream-dim italic block mt-0.5">
                          {ing.notes}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setCurrentStepIndex(1)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-glow hover:bg-amber-glow-bright text-cast-iron font-bold text-base transition-all flex items-center justify-center gap-2 shadow-tactile"
              >
                <span>Everything Prepped — Begin Step 1</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Active Cooking Step */
          <div className="space-y-8 my-auto animate-fadeIn">
            {/* Step Header */}
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl sm:text-5xl font-bold text-amber-glow">
                {currentStep?.stepNumber}.
              </span>
              <span className="font-mono text-xs sm:text-sm text-cream-muted uppercase tracking-widest">
                Instruction
              </span>
            </div>

            {/* Giant Typography Instruction with Injected Converted Ingredients & Timers */}
            <div className="font-sans text-2xl sm:text-3xl md:text-4xl leading-relaxed sm:leading-snug text-cream font-light tracking-wide">
              {currentStep && (() => {
                const stepTokens = parseStepTokens(
                  currentStep.instruction,
                  recipe.ingredients,
                  unitMode,
                  1.0,
                  densityDatabase,
                  exactMode
                );
                const hasInlineTimer = stepTokens.some((t) => t.type === 'timer');

                return (
                  <>
                    {stepTokens.map((token, idx) => {
                      if (token.type === 'timer' && token.timerData) {
                        const timerKey = `${recipe.id}_s${currentStep.stepNumber}_token_${idx}`;
                        const matchingTimer = activeTimers.find(
                          (t) =>
                            t.timerKey === timerKey ||
                            (t.stepNumber === currentStep.stepNumber &&
                              Math.abs(t.durationSeconds - token.timerData!.durationSeconds) < 2)
                        );

                        if (matchingTimer) {
                          if (matchingTimer.isCompleted) {
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-2 mx-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/70 border-2 border-emerald-500 text-emerald-400 font-mono text-xl sm:text-2xl font-bold align-baseline shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-pulse"
                              >
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                                <span>Done! 00:00</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResetTimer?.(matchingTimer.id);
                                  }}
                                  className="p-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-cream transition-all ml-1 cursor-pointer"
                                  title="Restart timer"
                                  aria-label="Restart timer"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveTimer?.(matchingTimer.id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-emerald-900/60 text-emerald-300 hover:text-white transition-all cursor-pointer"
                                  title="Dismiss timer"
                                  aria-label="Dismiss timer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            );
                          }

                          if (matchingTimer.isRunning) {
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-2 mx-1.5 px-3.5 py-1.5 rounded-xl bg-amber-glow/25 border-2 border-amber-glow text-amber-glow-bright font-mono text-xl sm:text-2xl font-black align-baseline shadow-[0_0_20px_rgba(224,107,67,0.4)] ring-2 ring-amber-glow/30"
                              >
                                <TimerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-glow animate-pulse" />
                                <span className="tabular-nums tracking-wide">
                                  {formatTime(matchingTimer.remainingSeconds)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTimer?.(matchingTimer.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-amber-glow/40 text-cream transition-all ml-1 cursor-pointer"
                                  title="Pause timer"
                                  aria-label="Pause timer"
                                >
                                  <Pause className="w-4 h-4 fill-current" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddMinute?.(matchingTimer.id);
                                  }}
                                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-glow/30 hover:bg-amber-glow/50 text-cream transition-all cursor-pointer"
                                  title="Add 1 minute"
                                  aria-label="Add 1 minute"
                                >
                                  +1m
                                </button>
                              </span>
                            );
                          }

                          // Paused state
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 mx-1.5 px-3.5 py-1.5 rounded-xl bg-cast-iron-card border-2 border-amber-glow/40 text-cream-muted font-mono text-xl sm:text-2xl font-bold align-baseline"
                            >
                              <TimerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cream-dim" />
                              <span className="tabular-nums">{formatTime(matchingTimer.remainingSeconds)}</span>
                              <span className="text-xs uppercase font-sans font-bold text-amber-glow px-1.5 py-0.5 rounded bg-amber-glow/15">
                                Paused
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTimer?.(matchingTimer.id);
                                }}
                                className="p-1.5 rounded-lg bg-amber-glow text-cast-iron hover:bg-amber-glow-bright transition-all ml-1 cursor-pointer"
                                title="Resume timer"
                                aria-label="Resume timer"
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResetTimer?.(matchingTimer.id);
                                }}
                                className="p-1 rounded-lg hover:bg-cast-iron-border text-cream-dim hover:text-cream transition-all cursor-pointer"
                                title="Reset timer"
                                aria-label="Reset timer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </span>
                          );
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              onStartTimer(
                                `${recipe.title}: Step ${currentStep.stepNumber} (${token.timerData?.label})`,
                                token.timerData!.durationSeconds,
                                { stepNumber: currentStep.stepNumber, timerKey }
                              )
                            }
                            className="inline-flex items-center gap-2 mx-1.5 px-3 py-1 rounded-xl bg-amber-glow/20 border border-amber-glow/40 text-amber-glow-bright hover:bg-amber-glow hover:text-cast-iron transition-all font-mono text-xl sm:text-2xl font-bold cursor-pointer align-baseline shadow-sm hover:shadow-[0_0_15px_rgba(224,107,67,0.35)] active:scale-95"
                            title="Start timer"
                          >
                            <TimerIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span>⏱ {token.timerData.label}</span>
                          </button>
                        );
                      }

                      if (token.type === 'temperature') {
                        return (
                          <span
                            key={idx}
                            className="inline-block mx-1 px-2.5 py-0.5 rounded-lg bg-orange-950/80 border border-orange-800 text-orange-300 font-mono text-xl sm:text-2xl font-semibold"
                          >
                            {token.value}
                          </span>
                        );
                      }

                      if (token.type === 'ingredient') {
                        return (
                          <span
                            key={idx}
                            className="font-medium text-amber-glow-soft underline decoration-amber-glow/40 underline-offset-4"
                          >
                            {token.value}
                          </span>
                        );
                      }

                      return <span key={idx}>{token.value}</span>;
                    })}

                    {/* If step has explicit timers that were not embedded in text, render as inline pills at end of text */}
                    {!hasInlineTimer && currentStep.timers && currentStep.timers.length > 0 && (
                      <span className="inline-flex flex-wrap items-center gap-2 ml-2">
                        {currentStep.timers.map((timer, tIdx) => {
                          const timerKey = `${recipe.id}_s${currentStep.stepNumber}_exp_${tIdx}`;
                          const matchingTimer = activeTimers.find(
                            (t) =>
                              t.timerKey === timerKey ||
                              (t.stepNumber === currentStep.stepNumber &&
                                Math.abs(t.durationSeconds - timer.durationSeconds) < 2)
                          );

                          if (matchingTimer) {
                            if (matchingTimer.isCompleted) {
                              return (
                                <span
                                  key={tIdx}
                                  className="inline-flex items-center gap-2 mx-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/70 border-2 border-emerald-500 text-emerald-400 font-mono text-xl sm:text-2xl font-bold align-baseline shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-pulse"
                                >
                                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                                  <span>Done! 00:00</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onResetTimer?.(matchingTimer.id);
                                    }}
                                    className="p-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-cream transition-all ml-1 cursor-pointer"
                                    title="Restart timer"
                                    aria-label="Restart timer"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveTimer?.(matchingTimer.id);
                                    }}
                                    className="p-1 rounded-lg hover:bg-emerald-900/60 text-emerald-300 hover:text-white transition-all cursor-pointer"
                                    title="Dismiss timer"
                                    aria-label="Dismiss timer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </span>
                              );
                            }

                            if (matchingTimer.isRunning) {
                              return (
                                <span
                                  key={tIdx}
                                  className="inline-flex items-center gap-2 mx-1.5 px-3.5 py-1.5 rounded-xl bg-amber-glow/25 border-2 border-amber-glow text-amber-glow-bright font-mono text-xl sm:text-2xl font-black align-baseline shadow-[0_0_20px_rgba(224,107,67,0.4)] ring-2 ring-amber-glow/30"
                                >
                                  <TimerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-glow animate-pulse" />
                                  <span className="tabular-nums tracking-wide">
                                    {formatTime(matchingTimer.remainingSeconds)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleTimer?.(matchingTimer.id);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-amber-glow/40 text-cream transition-all ml-1 cursor-pointer"
                                    title="Pause timer"
                                    aria-label="Pause timer"
                                  >
                                    <Pause className="w-4 h-4 fill-current" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAddMinute?.(matchingTimer.id);
                                    }}
                                    className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-glow/30 hover:bg-amber-glow/50 text-cream transition-all cursor-pointer"
                                    title="Add 1 minute"
                                    aria-label="Add 1 minute"
                                  >
                                    +1m
                                  </button>
                                </span>
                              );
                            }

                            return (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-2 mx-1.5 px-3.5 py-1.5 rounded-xl bg-cast-iron-card border-2 border-amber-glow/40 text-cream-muted font-mono text-xl sm:text-2xl font-bold align-baseline"
                              >
                                <TimerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cream-dim" />
                                <span className="tabular-nums">{formatTime(matchingTimer.remainingSeconds)}</span>
                                <span className="text-xs uppercase font-sans font-bold text-amber-glow px-1.5 py-0.5 rounded bg-amber-glow/15">
                                  Paused
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTimer?.(matchingTimer.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-glow text-cast-iron hover:bg-amber-glow-bright transition-all ml-1 cursor-pointer"
                                  title="Resume timer"
                                  aria-label="Resume timer"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResetTimer?.(matchingTimer.id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-cast-iron-border text-cream-dim hover:text-cream transition-all cursor-pointer"
                                  title="Reset timer"
                                  aria-label="Reset timer"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              </span>
                            );
                          }

                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() =>
                                onStartTimer(
                                  `${recipe.title}: Step ${currentStep.stepNumber} (${timer.label})`,
                                  timer.durationSeconds,
                                  { stepNumber: currentStep.stepNumber, timerKey }
                                )
                              }
                              className="inline-flex items-center gap-2 mx-1.5 px-3 py-1 rounded-xl bg-amber-glow/20 border border-amber-glow/40 text-amber-glow-bright hover:bg-amber-glow hover:text-cast-iron transition-all font-mono text-xl sm:text-2xl font-bold cursor-pointer align-baseline shadow-sm hover:shadow-[0_0_15px_rgba(224,107,67,0.35)] active:scale-95"
                              title="Start timer"
                            >
                              <TimerIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                              <span>⏱ {timer.label}</span>
                            </button>
                          );
                        })}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Cook Mode Persistent Floating Timer HUD */}
      <CookModeTimerHUD
        timers={activeTimers}
        currentStepNumber={currentStepIndex}
        onToggleTimer={onToggleTimer || (() => {})}
        onAddMinute={onAddMinute || (() => {})}
        onResetTimer={onResetTimer || (() => {})}
        onRemoveTimer={onRemoveTimer || (() => {})}
        onClearAll={onClearAllTimers || (() => {})}
      />

      {/* Bottom Large Touch Controls (Minimum 56px height for messy hands) */}
      <div className="h-24 px-4 sm:px-12 border-t border-cast-iron-border flex items-center justify-between shrink-0 bg-cast-iron-surface/80 backdrop-blur-md">
        <button
          onClick={() => setCurrentStepIndex((idx) => Math.max(0, idx - 1))}
          disabled={currentStepIndex === 0}
          className={`flex items-center gap-2 px-6 min-h-[56px] rounded-2xl font-sans text-base font-medium transition-all ${
            currentStepIndex === 0
              ? 'opacity-30 cursor-not-allowed text-cream-dim'
              : 'bg-cast-iron-card hover:bg-cast-iron-border text-cream border border-cast-iron-border'
          }`}
          aria-label="Previous step"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Keyboard shortcut hint */}
        <span className="hidden md:inline-block font-mono text-xs text-cream-dim">
          Use [Space] or [Arrow Right] for next step
        </span>

        {currentStepIndex < totalSteps ? (
          <button
            onClick={() => setCurrentStepIndex((idx) => Math.min(totalSteps, idx + 1))}
            className="flex items-center gap-2 px-8 min-h-[56px] rounded-2xl bg-amber-glow hover:bg-amber-glow-bright text-cast-iron font-bold text-base sm:text-lg shadow-tactile transition-all"
            aria-label="Next step"
          >
            <span>{isMiseEnPlace ? 'Start Cooking' : 'Next Step'}</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-8 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg shadow-tactile transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Finish Cooking</span>
          </button>
        )}
      </div>
    </div>
  );
};
