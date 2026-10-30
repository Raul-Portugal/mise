import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WeeklyMealPlan, MealSlotType, PlannedMealItem, DayMealPlan } from '../types/mealPlan';
import {
  getISOWeekId,
  getDaysOfISOWeek,
  getPreviousWeekId,
  getNextWeekId,
} from '../utils/dateUtils';
import { db } from '../db';

const STORAGE_PREFIX = 'mise_mealplan_';
const CHANGE_EVENT = 'mise-mealplan-updated';

/**
 * Creates a blank WeeklyMealPlan for an ISO week.
 */
export function createEmptyWeekPlan(weekId: string): WeeklyMealPlan {
  const days = getDaysOfISOWeek(weekId);
  const dayMap: { [isoDate: string]: DayMealPlan } = {};

  for (const d of days) {
    dayMap[d.isoDate] = {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
    };
  }

  return {
    weekId,
    days: dayMap,
  };
}

/**
 * Reads a meal plan for a week from localStorage.
 */
function loadMealPlanFromStorage(weekId: string): WeeklyMealPlan {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${weekId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.weekId === weekId && parsed.days) {
        // Ensure all 7 days exist with valid slot arrays
        const empty = createEmptyWeekPlan(weekId);
        for (const dateKey of Object.keys(empty.days)) {
          if (!parsed.days[dateKey]) {
            parsed.days[dateKey] = empty.days[dateKey];
          } else {
            parsed.days[dateKey].breakfast = parsed.days[dateKey].breakfast || [];
            parsed.days[dateKey].lunch = parsed.days[dateKey].lunch || [];
            parsed.days[dateKey].snacks = parsed.days[dateKey].snacks || [];
            parsed.days[dateKey].dinner = parsed.days[dateKey].dinner || [];
          }
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading meal plan from storage:', err);
  }
  return createEmptyWeekPlan(weekId);
}

/**
 * Saves a meal plan to localStorage and triggers cross-hook notification.
 */
function saveMealPlanToStorage(plan: WeeklyMealPlan, senderId?: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${plan.weekId}`, JSON.stringify(plan));
    // Asynchronously mirror to Dexie settings for durability
    db.settings
      .put({ key: `mealplan_${plan.weekId}`, value: plan })
      .catch((e) => console.warn('Could not mirror meal plan to Dexie:', e));

    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, { detail: { weekId: plan.weekId, senderId } })
    );
  } catch (err) {
    console.error('Error saving meal plan to storage:', err);
  }
}

export function useMealPlan(initialWeekId?: string) {
  const [weekId, setWeekId] = useState<string>(() => initialWeekId || getISOWeekId());
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan>(() => loadMealPlanFromStorage(weekId));
  const hookInstanceId = useRef(`inst_${Math.random().toString(36).substring(2, 9)}`);
  const recentAddTimestamps = useRef<Record<string, number>>({});

  // Sync state when weekId changes or when another instance updates localStorage
  useEffect(() => {
    setMealPlan(loadMealPlanFromStorage(weekId));

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ weekId?: string; senderId?: string }>;
      // Ignore events dispatched by this same hook instance
      if (custom.detail?.senderId === hookInstanceId.current) {
        return;
      }
      if (!custom.detail || custom.detail.weekId === weekId) {
        setMealPlan(loadMealPlanFromStorage(weekId));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `${STORAGE_PREFIX}${weekId}`) {
        setMealPlan(loadMealPlanFromStorage(weekId));
      }
    };

    window.addEventListener(CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [weekId]);

  // Action: Add recipe to a slot with double-dispatch deduplication guard
  const addRecipeToSlot = useCallback(
    (
      dateStr: string,
      slot: MealSlotType,
      recipeId: string,
      servingsOverride: number = 2
    ) => {
      const now = Date.now();
      const dedupKey = `${dateStr}_${slot}_${recipeId}`;
      const lastAdded = recentAddTimestamps.current[dedupKey] || 0;
      if (now - lastAdded < 500) {
        // Ignore duplicate trigger within 500ms
        return;
      }
      recentAddTimestamps.current[dedupKey] = now;

      setMealPlan((prev) => {
        const nextDays = { ...prev.days };
        const dayPlan: DayMealPlan = nextDays[dateStr]
          ? {
              breakfast: [...(nextDays[dateStr].breakfast || [])],
              lunch: [...(nextDays[dateStr].lunch || [])],
              snacks: [...(nextDays[dateStr].snacks || [])],
              dinner: [...(nextDays[dateStr].dinner || [])],
            }
          : { breakfast: [], lunch: [], snacks: [], dinner: [] };

        const newItem: PlannedMealItem = {
          id: `pm_${now}_${Math.random().toString(36).substring(2, 6)}`,
          recipeId,
          servingsOverride,
        };

        dayPlan[slot] = [...dayPlan[slot], newItem];
        nextDays[dateStr] = dayPlan;

        const updated: WeeklyMealPlan = { ...prev, days: nextDays };
        queueMicrotask(() => {
          saveMealPlanToStorage(updated, hookInstanceId.current);
        });
        return updated;
      });
    },
    []
  );

  // Action: Remove a planned meal item
  const removePlannedItem = useCallback(
    (dateStr: string, slot: MealSlotType, itemId: string) => {
      setMealPlan((prev) => {
        const nextDays = { ...prev.days };
        if (!nextDays[dateStr]) return prev;

        const dayPlan = {
          breakfast: [...(nextDays[dateStr].breakfast || [])],
          lunch: [...(nextDays[dateStr].lunch || [])],
          snacks: [...(nextDays[dateStr].snacks || [])],
          dinner: [...(nextDays[dateStr].dinner || [])],
        };
        dayPlan[slot] = dayPlan[slot].filter((item) => item.id !== itemId);
        nextDays[dateStr] = dayPlan;

        const updated: WeeklyMealPlan = { ...prev, days: nextDays };
        queueMicrotask(() => {
          saveMealPlanToStorage(updated, hookInstanceId.current);
        });
        return updated;
      });
    },
    []
  );

  // Action: Update servings override for an item
  const updateSlotServings = useCallback(
    (dateStr: string, slot: MealSlotType, itemId: string, servingsOverride: number) => {
      setMealPlan((prev) => {
        const nextDays = { ...prev.days };
        if (!nextDays[dateStr]) return prev;

        const dayPlan = {
          breakfast: [...(nextDays[dateStr].breakfast || [])],
          lunch: [...(nextDays[dateStr].lunch || [])],
          snacks: [...(nextDays[dateStr].snacks || [])],
          dinner: [...(nextDays[dateStr].dinner || [])],
        };
        dayPlan[slot] = dayPlan[slot].map((item) =>
          item.id === itemId
            ? { ...item, servingsOverride: Math.max(0.5, servingsOverride) }
            : item
        );
        nextDays[dateStr] = dayPlan;

        const updated: WeeklyMealPlan = { ...prev, days: nextDays };
        queueMicrotask(() => {
          saveMealPlanToStorage(updated, hookInstanceId.current);
        });
        return updated;
      });
    },
    []
  );

  // Action: Move an item between slots and/or days
  const moveRecipeBetweenSlots = useCallback(
    (
      fromDateStr: string,
      fromSlot: MealSlotType,
      fromItemId: string,
      toDateStr: string,
      toSlot: MealSlotType
    ) => {
      setMealPlan((prev) => {
        const nextDays = { ...prev.days };
        if (!nextDays[fromDateStr]) return prev;

        const fromDay = {
          breakfast: [...(nextDays[fromDateStr].breakfast || [])],
          lunch: [...(nextDays[fromDateStr].lunch || [])],
          snacks: [...(nextDays[fromDateStr].snacks || [])],
          dinner: [...(nextDays[fromDateStr].dinner || [])],
        };
        const itemToMove = fromDay[fromSlot].find((i) => i.id === fromItemId);
        if (!itemToMove) return prev;

        // Remove from source
        fromDay[fromSlot] = fromDay[fromSlot].filter((i) => i.id !== fromItemId);
        nextDays[fromDateStr] = fromDay;

        // Add to destination
        const toDay = nextDays[toDateStr]
          ? {
              breakfast: [...(nextDays[toDateStr].breakfast || [])],
              lunch: [...(nextDays[toDateStr].lunch || [])],
              snacks: [...(nextDays[toDateStr].snacks || [])],
              dinner: [...(nextDays[toDateStr].dinner || [])],
            }
          : { breakfast: [], lunch: [], snacks: [], dinner: [] };
        toDay[toSlot] = [...toDay[toSlot], itemToMove];
        nextDays[toDateStr] = toDay;

        const updated: WeeklyMealPlan = { ...prev, days: nextDays };
        queueMicrotask(() => {
          saveMealPlanToStorage(updated, hookInstanceId.current);
        });
        return updated;
      });
    },
    []
  );

  // Action: Clear entire week
  const clearWeek = useCallback(
    (targetWeekId?: string) => {
      const target = targetWeekId || weekId;
      const empty = createEmptyWeekPlan(target);
      saveMealPlanToStorage(empty, hookInstanceId.current);
      if (target === weekId) {
        setMealPlan(empty);
      }
    },
    [weekId]
  );

  // Navigation helpers
  const goToPreviousWeek = useCallback(() => {
    setWeekId((curr) => getPreviousWeekId(curr));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekId((curr) => getNextWeekId(curr));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setWeekId(getISOWeekId());
  }, []);

  // Total meals count this week
  const totalPlannedMealsCount = useMemo(() => {
    let count = 0;
    for (const d of Object.values(mealPlan.days || {})) {
      count += (d.breakfast?.length || 0) + (d.lunch?.length || 0) + (d.snacks?.length || 0) + (d.dinner?.length || 0);
    }
    return count;
  }, [mealPlan]);

  // Check if a recipe is planned in this week
  const isRecipePlanned = useCallback(
    (recipeId: string): boolean => {
      for (const d of Object.values(mealPlan.days || {})) {
        const inBreakfast = d.breakfast?.some((i) => i.recipeId === recipeId);
        const inLunch = d.lunch?.some((i) => i.recipeId === recipeId);
        const inSnacks = d.snacks?.some((i) => i.recipeId === recipeId);
        const inDinner = d.dinner?.some((i) => i.recipeId === recipeId);
        if (inBreakfast || inLunch || inSnacks || inDinner) return true;
      }
      return false;
    },
    [mealPlan]
  );

  return {
    weekId,
    setWeekId,
    mealPlan,
    totalPlannedMealsCount,
    isRecipePlanned,
    addRecipeToSlot,
    removePlannedItem,
    updateSlotServings,
    moveRecipeBetweenSlots,
    clearWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  };
}
