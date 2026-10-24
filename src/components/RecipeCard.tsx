import React from 'react';
import { Recipe } from '../types/recipe';
import { Clock, Users, Play, Sparkles } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onStartCooking: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onStartCooking }) => {
  const totalMins = (recipe.times.prepMinutes || 0) + (recipe.times.cookMinutes || 0);

  return (
    <div
      onClick={() => onSelect(recipe)}
      className="group relative bg-stone-surface border border-stone-border hover:border-stone-400/70 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-tactile-hover flex flex-col justify-between"
    >
      <div>
        {/* Top Badges / Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-alabaster border border-stone-border text-warm-grey"
            >
              {tag}
            </span>
          ))}
          {recipe.times.restingMinutes && recipe.times.restingMinutes > 60 && (
            <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Ferment
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal group-hover:text-terracotta transition-colors leading-snug mb-1.5">
          {recipe.title}
        </h3>
        {recipe.subtitle && (
          <p className="font-sans text-xs sm:text-sm text-warm-grey line-clamp-2 leading-relaxed mb-4">
            {recipe.subtitle}
          </p>
        )}
      </div>

      {/* Metadata & Actions */}
      <div className="pt-3 border-t border-stone-border/70 flex items-center justify-between text-xs text-warm-grey font-mono">
        <div className="flex items-center gap-3">
          {totalMins > 0 && (
            <span className="flex items-center gap-1 font-sans">
              <Clock className="w-3.5 h-3.5 text-warm-light" />
              {totalMins}m
            </span>
          )}
          <span className="flex items-center gap-1 font-sans">
            <Users className="w-3.5 h-3.5 text-warm-light" />
            {recipe.servings.amount} {recipe.servings.unit}
          </span>
        </div>

        {/* Start Cooking CTA button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartCooking(recipe);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-border/60 hover:bg-terracotta hover:text-white transition-all text-charcoal font-sans text-xs font-medium"
          title="Start hands-free cooking mode"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Cook</span>
        </button>
      </div>
    </div>
  );
};
