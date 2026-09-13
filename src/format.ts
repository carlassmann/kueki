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
