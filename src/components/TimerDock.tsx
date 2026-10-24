import React from 'react';
import { ActiveTimer } from '../types/recipe';
import { formatTime } from '../utils/formatters';
import { Play, Pause, RotateCcw, X, Plus, Bell } from 'lucide-react';

interface TimerDockProps {
  timers: ActiveTimer[];
  onUpdateTimers: (timers: ActiveTimer[]) => void;
  soundEnabled: boolean;
  onToggleTimer?: (id: string) => void;
  onAddMinute?: (id: string) => void;
  onResetTimer?: (id: string) => void;
  onRemoveTimer?: (id: string) => void;
  onClearAll?: () => void;
}

export const TimerDock: React.FC<TimerDockProps> = ({
  timers,
  onUpdateTimers,
  soundEnabled: _soundEnabled,
  onToggleTimer,
  onAddMinute,
  onResetTimer,
  onRemoveTimer,
  onClearAll,
}) => {
  if (timers.length === 0) return null;

  const togglePause = (id: string) => {
    if (onToggleTimer) {
      onToggleTimer(id);
    } else {
      onUpdateTimers(
        timers.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
      );
    }
  };

  const addOneMinute = (id: string) => {
    if (onAddMinute) {
      onAddMinute(id);
    } else {
      onUpdateTimers(
        timers.map((t) =>
          t.id === id
            ? {
                ...t,
                remainingSeconds: t.remainingSeconds + 60,
                durationSeconds: t.durationSeconds + 60,
                isCompleted: false,
                isRunning: true,
              }
            : t
        )
      );
    }
  };

  const resetTimer = (id: string) => {
    if (onResetTimer) {
      onResetTimer(id);
    } else {
      onUpdateTimers(
        timers.map((t) =>
          t.id === id
            ? {
                ...t,
                remainingSeconds: t.durationSeconds,
                isRunning: false,
                isCompleted: false,
              }
            : t
        )
      );
    }
  };

  const removeTimer = (id: string) => {
    if (onRemoveTimer) {
      onRemoveTimer(id);
    } else {
      onUpdateTimers(timers.filter((t) => t.id !== id));
    }
  };

  const clearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      onUpdateTimers([]);
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 max-w-md w-full animate-slideUp">
      <div className="bg-charcoal/95 backdrop-blur-md text-alabaster border border-stone-800 rounded-2xl p-3 shadow-dock space-y-2.5">
        <div className="flex items-center justify-between px-2 text-xs text-warm-light font-mono">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
            <Bell className="w-3.5 h-3.5 text-terracotta" />
            Kitchen Timers ({timers.length})
          </span>
          <button
            onClick={clearAll}
            className="text-[10px] text-warm-light hover:text-white hover:underline cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {timers.map((timer) => {
            const pct =
              timer.durationSeconds > 0
                ? Math.round(
                    ((timer.durationSeconds - timer.remainingSeconds) /
                      timer.durationSeconds) *
                      100
                  )
                : 100;

            return (
              <div
                key={timer.id}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                  timer.isCompleted
                    ? 'bg-terracotta/20 border-terracotta animate-pulse'
                    : 'bg-stone-900/80 border-stone-800'
                }`}
              >
                {/* Timer info & countdown */}
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-sans font-medium text-alabaster/90 truncate">
                    {timer.label}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`font-mono text-lg font-bold tabular-nums ${
                        timer.isCompleted
                          ? 'text-terracotta font-extrabold'
                          : timer.isRunning
                          ? 'text-white'
                          : 'text-warm-light'
                      }`}
                    >
                      {formatTime(timer.remainingSeconds)}
                    </span>
                    <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-terracotta transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Timer actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => addOneMinute(timer.id)}
                    className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-xs font-mono text-warm-light hover:text-white"
                    title="+1 Minute"
                  >
                    +1m
                  </button>

                  <button
                    onClick={() => togglePause(timer.id)}
                    className={`p-1.5 rounded transition-all ${
                      timer.isRunning
                        ? 'bg-stone-800 text-warm-light hover:text-white'
                        : 'bg-terracotta text-white'
                    }`}
                    title={timer.isRunning ? 'Pause' : 'Resume'}
                  >
                    {timer.isRunning ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>

                  <button
                    onClick={() => resetTimer(timer.id)}
                    className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-warm-light hover:text-white"
                    title="Reset"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeTimer(timer.id)}
                    className="p-1.5 rounded hover:bg-stone-800 text-stone-500 hover:text-white"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
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
