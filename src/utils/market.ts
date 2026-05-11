import { MarketStatus } from '@/constants/market';

import { dayjs } from './dayjs';

export type Holiday = {
  year: string;
  date: string;
  name: string;
};

const MORNING_OPEN = 9 * 60 + 30;
const MORNING_CLOSE = 11 * 60 + 30;
const AFTERNOON_OPEN = 13 * 60;
const AFTERNOON_CLOSE = 15 * 60;

function getMinuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isMarketOpen(holidays: Holiday[], date: Date = new Date()): MarketStatus {
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return MarketStatus.CLOSED;
  }

  const dateStr = dayjs(date).format('YYYY-MM-DD');
  if (holidays.some((h) => h.date === dateStr)) {
    return MarketStatus.CLOSED;
  }

  const minutes = getMinuteOfDay(date);

  if (minutes >= MORNING_OPEN && minutes < MORNING_CLOSE) {
    return MarketStatus.OPEN;
  }
  if (minutes >= AFTERNOON_OPEN && minutes < AFTERNOON_CLOSE) {
    return MarketStatus.OPEN;
  }

  return MarketStatus.AFTER_HOURS;
}
