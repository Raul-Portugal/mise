import React from 'react';
import { BookOpen, CalendarDays, ShoppingCart, PlusCircle, Database, Settings } from 'lucide-react';

export type NavigationTab = 'recipes' | 'planner' | 'shopping' | 'new' | 'densities' | 'settings';

interface NavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-stone-surface/95 backdrop-blur-lg border-t border-stone-border px-2 py-1 pb-safe">
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => onSelectTab('recipes')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 rounded-lg transition-colors ${
            currentTab === 'recipes' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="View Recipe Library"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Library</span>
        </button>

        <button
          onClick={() => onSelectTab('planner')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 rounded-lg transition-colors ${
            currentTab === 'planner' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="Weekly Meal Planner"
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Planner</span>
        </button>

        <button
          onClick={() => onSelectTab('shopping')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 rounded-lg transition-colors ${
            currentTab === 'shopping' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="Smart Shopping List"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Shopping</span>
        </button>

        <button
          onClick={() => onSelectTab('new')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 rounded-lg transition-colors ${
            currentTab === 'new' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="Create New Recipe"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Create</span>
        </button>

        <button
          onClick={() => onSelectTab('densities')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 rounded-lg transition-colors ${
            currentTab === 'densities' ? 'text-terracotta font-semibold' : 'text-warm-grey hover:text-charcoal'
          }`}
          aria-label="Ingredient Densities"
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Densities</span>
        </button>
      </div>
    </nav>
  );
};
