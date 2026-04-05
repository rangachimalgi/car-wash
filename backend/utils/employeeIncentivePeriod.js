import { format, startOfDay, startOfWeek, addDays } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const DEFAULT_TZ = 'Asia/Kolkata';

/**
 * @param {Date} completedAt
 * @param {'daily'|'weekly'} periodType
 * @param {string} [timeZone]
 * @param {number} [weekStartsOn] date-fns: 0=Sun, 1=Mon
 */
export function getPeriodBounds(completedAt, periodType, timeZone = DEFAULT_TZ, weekStartsOn = 1) {
  const zoned = utcToZonedTime(completedAt, timeZone);

  if (periodType === 'daily') {
    const dayStartLocal = startOfDay(zoned);
    const dayEndLocal = addDays(dayStartLocal, 1);
    const start = zonedTimeToUtc(dayStartLocal, timeZone);
    const end = zonedTimeToUtc(dayEndLocal, timeZone);
    const periodKey = `D-${format(zoned, 'yyyy-MM-dd')}`;
    return { start, end, periodKey };
  }

  const weekStartLocal = startOfWeek(zoned, { weekStartsOn });
  const weekEndLocal = addDays(startOfDay(weekStartLocal), 7);
  const start = zonedTimeToUtc(startOfDay(weekStartLocal), timeZone);
  const end = zonedTimeToUtc(weekEndLocal, timeZone);
  const periodKey = `W-${format(weekStartLocal, 'yyyy-MM-dd')}`;
  return { start, end, periodKey };
}
