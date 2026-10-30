import { WeeklyMealPlan } from '../types/mealPlan';
import { Recipe } from '../types/recipe';
import { DensityRecord } from '../types/density';
import { ConversionMode } from '../types/conversion';
import { getDaysOfISOWeek, formatWeekRangeDisplay } from './dateUtils';
import { MEAL_SLOTS } from './mealTags';
import { aggregateShoppingList } from './shoppingListAggregator';

export interface PdfExportOptions {
  includeShoppingList?: boolean;
  densityDatabase?: DensityRecord[];
  unitMode?: ConversionMode;
}

/**
 * Generates the print-ready HTML for the weekly meal plan.
 */
export function generateMealPlanHtml(
  mealPlan: WeeklyMealPlan,
  recipes: Recipe[],
  weekId: string,
  options: PdfExportOptions = {}
): string {
  const days = getDaysOfISOWeek(weekId);
  const weekLabel = formatWeekRangeDisplay(weekId);
  const recipeMap = new Map<string, Recipe>();
  recipes.forEach((r) => recipeMap.set(r.id, r));

  // Generate shopping list if requested
  const shoppingItems =
    options.includeShoppingList && options.densityDatabase
      ? aggregateShoppingList(
          mealPlan,
          recipes,
          options.densityDatabase,
          options.unitMode || 'metric'
        ).filter((i) => !i.isPantryStaple)
      : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mise - Meal Plan ${weekId}</title>
  <style>
    @page {
      size: landscape A4;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #FAF8F5;
      color: #1C1B18;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 11px;
      line-height: 1.35;
    }
    .serif {
      font-family: "Playfair Display", Georgia, "Times New Roman", serif;
    }
    .mono {
      font-family: "JetBrains Mono", Menlo, Consolas, monospace;
    }
    
    /* Header */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #C85A32;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #1C1B18;
    }
    .brand-sub {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #78736A;
      margin-top: 2px;
    }
    .week-badge {
      text-align: right;
    }
    .week-title {
      font-size: 14px;
      font-weight: 600;
      color: #C85A32;
    }
    .week-id {
      font-size: 10px;
      color: #78736A;
    }

    /* 7-Day Grid */
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      background: #FFFFFF;
      border: 1px solid #E6E1DA;
      border-radius: 8px;
      overflow: hidden;
    }
    .grid-table th {
      background: #F3EFEA;
      color: #1C1B18;
      font-weight: 700;
      padding: 6px 4px;
      border: 1px solid #E6E1DA;
      text-align: center;
      width: 12.5%;
    }
    .grid-table th.meal-label-col {
      width: 8%;
      background: #EFEAE4;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #78736A;
    }
    .grid-table td {
      border: 1px solid #E6E1DA;
      padding: 6px;
      vertical-align: top;
      height: 105px;
    }
    .day-header-name {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #78736A;
    }
    .day-header-num {
      font-size: 13px;
      font-weight: bold;
      color: #1C1B18;
    }
    
    /* Meal Slot Row Label */
    .meal-slot-label {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      text-align: center;
      vertical-align: middle !important;
      background: #FAF8F5;
    }

    /* Planned Meal Card */
    .meal-card {
      background: #FAF8F5;
      border: 1px solid #E6E1DA;
      border-radius: 6px;
      padding: 4px 6px;
      margin-bottom: 4px;
    }
    .meal-card:last-child {
      margin-bottom: 0;
    }
    .meal-title {
      font-weight: 700;
      font-size: 11px;
      color: #1C1B18;
      line-height: 1.2;
    }
    .meal-meta {
      font-size: 9px;
      color: #78736A;
      margin-top: 2px;
      display: flex;
      justify-content: space-between;
    }
    .meal-servings {
      font-weight: 600;
      color: #C85A32;
    }
    .empty-slot {
      color: #CCC;
      font-style: italic;
      font-size: 10px;
      text-align: center;
      padding-top: 20px;
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      font-size: 9px;
      color: #A09A90;
      border-top: 1px solid #E6E1DA;
      padding-top: 6px;
    }

    /* Optional Shopping Section */
    .shopping-section {
      page-break-before: always;
      padding-top: 10px;
    }
    .shopping-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 10px;
    }
    .shopping-aisle {
      background: #FFFFFF;
      border: 1px solid #E6E1DA;
      border-radius: 6px;
      padding: 8px;
    }
    .shopping-aisle-title {
      font-size: 11px;
      font-weight: 700;
      color: #C85A32;
      border-bottom: 1px solid #E6E1DA;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .shopping-item-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .checkbox {
      width: 10px;
      height: 10px;
      border: 1px solid #78736A;
      border-radius: 2px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-bar">
    <div>
      <h1 class="brand-title serif">Mise en Place</h1>
      <div class="brand-sub">Weekly Culinary Schedule</div>
    </div>
    <div class="week-badge">
      <div class="week-title">${weekLabel}</div>
      <div class="week-id mono">ISO Week: ${weekId}</div>
    </div>
  </div>

  <!-- 7-Day Grid Table -->
  <table class="grid-table">
    <thead>
      <tr>
        <th class="meal-label-col">Meal</th>
        ${days
          .map(
            (d) => `
          <th>
            <div class="day-header-name">${d.dayName}</div>
            <div class="day-header-num">${d.dayNumber} ${d.monthName}</div>
          </th>
        `
          )
          .join('')}
      </tr>
    </thead>
    <tbody>
      ${MEAL_SLOTS.map((slot) => {
        return `
          <tr>
            <td class="meal-slot-label serif">${slot.label}</td>
            ${days
              .map((d) => {
                const dayData = mealPlan.days?.[d.isoDate];
                const items = dayData?.[slot.type] || [];

                if (items.length === 0) {
                  return `<td><div class="empty-slot">—</div></td>`;
                }

                return `
                  <td>
                    ${items
                      .map((item) => {
                        const recipe = recipeMap.get(item.recipeId);
                        const title = recipe ? recipe.title : 'Recipe';
                        const totalMins = recipe
                          ? (recipe.times.prepMinutes || 0) + (recipe.times.cookMinutes || 0)
                          : 0;

                        return `
                          <div class="meal-card">
                            <div class="meal-title serif">${title}</div>
                            <div class="meal-meta">
                              <span class="meal-servings mono">${item.servingsOverride} servings</span>
                              ${totalMins > 0 ? `<span class="mono">${totalMins}m</span>` : ''}
                            </div>
                          </div>
                        `;
                      })
                      .join('')}
                  </td>
                `;
              })
              .join('')}
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Page Footer -->
  <div class="footer">
    <div>Mise En Place · Tactile Kitchen & Recipe Companion</div>
    <div>Generated: ${new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
  </div>

  ${
    shoppingItems.length > 0
      ? `
  <!-- Optional Page 2: Shopping Checklist -->
  <div class="shopping-section">
    <div class="header-bar">
      <div>
        <h2 class="brand-title serif">Grocery Shopping Checklist</h2>
        <div class="brand-sub">${weekLabel} · Market Rounding</div>
      </div>
    </div>

    <div class="shopping-grid">
      ${Array.from(new Set(shoppingItems.map((i) => i.aisle)))
        .map((aisle) => {
          const aisleItems = shoppingItems.filter((i) => i.aisle === aisle);
          return `
            <div class="shopping-aisle">
              <div class="shopping-aisle-title serif">${aisle}</div>
              ${aisleItems
                .map(
                  (item) => `
                <div class="shopping-item-row">
                  <div class="checkbox"></div>
                  <div style="flex: 1;"><strong>${item.displayName}</strong></div>
                  <div class="mono">${item.displayQuantity} ${item.displayUnit || ''}</div>
                </div>
              `
                )
                .join('')}
            </div>
          `;
        })
        .join('')}
    </div>
  </div>
  `
      : ''
  }

</body>
</html>`;
}

/**
 * Generates and triggers a print-to-PDF dialog for the weekly meal plan.
 * Renders a high-resolution, Warm Kitchen styled landscape document.
 */
export function exportMealPlanToPdf(
  mealPlan: WeeklyMealPlan,
  recipes: Recipe[],
  weekId: string,
  options: PdfExportOptions = {}
): void {
  if (typeof document === 'undefined') return;

  const htmlContent = generateMealPlanHtml(mealPlan, recipes, weekId, options);

  // Use an invisible iframe to trigger the browser's native Print / Save to PDF dialog
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback: open in new window if iframe is blocked
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 350);
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Give fonts and styles a moment to render, then open the system Print/PDF dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to window.open:', err);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(htmlContent);
        win.document.close();
        win.print();
      }
    } finally {
      // Clean up iframe after print dialog resolves or closes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 10000);
    }
  }, 400);
}
