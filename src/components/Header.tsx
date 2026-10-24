import React from 'react';
import { ChefHat, Plus, Database, Download, SlidersHorizontal, Volume2, VolumeX, Cloud } from 'lucide-react';
import { ConversionMode } from '../types/conversion';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  onNewRecipe: () => void;
  onOpenImportExport: () => void;
  onOpenDensities: () => void;
  onOpenAuth: () => void;
  user: User | null;
  unitMode: ConversionMode;
  onUnitModeChange: (mode: ConversionMode) => void;
  exactMode: boolean;
  onToggleExactMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewRecipe,
  onOpenImportExport,
  onOpenDensities,
  onOpenAuth,
  user,
  unitMode,
  onUnitModeChange,
  exactMode,
  onToggleExactMode,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="border-b border-stone-border bg-stone-surface/60 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center border border-terracotta/20">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-charcoal flex items-center gap-2">
              Mise
              <span className="text-xs font-sans font-normal uppercase tracking-wider text-warm-grey px-1.5 py-0.5 rounded bg-alabaster border border-stone-border hidden sm:inline-block">
                En Place
              </span>
            </h1>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unit Toggle Pill */}
          <div className="flex items-center bg-alabaster border border-stone-border rounded-lg p-0.5 shadow-sm text-xs font-medium">
            <button
              onClick={() => onUnitModeChange('metric')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                unitMode === 'metric'
                  ? 'bg-charcoal text-alabaster shadow-sm'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
              title="Weight-first metric conversions (g & ml)"
            >
              Metric (g)
            </button>
            <button
              onClick={() => onUnitModeChange('imperial')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                unitMode === 'imperial'
                  ? 'bg-charcoal text-alabaster shadow-sm'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
              title="Imperial fractions & volumes"
            >
              Imperial
            </button>
            <button
              onClick={() => onUnitModeChange('original')}
              className={`px-2 py-1 rounded-md transition-all ${
                unitMode === 'original'
                  ? 'bg-charcoal text-alabaster shadow-sm'
                  : 'text-warm-grey hover:text-charcoal'
              }`}
              title="As written by the author"
            >
              Original
            </button>
          </div>

          {/* Exact / Culinary Rounding Toggle */}
          <button
            onClick={onToggleExactMode}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              exactMode
                ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-semibold'
                : 'bg-alabaster border-stone-border text-warm-grey hover:text-charcoal'
            }`}
            title={exactMode ? 'Raw exact precision active' : 'Culinary smart rounding active'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {exactMode ? '= Exact' : '~ Rounded'}
          </button>

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
            className="p-2 rounded-lg bg-alabaster border border-stone-border text-warm-grey hover:text-charcoal hover:bg-stone-surface transition-all hidden sm:flex items-center gap-1 text-xs font-medium"
            title="Browse & customize ingredient densities"
          >
            <Database className="w-4 h-4" />
            <span className="hidden lg:inline">Densities</span>
          </button>

          {/* Import / Export Button */}
          <button
            onClick={onOpenImportExport}
            className="p-2 rounded-lg bg-alabaster border border-stone-border text-warm-grey hover:text-charcoal hover:bg-stone-surface transition-all flex items-center gap-1 text-xs font-medium"
            title="Import or export recipes"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
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
            <span className="hidden md:inline">
              {user ? 'Synced' : 'Sync'}
            </span>
          </button>

          {/* Primary New Recipe CTA */}
          <button
            onClick={onNewRecipe}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white text-xs sm:text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
