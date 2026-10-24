import React, { useState } from 'react';
import { Recipe } from '../types/recipe';
import { DensityRecord } from '../types/density';
import { parseCooklang, parseSchemaOrgRecipe, exportRecipeToMarkdown } from '../engine/formatImporter';
import {
  X,
  Upload,
  Download,
  FileCode,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  currentRecipe?: Recipe;
  densityDatabase: DensityRecord[];
  onImportRecipe: (recipe: Recipe) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  recipes,
  currentRecipe,
  densityDatabase,
  onImportRecipe,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [pasteContent, setPasteContent] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleProcessImport = () => {
    setImportStatus(null);
    const raw = pasteContent.trim();
    if (!raw) {
      setImportStatus({ success: false, message: 'Please paste recipe text or JSON.' });
      return;
    }

    try {
      // 1. Try JSON / Schema.org first
      if (raw.startsWith('{') || raw.startsWith('[')) {
        const parsedJson = JSON.parse(raw);
        // Check if Schema.org
        const schemaResult = parseSchemaOrgRecipe(parsedJson, densityDatabase);
        if (schemaResult && schemaResult.title) {
          const finalRecipe: Recipe = {
            id: `rcp_imp_${Date.now()}`,
            schemaVersion: '1.0',
            title: schemaResult.title,
            subtitle: schemaResult.subtitle,
            servings: schemaResult.servings || { amount: 4, unit: 'servings' },
            times: schemaResult.times || {},
            tags: schemaResult.tags || ['Imported'],
            ingredients: schemaResult.ingredients || [],
            steps: schemaResult.steps || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          onImportRecipe(finalRecipe);
          setImportStatus({ success: true, message: `Successfully imported "${finalRecipe.title}" via Schema.org!` });
          return;
        }

        // Check if native Mise Recipe
        if (parsedJson.id && parsedJson.ingredients && parsedJson.steps) {
          onImportRecipe(parsedJson as Recipe);
          setImportStatus({ success: true, message: `Successfully imported "${parsedJson.title}"!` });
          return;
        }
      }

      // 2. Check if embedded HTML with <script type="application/ld+json">
      const ldJsonMatch = raw.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (ldJsonMatch && ldJsonMatch[1]) {
        const parsedJson = JSON.parse(ldJsonMatch[1].trim());
        const schemaResult = parseSchemaOrgRecipe(parsedJson, densityDatabase);
        if (schemaResult && schemaResult.title) {
          const finalRecipe: Recipe = {
            id: `rcp_imp_${Date.now()}`,
            schemaVersion: '1.0',
            title: schemaResult.title,
            subtitle: schemaResult.subtitle,
            servings: schemaResult.servings || { amount: 4, unit: 'servings' },
            times: schemaResult.times || {},
            tags: schemaResult.tags || ['Imported'],
            ingredients: schemaResult.ingredients || [],
            steps: schemaResult.steps || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          onImportRecipe(finalRecipe);
          setImportStatus({ success: true, message: `Extracted & imported "${finalRecipe.title}" from HTML!` });
          return;
        }
      }

      // 3. Fallback to Cooklang / Markdown parser
      const cooklangResult = parseCooklang(raw, densityDatabase);
      if (cooklangResult && cooklangResult.steps && cooklangResult.steps.length > 0) {
        const finalRecipe: Recipe = {
          id: `rcp_cook_${Date.now()}`,
          schemaVersion: '1.0',
          title: cooklangResult.title || 'Cooklang Recipe',
          servings: { amount: 4, unit: 'servings' },
          times: {},
          tags: ['Cooklang'],
          ingredients: cooklangResult.ingredients || [],
          steps: cooklangResult.steps || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        onImportRecipe(finalRecipe);
        setImportStatus({ success: true, message: `Imported "${finalRecipe.title}" via Cooklang parser!` });
        return;
      }

      setImportStatus({
        success: false,
        message: 'Could not detect recipe structure. Try pasting Cooklang text or Schema.org JSON.',
      });
    } catch (err: any) {
      setImportStatus({ success: false, message: `Import parse error: ${err.message}` });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPasteContent(content);
    };
    reader.readAsText(file);
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCurrentMarkdown = () => {
    if (!currentRecipe) return;
    const md = exportRecipeToMarkdown(currentRecipe);
    downloadFile(`${currentRecipe.title.toLowerCase().replace(/\s+/g, '_')}.md`, md, 'text/markdown');
  };

  const exportCurrentJson = () => {
    if (!currentRecipe) return;
    const jsonStr = JSON.stringify(currentRecipe, null, 2);
    downloadFile(`${currentRecipe.title.toLowerCase().replace(/\s+/g, '_')}.json`, jsonStr, 'application/json');
  };

  const exportAllLibraryJson = () => {
    const jsonStr = JSON.stringify(recipes, null, 2);
    downloadFile('mise_kitchen_library.json', jsonStr, 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-alabaster border border-stone-border rounded-2xl max-w-xl w-full shadow-dock overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between bg-stone-surface">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-bold text-charcoal">Import & Export</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-warm-grey hover:text-charcoal hover:bg-stone-border/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-border bg-stone-surface/40">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all ${
              activeTab === 'import'
                ? 'border-b-2 border-terracotta text-terracotta bg-alabaster'
                : 'text-warm-grey hover:text-charcoal'
            }`}
          >
            Import Recipe
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all ${
              activeTab === 'export'
                ? 'border-b-2 border-terracotta text-terracotta bg-alabaster'
                : 'text-warm-grey hover:text-charcoal'
            }`}
          >
            Export Recipes
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-warm-grey mb-1">
                  Paste Schema.org JSON, Cooklang, or Web Recipe HTML
                </label>
                <textarea
                  rows={8}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder='Paste {"@type": "Recipe", ...} or Cooklang markdown text, or HTML source with embedded LD+JSON...'
                  className="w-full font-mono text-xs bg-stone-surface border border-stone-border rounded-xl p-3 focus:outline-none focus:border-terracotta leading-relaxed"
                />
              </div>

              {/* Upload file fallback */}
              <div className="flex items-center justify-between text-xs text-warm-grey">
                <label className="cursor-pointer text-terracotta hover:underline font-medium flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .json or .cook file</span>
                  <input
                    type="file"
                    accept=".json,.cook,.md,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Status banner */}
              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importStatus.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {importStatus.success ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <button
                onClick={handleProcessImport}
                className="w-full py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-xs sm:text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Parse & Add to Library</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-sans text-xs sm:text-sm text-warm-grey">
                Export your recipes in standard open formats for backup, offline storage, or publishing.
              </p>

              {currentRecipe && (
                <div className="p-4 rounded-xl bg-stone-surface border border-stone-border space-y-3">
                  <span className="block font-serif font-bold text-sm text-charcoal">
                    Current: "{currentRecipe.title}"
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={exportCurrentMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alabaster border border-stone-border hover:border-terracotta text-charcoal text-xs font-medium transition-all"
                    >
                      <FileText className="w-4 h-4 text-terracotta" />
                      <span>Export as Markdown</span>
                    </button>
                    <button
                      onClick={exportCurrentJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alabaster border border-stone-border hover:border-terracotta text-charcoal text-xs font-medium transition-all"
                    >
                      <FileCode className="w-4 h-4 text-blue-600" />
                      <span>Export as JSON</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-stone-surface border border-stone-border space-y-3">
                <span className="block font-serif font-bold text-sm text-charcoal">
                  Full Recipe Library ({recipes.length} recipes)
                </span>
                <button
                  onClick={exportAllLibraryJson}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-alabaster border border-stone-border hover:border-terracotta text-charcoal text-xs font-medium transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Library Backup (.json)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
