import { useState, useEffect, useCallback } from 'react';
import { CustomGroceryItem, GroceryAisle } from '../types/mealPlan';
import { detectAisle } from '../utils/shoppingListAggregator';

const CHECKED_STORAGE_PREFIX = 'mise_shopping_checked_';
const CUSTOM_STORAGE_PREFIX = 'mise_shopping_custom_';

export function useShoppingListState(weekId: string) {
  // Map of canonicalKey -> boolean (checked)
  const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(`${CHECKED_STORAGE_PREFIX}${weekId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Custom added items
  const [customItems, setCustomItems] = useState<CustomGroceryItem[]>(() => {
    try {
      const raw = localStorage.getItem(`${CUSTOM_STORAGE_PREFIX}${weekId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Reload when weekId changes
  useEffect(() => {
    try {
      const rawChecked = localStorage.getItem(`${CHECKED_STORAGE_PREFIX}${weekId}`);
      setCheckedKeys(rawChecked ? JSON.parse(rawChecked) : {});

      const rawCustom = localStorage.getItem(`${CUSTOM_STORAGE_PREFIX}${weekId}`);
      setCustomItems(rawCustom ? JSON.parse(rawCustom) : []);
    } catch (e) {
      console.error('Error reading shopping list state:', e);
    }
  }, [weekId]);

  // Persist checked keys
  const toggleItemChecked = useCallback((canonicalKey: string) => {
    setCheckedKeys((prev) => {
      const next = { ...prev, [canonicalKey]: !prev[canonicalKey] };
      try {
        localStorage.setItem(`${CHECKED_STORAGE_PREFIX}${weekId}`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, [weekId]);

  // Add custom grocery item
  const addCustomItem = useCallback((name: string, aisle?: GroceryAisle) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const detected = aisle || detectAisle(trimmed);
    const newItem: CustomGroceryItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      aisle: detected,
      checked: false,
      createdAt: Date.now(),
    };

    setCustomItems((prev) => {
      const next = [newItem, ...prev];
      try {
        localStorage.setItem(`${CUSTOM_STORAGE_PREFIX}${weekId}`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, [weekId]);

  // Toggle custom item checked
  const toggleCustomItem = useCallback((id: string) => {
    setCustomItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      try {
        localStorage.setItem(`${CUSTOM_STORAGE_PREFIX}${weekId}`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, [weekId]);

  // Remove custom item
  const removeCustomItem = useCallback((id: string) => {
    setCustomItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(`${CUSTOM_STORAGE_PREFIX}${weekId}`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, [weekId]);

  // Clear checked items (uncheck recipe ingredients, remove checked custom items)
  const clearCheckedItems = useCallback(() => {
    setCheckedKeys({});
    try {
      localStorage.removeItem(`${CHECKED_STORAGE_PREFIX}${weekId}`);
    } catch (e) {
      console.error(e);
    }

    setCustomItems((prev) => {
      const next = prev.filter((item) => !item.checked);
      try {
        localStorage.setItem(`${CUSTOM_STORAGE_PREFIX}${weekId}`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, [weekId]);

  return {
    checkedKeys,
    customItems,
    toggleItemChecked,
    addCustomItem,
    toggleCustomItem,
    removeCustomItem,
    clearCheckedItems,
  };
}
