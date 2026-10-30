/**
 * Date and ISO Week helper functions for Mise Meal Planner.
 * Standard ISO 8601 week starts on Monday and belongs to the year with the majority of its days.
 */

export interface WeekDayInfo {
  isoDate: string;    // "YYYY-MM-DD"
  dayName: string;    // "Mon", "Tue", etc.
  fullDayName: string;// "Monday", "Tuesday", etc.
  shortDate: string;  // "Oct 26"
  dayNumber: number;  // 26
  monthName: string;  // "Oct"
  isToday: boolean;
  date: Date;
}

/**
 * Returns the ISO 8601 week string for a given date, e.g. "2026-W44".
 */
export function getISOWeekId(date: Date = new Date()): string {
  const target = new Date(date.valueOf());
  // ISO week date days start with Monday (1) to Sunday (7)
  const dayNr = (date.getDay() + 6) % 7;
  // Set to nearest Thursday: current date + 4 - current day number
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Parses an ISO week string (e.g., "2026-W44") into year and week number.
 */
export function parseISOWeekId(weekId: string): { year: number; weekNumber: number } {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), weekNumber: 1 };
  }
  return {
    year: parseInt(match[1], 10),
    weekNumber: parseInt(match[2], 10),
  };
}

/**
 * Returns the Monday Date object for a given ISO week ID.
 */
export function getMondayOfISOWeek(weekId: string): Date {
  const { year, weekNumber } = parseISOWeekId(weekId);
  // Jan 4th is always in week 1
  const simple = new Date(year, 0, 4);
  const dayOfWeek = (simple.getDay() + 6) % 7; // 0 for Monday
  const mondayOfWeek1 = new Date(simple);
  mondayOfWeek1.setDate(simple.getDate() - dayOfWeek);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setDate(mondayOfWeek1.getDate() + (weekNumber - 1) * 7);
  return targetMonday;
}

/**
 * Returns array of 7 day descriptors (Monday to Sunday) for an ISO week.
 */
export function getDaysOfISOWeek(weekId: string): WeekDayInfo[] {
  const monday = getMondayOfISOWeek(weekId);
  const todayStr = formatISODate(new Date());
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const days: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isoDate = formatISODate(d);
    const month = monthNames[d.getMonth()];
    const dayNum = d.getDate();

    days.push({
      isoDate,
      dayName: dayNames[i],
      fullDayName: fullDayNames[i],
      shortDate: `${month} ${dayNum}`,
      dayNumber: dayNum,
      monthName: month,
      isToday: isoDate === todayStr,
      date: d,
    });
  }

  return days;
}

/**
 * Formats a Date object to "YYYY-MM-DD" local date string.
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the previous week ID, e.g. "2026-W43" from "2026-W44".
 */
export function getPreviousWeekId(weekId: string): string {
  const monday = getMondayOfISOWeek(weekId);
  monday.setDate(monday.getDate() - 7);
  return getISOWeekId(monday);
}

/**
 * Returns the next week ID, e.g. "2026-W45" from "2026-W44".
 */
export function getNextWeekId(weekId: string): string {
  const monday = getMondayOfISOWeek(weekId);
  monday.setDate(monday.getDate() + 7);
  return getISOWeekId(monday);
}

/**
 * Formats a week range header string, e.g. "Oct 26 – Nov 1, 2026".
 */
export function formatWeekRangeDisplay(weekId: string): string {
  const days = getDaysOfISOWeek(weekId);
  const first = days[0];
  const last = days[6];

  const firstYear = first.date.getFullYear();
  const lastYear = last.date.getFullYear();

  if (first.monthName === last.monthName && firstYear === lastYear) {
    return `${first.monthName} ${first.dayNumber} – ${last.dayNumber}, ${firstYear}`;
  } else if (firstYear === lastYear) {
    return `${first.shortDate} – ${last.shortDate}, ${firstYear}`;
  } else {
    return `${first.shortDate}, ${firstYear} – ${last.shortDate}, ${lastYear}`;
  }
}
