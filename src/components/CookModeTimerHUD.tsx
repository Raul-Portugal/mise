import React, { useState } from 'react';
import { ActiveTimer } from '../types/recipe';
import { formatTime } from '../utils/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Plus,
  Timer as TimerIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface CookModeTimerHUDProps {
  timers: ActiveTimer[];
  currentStepNumber: number;
  onToggleTimer: (id: string) => void;
  onAddMinute: (id: string) => void;
  onResetTimer: (id: string) => void;
  onRemoveTimer: (id: string) => void;
  onClearAll: () => void;
}

export const CookModeTimerHUD: React.FC<CookModeTimerHUDProps> = ({
  timers,
  currentStepNumber,
  onToggleTimer,
  onAddMinute,
  onResetTimer,
  onRemoveTimer,
  onClearAll,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (timers.length === 0) return null;

  const runningCount = timers.filter((t) => t.isRunning).length;
  const completedCount = timers.filter((t) => t.isCompleted).length;
  // Primary timer: current step timer first, or the first running timer, or simply the first timer
  const primaryTimer =
    timers.find((t) => t.stepNumber === currentStepNumber) ||
    timers.find((t) => t.isRunning) ||
    timers[0];

  // Minimized Floating Pill View
  if (isMinimized) {
    const isCompleted = primaryTimer.isCompleted;
    return (
      <div className="fixed bottom-28 right-4 sm:right-8 z-40 animate-slideUp">
        <div
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isCompleted
              ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-cast-iron-surface/95 border-amber-glow/40 text-cream shadow-[0_0_20px_rgba(224,107,67,0.25)]'
          }`}
          title="Click to expand kitchen timers"
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-500 text-cast-iron font-bold'
                : 'bg-amber-glow/20 text-amber-glow'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <TimerIcon
                className={`w-4 h-4 ${primaryTimer.isRunning ? 'animate-pulse text-amber-glow-bright' : ''}`}
              />
            )}
          </div>

          <div className="flex flex-col">
            <span
              className={`font-mono text-base sm:text-lg font-bold tabular-nums tracking-wide ${
                isCompleted ? 'text-emerald-300' : 'text-amber-glow-bright'
              }`}
            >
              {isCompleted ? 'Done!' : formatTime(primaryTimer.remainingSeconds)}
            </span>
            <span className="text-[10px] text-cream-dim truncate max-w-[130px]">
              {primaryTimer.label.replace(/^.*Step \d+ \((.*)\)$/, '$1')}
            </span>
          </div>

          {/* Quick Play/Pause on pill */}
          {!isCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleTimer(primaryTimer.id);
              }}
              className="p-1.5 rounded-lg bg-amber-glow/20 hover:bg-amber-glow text-amber-glow hover:text-cast-iron transition-all"
              title={primaryTimer.isRunning ? 'Pause' : 'Resume'}
            >
              {primaryTimer.isRunning ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
          )}

          {timers.length > 1 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cast-iron-card border border-cast-iron-border text-cream-muted">
              +{timers.length - 1}
            </span>
          )}

          <ChevronUp className="w-4 h-4 text-cream-dim ml-1" />
        </div>
      </div>
    );
  }

  // Expanded Full Timer HUD View
  return (
    <div className="fixed bottom-28 right-4 sm:right-8 z-40 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-[24rem] animate-slideUp">
      <div className="bg-cast-iron-surface/95 backdrop-blur-xl border border-amber-glow/30 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_25px_rgba(224,107,67,0.15)] text-cream space-y-3.5 selection:bg-transparent">
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-2 border-b border-cast-iron-border/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-glow/20 border border-amber-glow/30 flex items-center justify-center text-amber-glow">
              <TimerIcon className={`w-3.5 h-3.5 ${runningCount > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <span className="font-mono text-xs font-bold text-amber-glow uppercase tracking-wider">
              Kitchen Timer{timers.length > 1 ? `s (${timers.length})` : ''}
            </span>
            {completedCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-bold animate-pulse">
                {completedCount} Done
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {timers.length > 1 && (
              <button
                onClick={onClearAll}
                className="px-2 py-1 rounded-lg text-[11px] font-mono text-cream-dim hover:text-cream hover:bg-cast-iron-border transition-all flex items-center gap-1"
                title="Clear all active timers"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg hover:bg-cast-iron-border text-cream-dim hover:text-cream transition-all"
              title="Minimize timer"
              aria-label="Minimize timer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timers List (Scrollable if > 2 timers) */}
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {timers.map((timer) => {
            const isCompleted = timer.isCompleted;
            const isRunning = timer.isRunning;
            const pct =
              timer.durationSeconds > 0
                ? Math.min(
                    100,
                    Math.round(
                      ((timer.durationSeconds - timer.remainingSeconds) /
                        timer.durationSeconds) *
                        100
                    )
                  )
                : 100;

            const isCurrentStep = timer.stepNumber === currentStepNumber;

            return (
              <div
                key={timer.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/50 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-pulse'
                    : isCurrentStep
                    ? 'bg-cast-iron-card border-amber-glow/50 ring-1 ring-amber-glow/20'
                    : 'bg-cast-iron-card/80 border-cast-iron-border'
                }`}
              >
                {/* Timer Context & Label */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isCurrentStep && (
                      <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-amber-glow/20 text-amber-glow shrink-0">
                        Current Step
                      </span>
                    )}
                    <span className="font-sans text-xs sm:text-sm font-medium text-cream/90 truncate">
                      {timer.label}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveTimer(timer.id)}
                    className="p-1 rounded-lg hover:bg-cast-iron-border text-cream-dim hover:text-cream transition-all shrink-0"
                    title="Dismiss timer"
                    aria-label="Dismiss timer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Big Clock Display & Progress */}
                <div className="flex items-baseline justify-between gap-3 mb-2.5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-mono text-3xl sm:text-4xl font-extrabold tabular-nums tracking-wider leading-none ${
                        isCompleted
                          ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : isRunning
                          ? 'text-amber-glow-bright drop-shadow-[0_0_12px_rgba(224,107,67,0.35)]'
                          : 'text-cream-dim'
                      }`}
                    >
                      {formatTime(timer.remainingSeconds)}
                    </span>

                    {/* Status Pill */}
                    {isCompleted ? (
                      <span className="text-xs font-mono font-bold uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                        Completed
                      </span>
                    ) : !isRunning ? (
                      <span className="text-xs font-mono font-bold uppercase text-cream-dim bg-cast-iron-surface px-2 py-0.5 rounded-full border border-cast-iron-border">
                        Paused
                      </span>
                    ) : null}
                  </div>

                  {/* Progress Percent */}
                  <span className="font-mono text-xs text-cream-dim tabular-nums">
                    {pct}%
                  </span>
                </div>

                {/* Tactile Progress Bar */}
                <div className="w-full h-1.5 bg-cast-iron-surface rounded-full overflow-hidden border border-cast-iron-border/60 mb-3">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                        : 'bg-gradient-to-r from-amber-glow to-amber-glow-bright shadow-[0_0_8px_rgba(224,107,67,0.6)]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Tactile Quick Action Controls */}
                <div className="flex items-center gap-2 pt-0.5">
                  {/* +1 Minute quick bump */}
                  <button
                    onClick={() => onAddMinute(timer.id)}
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-cast-iron-surface hover:bg-cast-iron-border text-cream font-mono text-xs font-bold border border-cast-iron-border transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    title="Add 1 minute"
                  >
                    <Plus className="w-3 h-3 text-amber-glow" />
                    <span>1m</span>
                  </button>

                  {/* Play / Pause Toggle */}
                  <button
                    onClick={() => onToggleTimer(timer.id)}
                    className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-tactile ${
                      isCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : isRunning
                        ? 'bg-cast-iron-surface hover:bg-cast-iron-border text-cream border border-cast-iron-border'
                        : 'bg-amber-glow hover:bg-amber-glow-bright text-cast-iron'
                    }`}
                    title={isCompleted ? 'Restart' : isRunning ? 'Pause' : 'Resume'}
                  >
                    {isCompleted ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restart</span>
                      </>
                    ) : isRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>

                  {/* Reset Timer */}
                  <button
                    onClick={() => onResetTimer(timer.id)}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-cast-iron-surface hover:bg-cast-iron-border text-cream-dim hover:text-cream border border-cast-iron-border transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                    title="Reset to original duration"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
