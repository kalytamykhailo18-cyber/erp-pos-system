import type { ShiftType, Branch } from '../types';

/**
 * Automatically determines the shift type based on current time and branch closing times
 *
 * Logic:
 * - If branch has no shift change (has_shift_change = false): Always return FULL_DAY
 * - If current time is before midday closing time: MORNING shift
 * - If current time is after midday closing time: AFTERNOON shift
 *
 * @param branch - Branch with closing time configuration
 * @param currentTime - Current time (defaults to now)
 * @returns The appropriate shift type
 */
export const detectShiftType = (branch: Branch, currentTime: Date = new Date()): ShiftType => {
  // If branch doesn't have shift changes, it's always a full day shift
  if (!branch.has_shift_change) {
    return 'FULL_DAY';
  }

  // Parse midday closing time (format: "HH:MM:SS" or "HH:MM")
  const middayClosingTime = branch.midday_closing_time;
  if (!middayClosingTime) {
    // If no midday closing time configured, assume full day
    return 'FULL_DAY';
  }

  const [middayHour, middayMinute] = middayClosingTime.split(':').map(Number);

  // Get current hour and minute
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Convert both to minutes since midnight for easier comparison
  const currentMinutesFromMidnight = currentHour * 60 + currentMinute;
  const middayMinutesFromMidnight = middayHour * 60 + middayMinute;

  // If current time is before midday closing, it's morning shift
  if (currentMinutesFromMidnight < middayMinutesFromMidnight) {
    return 'MORNING';
  }

  // Otherwise, it's afternoon shift
  return 'AFTERNOON';
};

/**
 * Gets the shift label in Spanish
 */
export const getShiftLabel = (shiftType: ShiftType): string => {
  const labels: Record<ShiftType, string> = {
    MORNING: 'Turno Mañana',
    AFTERNOON: 'Turno Tarde',
    FULL_DAY: 'Día Completo'
  };
  return labels[shiftType];
};

/**
 * Formats time string (HH:MM:SS or HH:MM) to HH:MM display format
 */
export const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '-';
  return timeString.substring(0, 5);
};
