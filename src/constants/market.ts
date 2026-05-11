export const MarketStatus = {
  OPEN: 'open',
  CLOSED: 'closed',
  AFTER_HOURS: 'afterHours',
} as const;

export type MarketStatus = (typeof MarketStatus)[keyof typeof MarketStatus];
