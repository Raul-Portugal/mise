import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../db';
import { Recipe } from '../types/recipe';
import type { RealtimeChannel, User } from '@supabase/supabase-js';

let realtimeChannel: RealtimeChannel | null = null;

/**
 * Uploads or updates a single recipe in Supabase.
 */
export async function saveRecipeToCloud(recipe: Recipe): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  try {
    const { error } = await supabase.from('recipes').upsert({
      id: recipe.id,
      user_id: session.user.id,
      title: recipe.title,
      recipe_data: recipe,
      updated_at: new Date(recipe.updatedAt || Date.now()).toISOString(),
    });

    if (error) {
      console.warn('Error saving recipe to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Network error saving recipe to Supabase:', err);
  }
}

/**
 * Deletes a recipe from Supabase.
 */
export async function deleteRecipeFromCloud(recipeId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.warn('Error deleting recipe from Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Network error deleting recipe from Supabase:', err);
  }
}

/**
 * Synchronizes local IndexedDB recipes with Supabase cloud recipes.
 * Resolves conflicts by updatedAt timestamp.
 */
export async function syncAllRecipes(user: User): Promise<{ syncedCount: number }> {
  if (!isSupabaseConfigured || !user) return { syncedCount: 0 };

  try {
    // 1. Fetch all cloud recipes for current user
    const { data: remoteRows, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.warn('Failed to fetch cloud recipes:', error.message);
      return { syncedCount: 0 };
    }

    const localRecipes = await db.recipes.toArray();
    const localMap = new Map(localRecipes.map((r) => [r.id, r]));
    const remoteMap = new Map();

    // 2. Merge cloud recipes into local Dexie
    if (remoteRows) {
      for (const row of remoteRows) {
        const cloudRecipe = row.recipe_data as Recipe;
        remoteMap.set(cloudRecipe.id, cloudRecipe);

        const local = localMap.get(cloudRecipe.id);
        if (!local) {
          // Cloud has recipe, local doesn't -> save locally
          await db.recipes.put(cloudRecipe);
        } else {
          // Both have it -> keep the newer one
          const cloudTime = cloudRecipe.updatedAt || 0;
          const localTime = local.updatedAt || 0;

          if (cloudTime > localTime) {
            await db.recipes.put(cloudRecipe);
          } else if (localTime > cloudTime) {
            await saveRecipeToCloud(local);
          }
        }
      }
    }

    // 3. Upload any local recipes that don't exist in the cloud yet
    for (const local of localRecipes) {
      if (!remoteMap.has(local.id)) {
        await saveRecipeToCloud(local);
      }
    }

    return { syncedCount: (remoteRows?.length || 0) + localRecipes.length };
  } catch (err) {
    console.warn('Sync failed:', err);
    return { syncedCount: 0 };
  }
}

/**
 * Subscribes to Supabase Realtime changes on the recipes table for the logged-in user.
 */
export function setupRealtimeSubscription(user: User, onUpdate?: () => void): () => void {
  if (!isSupabaseConfigured || !user) return () => {};

  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }

  realtimeChannel = supabase
    .channel(`recipes-user-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'recipes',
        filter: `user_id=eq.${user.id}`,
      },
      async (payload) => {
        try {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const incoming = (payload.new as any)?.recipe_data as Recipe;
            if (incoming && incoming.id) {
              const current = await db.recipes.get(incoming.id);
              if (!current || (incoming.updatedAt || 0) >= (current.updatedAt || 0)) {
                await db.recipes.put(incoming);
                onUpdate?.();
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              await db.recipes.delete(oldId);
              onUpdate?.();
            }
          }
        } catch (e) {
          console.warn('Realtime event handler error:', e);
        }
      }
    )
    .subscribe();

  return () => {
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
  };
}
