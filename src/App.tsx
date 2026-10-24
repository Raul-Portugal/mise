import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase, getAllDensities } from './db';
import { Recipe, ActiveTimer } from './types/recipe';
import { ConversionMode } from './types/conversion';
import { DensityRecord } from './types/density';
import { INITIAL_DENSITIES } from './data/densityDatabase';
import { playKitchenChime } from './utils/audio';
import { supabase } from './lib/supabase';
import {
  saveRecipeToCloud,
  deleteRecipeFromCloud,
  syncAllRecipes,
  setupRealtimeSubscription,
} from './services/syncService';
import type { User } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { CookingMode } from './components/CookingMode';
import { RecipeEditor } from './components/RecipeEditor';
import { TimerDock } from './components/TimerDock';
import { ImportExportModal } from './components/ImportExportModal';
import { DensityManager } from './components/DensityManager';
import { AuthModal } from './components/AuthModal';

type ViewMode = 'list' | 'detail' | 'editor';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isCookingMode, setIsCookingMode] = useState<boolean>(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);

  // Auth & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Modals
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isDensitiesOpen, setIsDensitiesOpen] = useState(false);

  // Global Settings
  const [unitMode, setUnitMode] = useState<ConversionMode>('metric');
  const [exactMode, setExactMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active floating timers
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

  // Density Database
  const [densities, setDensities] = useState<DensityRecord[]>(INITIAL_DENSITIES);

  // Initialize DB and Auth on mount
  useEffect(() => {
    initializeDatabase().then(async () => {
      const allD = await getAllDensities();
      setDensities(allD);

      const savedUnit = await db.settings.get('unitMode');
      if (savedUnit) setUnitMode(savedUnit.value);

      const savedSound = await db.settings.get('soundEnabled');
      if (savedSound) setSoundEnabled(savedSound.value);

      const savedExact = await db.settings.get('exactMode');
      if (savedExact) setExactMode(savedExact.value);
    });

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        syncAllRecipes(currentUser);
      }
      if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        syncAllRecipes(currentUser);
      }
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time synchronization when user is active
  useEffect(() => {
    if (!user) return;
    const unsubscribe = setupRealtimeSubscription(user);
    return () => unsubscribe();
  }, [user]);

  // Reactive recipes query from Dexie IndexedDB
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) || [];

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || null;

  // Handlers for Unit, Exact, and Sound settings
  const handleUnitModeChange = async (mode: ConversionMode) => {
    setUnitMode(mode);
    await db.settings.put({ key: 'unitMode', value: mode });
  };

  const handleToggleExactMode = async () => {
    const next = !exactMode;
    setExactMode(next);
    await db.settings.put({ key: 'exactMode', value: next });
  };

  const handleToggleSound = async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    await db.settings.put({ key: 'soundEnabled', value: next });
  };

  // Recipe actions
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCooking = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setIsCookingMode(true);
  };

  const handleNewRecipe = () => {
    setEditingRecipe(undefined);
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecipe = async (id: string) => {
    await db.recipes.delete(id);
    await deleteRecipeFromCloud(id);
    if (selectedRecipeId === id) {
      setSelectedRecipeId(null);
      setViewMode('list');
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    await db.recipes.put(recipe);
    await saveRecipeToCloud(recipe);
    setSelectedRecipeId(recipe.id);
    setViewMode('detail');
  };

  const handleImportRecipe = async (recipe: Recipe) => {
    await db.recipes.put(recipe);
    await saveRecipeToCloud(recipe);
    setSelectedRecipeId(recipe.id);
    setViewMode('detail');
    setIsImportExportOpen(false);
  };

  const handleAddDensity = async (record: DensityRecord) => {
    await db.customDensities.put(record);
    const updated = await getAllDensities();
    setDensities(updated);
  };

  // Central active timer countdown interval
  useEffect(() => {
    const hasRunning = activeTimers.some((t) => t.isRunning);
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        let soundNeeded = false;
        const updated = prev.map((t) => {
          if (!t.isRunning) return t;

          if (t.remainingSeconds <= 1) {
            if (!t.isCompleted) soundNeeded = true;
            return {
              ...t,
              remainingSeconds: 0,
              isRunning: false,
              isCompleted: true,
            };
          }

          return {
            ...t,
            remainingSeconds: t.remainingSeconds - 1,
          };
        });

        if (soundNeeded && soundEnabled) {
          playKitchenChime();
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers.some((t) => t.isRunning), soundEnabled]);

  // Enhanced Timer actions
  const handleStartTimer = (
    label: string,
    durationSeconds: number,
    options?: { stepNumber?: number; timerKey?: string; recipeId?: string; recipeTitle?: string }
  ) => {
    setActiveTimers((prev) => {
      // If a timer with this timerKey already exists, toggle pause/play or reset
      if (options?.timerKey) {
        const existingIdx = prev.findIndex((t) => t.timerKey === options.timerKey);
        if (existingIdx !== -1) {
          const existing = prev[existingIdx];
          const updated = [...prev];
          if (existing.isCompleted) {
            updated[existingIdx] = {
              ...existing,
              remainingSeconds: existing.durationSeconds,
              isRunning: true,
              isCompleted: false,
            };
          } else {
            updated[existingIdx] = {
              ...existing,
              isRunning: !existing.isRunning,
            };
          }
          return updated;
        }
      }

      // If a timer for this step with matching duration already exists
      if (options?.stepNumber !== undefined) {
        const existingIdx = prev.findIndex(
          (t) =>
            t.stepNumber === options.stepNumber &&
            Math.abs(t.durationSeconds - durationSeconds) < 2
        );
        if (existingIdx !== -1) {
          const existing = prev[existingIdx];
          const updated = [...prev];
          if (existing.isCompleted) {
            updated[existingIdx] = {
              ...existing,
              remainingSeconds: existing.durationSeconds,
              isRunning: true,
              isCompleted: false,
            };
          } else {
            updated[existingIdx] = {
              ...existing,
              isRunning: !existing.isRunning,
            };
          }
          return updated;
        }
      }

      const newTimer: ActiveTimer = {
        id: `timer_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        label,
        durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: true,
        isCompleted: false,
        stepNumber: options?.stepNumber,
        timerKey: options?.timerKey,
        recipeId: options?.recipeId,
        recipeTitle: options?.recipeTitle,
      };

      return [newTimer, ...prev];
    });
  };

  const handleToggleTimer = (id: string) => {
    setActiveTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (t.isCompleted) {
          return {
            ...t,
            remainingSeconds: t.durationSeconds,
            isRunning: true,
            isCompleted: false,
          };
        }
        return { ...t, isRunning: !t.isRunning };
      })
    );
  };

  const handleAddMinute = (id: string) => {
    setActiveTimers((prev) =>
      prev.map((t) =>
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
  };

  const handleResetTimer = (id: string) => {
    setActiveTimers((prev) =>
      prev.map((t) =>
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
  };

  const handleRemoveTimer = (id: string) => {
    setActiveTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearAllTimers = () => {
    setActiveTimers([]);
  };

  return (
    <div className="min-h-screen bg-alabaster text-charcoal flex flex-col font-sans">
      {/* Top Header */}
      {!isCookingMode && (
        <Header
          onNewRecipe={handleNewRecipe}
          onOpenImportExport={() => setIsImportExportOpen(true)}
          onOpenDensities={() => setIsDensitiesOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          user={user}
          unitMode={unitMode}
          onUnitModeChange={handleUnitModeChange}
          exactMode={exactMode}
          onToggleExactMode={handleToggleExactMode}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Main View Manager */}
      <main className="flex-1">
        {viewMode === 'list' && (
          <RecipeList
            recipes={recipes}
            onSelectRecipe={handleSelectRecipe}
            onStartCooking={handleStartCooking}
            onNewRecipe={handleNewRecipe}
          />
        )}

        {viewMode === 'detail' && selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            unitMode={unitMode}
            onUnitModeChange={handleUnitModeChange}
            exactMode={exactMode}
            onToggleExactMode={handleToggleExactMode}
            densityDatabase={densities}
            onBack={() => setViewMode('list')}
            onEdit={handleEditRecipe}
            onDelete={handleDeleteRecipe}
            onStartCooking={handleStartCooking}
            onStartTimer={handleStartTimer}
            activeTimers={activeTimers}
            onToggleTimer={handleToggleTimer}
            onAddMinute={handleAddMinute}
            onResetTimer={handleResetTimer}
            onRemoveTimer={handleRemoveTimer}
          />
        )}

        {viewMode === 'editor' && (
          <RecipeEditor
            recipe={editingRecipe}
            densityDatabase={densities}
            onSave={handleSaveRecipe}
            onCancel={() => (selectedRecipe ? setViewMode('detail') : setViewMode('list'))}
          />
        )}
      </main>

      {/* Cooking Mode Fullscreen Overlay */}
      {isCookingMode && selectedRecipe && (
        <CookingMode
          recipe={selectedRecipe}
          unitMode={unitMode}
          exactMode={exactMode}
          densityDatabase={densities}
          onExit={() => setIsCookingMode(false)}
          activeTimers={activeTimers}
          onStartTimer={handleStartTimer}
          onToggleTimer={handleToggleTimer}
          onAddMinute={handleAddMinute}
          onResetTimer={handleResetTimer}
          onRemoveTimer={handleRemoveTimer}
          onClearAllTimers={handleClearAllTimers}
        />
      )}

      {/* Persistent Floating Timer Dock (Visible when not in Cooking Mode) */}
      {!isCookingMode && (
        <TimerDock
          timers={activeTimers}
          onUpdateTimers={setActiveTimers}
          soundEnabled={soundEnabled}
          onToggleTimer={handleToggleTimer}
          onAddMinute={handleAddMinute}
          onResetTimer={handleResetTimer}
          onRemoveTimer={handleRemoveTimer}
          onClearAll={handleClearAllTimers}
        />
      )}

      {/* Mobile Bottom Thumb Navigation */}
      {!isCookingMode && (
        <Navigation
          currentTab={viewMode === 'editor' ? 'new' : 'recipes'}
          onSelectTab={(tab) => {
            if (tab === 'recipes') setViewMode('list');
            else if (tab === 'new') handleNewRecipe();
            else if (tab === 'densities') setIsDensitiesOpen(true);
            else if (tab === 'settings') setIsImportExportOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        recipes={recipes}
        currentRecipe={selectedRecipe || undefined}
        densityDatabase={densities}
        onImportRecipe={handleImportRecipe}
      />

      <DensityManager
        isOpen={isDensitiesOpen}
        onClose={() => setIsDensitiesOpen(false)}
        densities={densities}
        onAddDensity={handleAddDensity}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUserChange={setUser}
      />
    </div>
  );
};
