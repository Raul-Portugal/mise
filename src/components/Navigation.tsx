import React from 'react';
import { BookOpen, PlusCircle, Database, Settings } from 'lucide-react';

interface NavigationProps {
  currentTab: 'recipes' | 'new' | 'densities' | 'settings';
  onSelectTab: (tab: 'recipes' | 'new' | 'densities' | 'settings') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-stone-surface/90 backdrop-blur-lg border-t border-stone-border px-4 py-1 pb-safe">
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => onSelectTab('recipes')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-3 rounded-lg transition-colors ${
            currentTab === 'recipes' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="View Recipe Library"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Library</span>
        </button>

        <button
          onClick={() => onSelectTab('new')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-3 rounded-lg transition-colors ${
            currentTab === 'new' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="Create New Recipe"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Create</span>
        </button>

        <button
          onClick={() => onSelectTab('densities')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-3 rounded-lg transition-colors ${
            currentTab === 'densities' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="Ingredient Densities"
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Densities</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-3 rounded-lg transition-colors ${
            currentTab === 'settings' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="Application Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Options</span>
        </button>
      </div>
    </nav>
  );
};
