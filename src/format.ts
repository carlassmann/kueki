import { translate } from './intl/standalone';

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : translate()('common.error.generic');
}
export function relativeTime(at: number) {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  return seconds < 60
    ? translate()('common.relative.seconds', { seconds })
    : translate()('common.relative.minutes', { minutes: Math.floor(seconds / 60) });
}

const formatters = new Map<string, Intl.DateTimeFormat | Intl.RelativeTimeFormat>();
function cached<T extends Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  key: string,
  make: () => T,
) {
  if (!formatters.has(key)) formatters.set(key, make());
  return formatters.get(key) as T;
}

/** "Today", "Yesterday", or a short date, so a night's events read at a glance. */
export function eventDay(at: number, locale: string, now = new Date()) {
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(now) - startOfDay(new Date(at))) / 86_400_000);
  if (daysAgo > 1)
    return cached(
      `date:${locale}`,
      () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
    ).format(at);
  const label = cached(
    `relative:${locale}`,
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
  ).format(-daysAgo, 'day');
  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
}

export function eventTime(at: number, locale: string) {
  return cached(
    `time:${locale}`,
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
  ).format(at);
}

export function durationText(ms: number) {
  const t = translate();
  if (ms === 0) return t('alerts.instant');
  if (ms < 60_000) return t('alerts.seconds', { seconds: String(ms / 1000) });
  if (ms === 60_000) return t('alerts.minute');
  if (ms < 3_600_000) return t('alerts.minutes', { minutes: String(ms / 60_000) });
  if (ms < 86_400_000) return t('alerts.hours', { hours: String(ms / 3_600_000) });
  if (ms === 86_400_000) return t('alerts.day');
  return t('alerts.days', { days: String(ms / 86_400_000) });
}
