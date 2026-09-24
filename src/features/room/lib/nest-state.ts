import type { PublicDevice } from '../../../protocol';
import { SENSITIVITY_THRESHOLDS } from '../../../noise';
import type { useIntl } from '../../../intl/setup';

/** A recorded sound keeps the nest in its "sound" state this long, so the summary agrees with the
    noise alert and the "last sound" line instead of flipping back to "all quiet" between peaks. */
export const RECENT_SOUND_MS = 60_000;

export type NestState = 'unknown' | 'offline' | 'paused' | 'sound' | 'quiet';

export function isHearingSound(device: PublicDevice, now: number) {
  return (
    device.level >= SENSITIVITY_THRESHOLDS[device.sensitivity - 1]! ||
    (device.lastNoise > 0 && now - device.lastNoise < RECENT_SOUND_MS)
  );
}

/** One reading of the whole room, shared by the monitor summary and the night view so both say
    the same thing at the same moment. */
export function describeNest(
  babies: PublicDevice[],
  connected: boolean,
  t: ReturnType<typeof useIntl>,
  now = Date.now(),
) {
  const watched = babies.filter((device) => device.online && device.monitoring);
  const offline = babies.filter((device) => !device.online);
  const paused = babies.filter((device) => device.online && !device.monitoring);
  const noisy = watched.filter((device) => isHearingSound(device, now));
  const incomplete = offline.length > 0 || paused.length > 0;
  const state: NestState = !connected
    ? 'unknown'
    : offline.length
      ? 'offline'
      : paused.length
        ? 'paused'
        : noisy.length
          ? 'sound'
          : 'quiet';
  const title = !connected
    ? t('nest.titleUnknown')
    : incomplete && babies.length === 1
      ? t(offline.length ? 'event.offline.title' : 'nest.titlePaused')
      : incomplete
        ? t('nest.coverage', { count: String(watched.length), total: String(babies.length) })
        : noisy.length
          ? t('nest.titleSound')
          : t('nest.titleQuiet');
  const detail = !connected
    ? t('nest.unknownDetail')
    : incomplete && babies.length === 1
      ? t(offline.length ? 'nest.offlineDetail' : 'nest.pausedDetail', { name: babies[0]!.name })
      : incomplete
        ? [
            ...offline.map((device) => t('nest.deviceOffline', { name: device.name })),
            ...paused.map((device) => t('nest.devicePaused', { name: device.name })),
            ...noisy.map((device) => t('nest.soundDetail', { name: device.name })),
          ].join(' · ')
        : noisy.length
          ? t('nest.soundDetail', { name: noisy.map((device) => device.name).join(', ') })
          : t('nest.quietDetail', {
              name: watched.length === 1 ? watched[0]!.name : t('nest.theNest'),
            });
  const mascot = !connected || incomplete ? 'paused' : noisy.length ? 'sound' : 'quiet';
  return { state, title, detail, mascot } as const;
}
