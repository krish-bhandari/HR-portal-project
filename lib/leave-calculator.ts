// lib/leave-calculator.ts
// Server-side leave day calculation with Saturday 0.5 rule
import {
  eachDayOfInterval,
  parseISO,
  isWeekend,
  isSaturday,
  isSunday,
  isEqual,
  startOfDay,
} from "date-fns";

export interface Holiday {
  date: string; // ISO date string
  name: string;
}

export interface LeaveDayResult {
  totalDays: number;
  breakdown: {
    weekdays: number;
    saturdays: number;
    sundays: number;
    holidays: number;
  };
}

export function calculateLeaveDays(
  startDate: string,
  endDate: string,
  holidays: Holiday[],
  halfDayPeriod?: "AM" | "PM" | null
): LeaveDayResult {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const allDays = eachDayOfInterval({ start, end });
  const holidayDates = holidays.map((h) => startOfDay(parseISO(h.date)));

  let weekdays = 0;
  let saturdays = 0;
  let sundays = 0;
  let holidayCount = 0;

  for (const day of allDays) {
    const dayStart = startOfDay(day);
    const isHoliday = holidayDates.some((hd) => isEqual(hd, dayStart));

    if (isHoliday) {
      holidayCount++;
      continue; // skip holidays — no deduction
    }

    if (isSunday(day)) {
      sundays++;
      continue; // skip Sundays — 0 cost
    }

    if (isSaturday(day)) {
      saturdays++;
    } else {
      weekdays++;
    }
  }

  // Saturdays count as 0.5 days each
  let totalDays = weekdays + saturdays * 0.5;

  // If half-day, halve the total
  if (halfDayPeriod === "AM" || halfDayPeriod === "PM") {
    totalDays = 0.5;
  }

  return {
    totalDays,
    breakdown: { weekdays, saturdays, sundays, holidays: holidayCount },
  };
}
