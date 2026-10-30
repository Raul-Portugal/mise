import React from 'react';
import {
  ChefHat,
  Plus,
  Database,
  Download,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Cloud,
  BookOpen,
  CalendarDays,
  ShoppingCart,
} from 'lucide-react';
import { ConversionMode } from '../types/conversion';
import type { User } from '@supabase/supabase-js';

export type MainViewTab = 'recipes' | 'planner' | 'shopping';

interface HeaderProps {
  currentTab?: MainViewTab;
  onSelectTab?: (tab: MainViewTab) => void;
  onNewRecipe: () => void;
  onOpenImportExport: () => void;
  onOpenDensities: () => void;
  onOpenAuth: () => void;
  user: User | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'recipes',
  onSelectTab,
  onNewRecipe,
  onOpenImportExport,
  onOpenDensities,
  onOpenAuth,
  user,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="border-b border-stone-border bg-stone-surface/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div
          onClick={() => onSelectTab && onSelectTab('recipes')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center border border-terracotta/20 group-hover:bg-terracotta group-hover:text-white transition-all">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-charcoal flex items-center gap-2">
              Mise
              <span className="text-[10px] font-sans font-normal uppercase tracking-wider text-warm-grey px-1.5 py-0.5 rounded bg-alabaster border border-stone-border hidden sm:inline-block">
                En Place
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Top Navigation Tab Bar Trio (Properly Centered) */}
        {onSelectTab && (
          <div className="hidden sm:flex flex-1 justify-center">
            <nav className="flex items-center bg-alabaster border border-stone-border rounded-xl p-0.5 shadow-xs text-xs font-medium">
              <button
                onClick={() => onSelectTab('recipes')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  currentTab === 'recipes'
                    ? 'bg-charcoal text-alabaster shadow-xs font-semibold'
                    : 'text-warm-grey hover:text-charcoal'
                }`}
                title="Recipe Library"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Library</span>
              </button>

              <button
                onClick={() => onSelectTab('planner')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  currentTab === 'planner'
                    ? 'bg-charcoal text-alabaster shadow-xs font-semibold'
                    : 'text-warm-grey hover:text-charcoal'
                }`}
                title="Weekly Meal Planner"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Meal Plan</span>
              </button>

              <button
                onClick={() => onSelectTab('shopping')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  currentTab === 'shopping'
                    ? 'bg-charcoal text-alabaster shadow-xs font-semibold'
                    : 'text-warm-grey hover:text-charcoal'
                }`}
                title="Smart Shopping List"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Shopping List</span>
              </button>
            </nav>
          </div>
        )}

        {/* Right: Global Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-alabaster border-stone-border text-charcoal hover:bg-stone-surface'
                : 'bg-stone-surface border-stone-border text-warm-light'
            }`}
            title={soundEnabled ? 'Chimes enabled' : 'Muted'}
            aria-label="Toggle timer chime audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Densities Database Button */}
          <button
            onClick={onOpenDensities}
            className="p-2 rounded-lg bg-alabaster border border-stone-border text-warm-grey hover:text-charcoal hover:bg-stone-surface transition-all hidden md:flex items-center gap-1 text-xs font-medium"
            title="Browse & customize ingredient densities"
          >
            <Database className="w-4 h-4" />
            <span className="hidden xl:inline">Densities</span>
          </button>

          {/* Import / Export Button */}
          <button
            onClick={onOpenImportExport}
            className="p-2 rounded-lg bg-alabaster border border-stone-border text-warm-grey hover:text-charcoal hover:bg-stone-surface transition-all hidden sm:flex items-center gap-1 text-xs font-medium"
            title="Import or export recipes"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Import</span>
          </button>

          {/* Cloud Sync Button */}
          <button
            onClick={onOpenAuth}
            className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${
              user
                ? 'bg-sage/10 border-sage/20 text-sage hover:bg-sage/20'
                : 'bg-alabaster border-stone-border text-warm-grey hover:text-charcoal hover:bg-stone-surface'
            }`}
            title={user ? `Sync active (${user.email})` : 'Sign in to sync recipes across devices'}
          >
            <Cloud className="w-4 h-4" />
            <span className="hidden xl:inline">
              {user ? 'Synced' : 'Sync'}
            </span>
          </button>

          {/* Primary New Recipe CTA */}
          <button
            onClick={onNewRecipe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white text-xs sm:text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
