import React, { useState, useMemo } from 'react';
import { DensityRecord, IngredientCategory } from '../types/density';
import { Search, Plus, X, Database, Save, Check } from 'lucide-react';

interface DensityManagerProps {
  isOpen: boolean;
  onClose: () => void;
  densities: DensityRecord[];
  onAddDensity: (density: DensityRecord) => void;
}

export const DensityManager: React.FC<DensityManagerProps> = ({
  isOpen,
  onClose,
  densities,
  onAddDensity,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New density form state
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('flour');
  const [gramsPerCup, setGramsPerCup] = useState('120');
  const [gramsPerTbsp, setGramsPerTbsp] = useState('7.5');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const filtered = densities.filter((d) => {
    const matchesSearch =
      search.trim() === '' ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = !selectedCategory || d.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const handleSaveCustom = () => {
    if (!name.trim()) {
      alert('Please enter an ingredient name.');
      return;
    }

    const gCup = parseFloat(gramsPerCup) || 120;
    const gTbsp = gramsPerTbsp ? parseFloat(gramsPerTbsp) : gCup / 16;
    const densityGPerMl = gCup / 236.588;

    const newRecord: DensityRecord = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      aliases: aliases
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0),
      category,
      gramsPerCup: gCup,
      gramsPerTbsp: gTbsp,
      densityGPerMl,
      notes: notes.trim() || undefined,
      source: 'custom',
    };

    onAddDensity(newRecord);
    setShowAddForm(false);
    setName('');
    setAliases('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-alabaster border border-stone-border rounded-2xl max-w-3xl w-full shadow-dock overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between bg-stone-surface">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-terracotta" />
            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal">
                Culinary Density Matrix
              </h3>
              <p className="text-xs text-warm-grey">
                King Arthur Baking & USDA SR Legacy weights for volume-to-weight conversions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-warm-grey hover:text-charcoal hover:bg-stone-border/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Search & Add */}
        <div className="p-4 border-b border-stone-border bg-stone-surface/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-light" />
            <input
              type="text"
              placeholder="Search density database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-alabaster border border-stone-border rounded-lg text-xs sm:text-sm text-charcoal focus:outline-none focus:border-terracotta"
            />
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white text-xs font-medium transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Density</span>
          </button>
        </div>

        {/* Add Custom Form Drawer */}
        {showAddForm && (
          <div className="p-4 bg-amber-50/70 border-b border-amber-200 space-y-3 text-xs animate-slideDown">
            <span className="font-serif font-bold text-sm text-charcoal block">
              Add Custom Ingredient Density
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-warm-grey font-mono mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Semolina Flour"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-alabaster border border-stone-border rounded px-2.5 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-warm-grey font-mono mb-1">Grams per 1 Cup *</label>
                <input
                  type="number"
                  placeholder="167"
                  value={gramsPerCup}
                  onChange={(e) => setGramsPerCup(e.target.value)}
                  className="w-full bg-alabaster border border-stone-border rounded px-2.5 py-1 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-warm-grey font-mono mb-1">Grams per 1 Tbsp</label>
                <input
                  type="number"
                  placeholder="10.4"
                  value={gramsPerTbsp}
                  onChange={(e) => setGramsPerTbsp(e.target.value)}
                  className="w-full bg-alabaster border border-stone-border rounded px-2.5 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-warm-grey font-mono mb-1">Aliases (comma-separated)</label>
                <input
                  type="text"
                  placeholder="semolina, durum semolina"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  className="w-full bg-alabaster border border-stone-border rounded px-2.5 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-warm-grey font-mono mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IngredientCategory)}
                  className="w-full bg-alabaster border border-stone-border rounded px-2.5 py-1 text-xs"
                >
                  <option value="flour">Flour / Starch</option>
                  <option value="sugar">Sugar / Sweetener</option>
                  <option value="fat_dairy">Fat / Dairy</option>
                  <option value="liquid">Liquid / Broth</option>
                  <option value="leavener_salt">Leavener / Salt</option>
                  <option value="nut_seed">Nut / Seed</option>
                  <option value="grain_cereal">Grain / Cereal</option>
                  <option value="chocolate">Chocolate</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded border border-stone-border bg-alabaster text-warm-grey hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-4 py-1 rounded bg-terracotta text-white font-medium hover:bg-terracotta-hover"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Database List Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="border border-stone-border rounded-xl overflow-hidden bg-stone-surface/30">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-surface border-b border-stone-border text-warm-grey font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Ingredient Entity</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">1 Cup</th>
                  <th className="py-2.5 px-3 text-right">1 Tbsp</th>
                  <th className="py-2.5 px-3 text-right">Density (g/ml)</th>
                  <th className="py-2.5 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-border/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-surface/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-charcoal">
                      <span>{item.name}</span>
                      {item.aliases.length > 0 && (
                        <span className="block text-[11px] text-warm-grey font-normal truncate max-w-xs">
                          {item.aliases.slice(0, 3).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-warm-grey capitalize">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-charcoal">
                      {item.gramsPerCup}g
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-warm-grey">
                      {item.gramsPerTbsp ? `${item.gramsPerTbsp}g` : `${(item.gramsPerCup / 16).toFixed(1)}g`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-warm-grey">
                      {item.densityGPerMl.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-alabaster border border-stone-border text-warm-grey uppercase">
                        {item.source || 'matrix'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
