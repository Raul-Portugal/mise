import React, { useState, useMemo } from 'react';
import { Recipe } from '../types/recipe';
import { RecipeCard } from './RecipeCard';
import { Search, Sparkles, Plus, BookOpen } from 'lucide-react';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCooking: (recipe: Recipe) => void;
  onNewRecipe: () => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  onSelectRecipe,
  onStartCooking,
  onNewRecipe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [recipes]);

  // Filter recipes by query and selected tag
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some((i) => i.item.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = !selectedTag || r.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [recipes, searchQuery, selectedTag]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Editorial Welcome Header */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-charcoal">
            Kitchen Library
          </h2>
          <span className="font-mono text-xs text-warm-grey">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </span>
        </div>
        <p className="font-sans text-sm text-warm-grey max-w-xl leading-relaxed">
          Culinary recipes scaled with high-accuracy density tables, volume-to-weight mathematics, and kitchen-smart rounding.
        </p>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-light" />
          <input
            type="text"
            placeholder="Search by recipe, ingredient, or method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-surface border border-stone-border rounded-xl text-sm text-charcoal placeholder-warm-light focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-warm-grey hover:text-charcoal px-1.5 py-0.5 rounded bg-alabaster border border-stone-border"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter tags pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedTag === null
                  ? 'bg-charcoal text-alabaster shadow-sm'
                  : 'bg-stone-surface border border-stone-border text-warm-grey hover:text-charcoal'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-charcoal text-alabaster shadow-sm'
                    : 'bg-stone-surface border border-stone-border text-warm-grey hover:text-charcoal'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelectRecipe}
              onStartCooking={onStartCooking}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-stone-surface/50 border border-dashed border-stone-border rounded-2xl">
          <BookOpen className="w-10 h-10 text-warm-light mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-charcoal mb-1">No recipes found</h3>
          <p className="font-sans text-xs sm:text-sm text-warm-grey max-w-sm mx-auto mb-4">
            {searchQuery || selectedTag
              ? 'Try adjusting your search terms or filters.'
              : 'Your recipe collection is empty. Create your first recipe or import one.'}
          </p>
          <button
            onClick={onNewRecipe}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Recipe
          </button>
        </div>
      )}
    </div>
  );
};
