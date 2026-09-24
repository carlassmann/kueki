import { KuekiMascot } from '../../../KuekiMascot';
import { useIntl } from '../../../intl/setup';
import { SENSITIVITY_THRESHOLDS } from '../../../noise';
import { describeNest } from '../lib/nest-state';
import { useRoom } from '../room-context';
import './night-view.css';

/** Dimming covers the whole room with a near-black view that keeps only what matters in the dark:
    the chick and one line of state. Any tap brings the full screen back. */
export function NightView({ screenAwake }: { screenAwake: boolean }) {
  const room = useRoom();
  const t = useIntl();
  const reading = room.isBaby ? describeBaby(room, t) : describeParent(room, t);

  return (
    <div className="night-view" data-testid="night-view" data-state={reading.state}>
      <KuekiMascot state={reading.mascot} alt="" />
      <strong>{reading.title}</strong>
      {/* A dark screen that goes to sleep stops monitoring, so a missing wake lock stays visible. */}
      {!screenAwake && <em>{t('monitor.nightAwakeOff')}</em>}
      <span>{t('monitor.nightHint')}</span>
      {/* One button over the whole view: the chick inside is a button too and must not nest. */}
      <button
        type="button"
        className="night-wake"
        data-testid="night-wake"
        aria-label={t('monitor.restoreBrightness')}
        onClick={room.toggleDim}
      />
    </div>
  );
}

function describeParent(room: ReturnType<typeof useRoom>, t: ReturnType<typeof useIntl>) {
  const nest = describeNest(room.babies, room.connected, t);
  return nest.hearing ? { ...nest, state: 'sound', title: t('nest.titleSound') } : nest;
}

function describeBaby(room: ReturnType<typeof useRoom>, t: ReturnType<typeof useIntl>) {
  const sound = room.active && room.level >= SENSITIVITY_THRESHOLDS[room.sensitivity - 1]!;
  return {
    state: room.active ? (sound ? 'sound' : 'quiet') : 'paused',
    title: room.active ? t('monitor.titleMonitoring') : t('monitor.titleReady'),
    mascot: room.active ? (sound ? 'sound' : 'quiet') : 'paused',
  } as const;
}
