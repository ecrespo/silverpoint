/**
 * ISO dates as whole days since 1970-01-01, in UTC. Day arithmetic never touches the host's
 * time zone or clock, so server and client agree (REQ-005, REQ-103).
 */
const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days since the epoch of an ISO `YYYY-MM-DD` date; `NaN` when it is not one. */
export function parseIsoDate(iso: string): number {
  const match = ISO_DATE.exec(iso);
  if (!match) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
}

/** The ISO `YYYY-MM-DD` form of a day number. */
export function isoDate(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(day: number, days: number): number {
  return day + days;
}

/** Day of the week in UTC, 0 = Sunday. */
export function weekday(day: number): number {
  return (((day + 4) % 7) + 7) % 7;
}
