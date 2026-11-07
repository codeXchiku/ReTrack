import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { Clock } from './clock';

dayjs.extend(isoWeek);

/**
 * Returns today's local date string as 'YYYY-MM-DD'.
 * Accepts an optional epoch ms or Clock for test determinism.
 */
export function today(nowOrClock: number | Clock = Date.now()): string {
  if (typeof nowOrClock === 'object' && nowOrClock !== null && 'now' in nowOrClock) {
    return toDay(nowOrClock.now());
  }
  return toDay(nowOrClock);
}

/**
 * Converts an epoch millisecond timestamp to a local calendar date string 'YYYY-MM-DD'.
 */
export function toDay(ms: number): string {
  return dayjs(ms).format('YYYY-MM-DD');
}

/**
 * Returns the epoch timestamp of the start of the day (00:00:00.000) for the given ms.
 */
export function startOfDay(ms: number): number {
  return dayjs(ms).startOf('day').valueOf();
}

/**
 * Returns the epoch timestamp of the end of the day (23:59:59.999) for the given ms.
 */
export function endOfDay(ms: number): number {
  return dayjs(ms).endOf('day').valueOf();
}

/**
 * Returns the epoch timestamp of the start of the week (Monday 00:00:00.000) for the given ms.
 */
export function startOfWeek(ms: number): number {
  return dayjs(ms).startOf('isoWeek').valueOf();
}

/**
 * Adds or subtracts `n` days from a 'YYYY-MM-DD' calendar date string.
 */
export function addDays(day: string, n: number): string {
  const [yearStr, monthStr, dateStr] = day.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const date = Number(dateStr);
  const d = new Date(Date.UTC(year, month, date + n));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dt = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

/**
 * Calculates calendar days between two 'YYYY-MM-DD' strings (b - a).
 * Safe from daylight-saving shifts by evaluating UTC midnight differences.
 */
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const t2 = Date.UTC(y2!, m2! - 1, d2!);
  return Math.round((t2 - t1) / 86400000);
}

/**
 * Formats duration in seconds into human-readable compact form:
 * - < 60s: '45s' / '0s'
 * - 60s to < 1h: '25m'
 * - >= 1h: '1h 15m' / '1h'
 */
export function formatDuration(sec: number): string {
  const safeSec = Math.max(0, Math.floor(sec));
  if (safeSec < 60) {
    return `${safeSec}s`;
  }

  const totalMins = Math.floor(safeSec / 60);
  if (totalMins < 60) {
    return `${totalMins}m`;
  }

  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Formats epoch millisecond timestamp into a 24-hour time string ("14:05").
 */
export function formatClock(epochMs: number): string {
  return dayjs(epochMs).format('HH:mm');
}
