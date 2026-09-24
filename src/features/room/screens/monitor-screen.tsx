import type { CSSProperties } from 'react';
import {
  AlertIcon,
  AlertMutedIcon,
  BabyIcon,
  BrightIcon,
  ForwardIcon,
  MicrophoneIcon,
  ParentIcon,
  PauseIcon,
  SoundIcon,
} from '../../../icons';
import { durationText, relativeTime } from '../../../format';
import type { PublicDevice } from '../../../protocol';
import { AudioMeter } from '../parts/room-components';
import { useRoom } from '../room-context';
import { SENSITIVITY_THRESHOLDS } from '../../../noise';
import { KuekiMascot } from '../../../KuekiMascot';
import { describeNest } from '../lib/nest-state';
import { T, useIntl } from '../../../intl/setup';
import type { MessageKey } from '../../../intl/messages';
import type { AudioStatus } from '../lib/audio-calls';
import { Button } from '../../../components/ui/button';
import './monitor-screen.css';
import { Notice } from '../../../components/ui/notice';
import { Status } from '../../../components/ui/status';
import { Slider } from '../../../components/ui/slider';
import { Caption } from '../../../components/ui/text';

const AUDIO_ACTIVE_STATUSES: AudioStatus[] = ['connecting', 'live', 'paused'];
const AUDIO_STATUS_KEYS = {
  connecting: 'audio.connecting',
  live: 'audio.live',
  paused: 'audio.paused',
  stopped: 'audio.stopped',
  disconnected: 'audio.disconnected',
  failed: 'audio.failed',
} as const satisfies Record<Exclude<AudioStatus, ''>, MessageKey>;
const SENSITIVITY_KEYS = ['sensitivity.low', 'sensitivity.medium', 'sensitivity.high'] as const;

export function MonitorScreen() {
  const room = useRoom();

  return (
    <section className="monitor-panel">
      {room.isBaby ? <BabyMonitor room={room} /> : <ParentMonitor room={room} />}
    </section>
  );
}

function BabyMonitor({ room }: { room: ReturnType<typeof useRoom> }) {
  const t = useIntl();
  const soundDetected = room.active && room.level >= SENSITIVITY_THRESHOLDS[room.sensitivity - 1]!;
  const monitoringHereOnly = room.active && !room.connected;

  return (
    <>
      <div className="monitor-hero">
        <KuekiMascot
          state={!room.active ? 'paused' : soundDetected ? 'sound' : 'quiet'}
          alt={t('monitor.mascotAlt')}
        />
        <h2
          data-testid="monitor-status"
          data-state={!room.active ? 'ready' : monitoringHereOnly ? 'local' : 'monitoring'}
        >
          {!room.active
            ? t('monitor.titleReady')
            : monitoringHereOnly
              ? t('monitor.statusLocal')
              : t('monitor.titleMonitoring')}
        </h2>
        <p>{room.active ? t('monitor.subtitleMonitoring') : t('monitor.subtitleReady')}</p>
      </div>
      <div className="meter-wrap">
        <div>
          <span>{t('monitor.roomSound')}</span>
          {room.active && (
            <span data-sound={soundDetected}>
              {soundDetected ? t('monitor.levelLittle') : t('monitor.levelQuiet')}
            </span>
          )}
        </div>
        <AudioMeter
          value={room.active ? room.level : 0}
          threshold={SENSITIVITY_THRESHOLDS[room.sensitivity - 1]}
        />
      </div>
      <Button
        variant={room.active ? 'soft' : 'primary'}
        full
        data-testid="monitor-toggle"
        data-active={room.active}
        disabled={room.busy || (!room.active && !room.connected)}
        onClick={() => void room.toggleMonitoring()}
      >
        {room.active ? (
          <PauseIcon size={19} weight="fill" />
        ) : (
          <MicrophoneIcon size={19} weight="fill" />
        )}{' '}
        {room.busy ? t('monitor.opening') : room.active ? t('monitor.pause') : t('monitor.start')}
      </Button>
      <div className="baby-checks">
        <span data-on={room.active}>
          <MicrophoneIcon size={16} />
          {room.active ? t('monitor.micOn') : t('monitor.micOff')}
        </span>
        {/* While monitoring without a wake lock, the notice below says the same thing with advice. */}
        {!(room.active && !room.awake) && (
          <span data-on={room.awake}>
            <BrightIcon size={16} />
            {room.awake ? t('monitor.awakeOn') : t('monitor.awakeOff')}
          </span>
        )}
        <span data-on={room.parents.length > 0}>
          <ParentIcon size={16} />
          {t('monitor.parentsOnline', { count: room.parents.length })}
        </span>
      </div>
      {room.active && !room.awake && <Notice>{t('monitor.keepAwake')}</Notice>}
      <section className="monitor-card">
        <Sensitivity
          id="sensitivity"
          testId="baby-sensitivity"
          value={room.sensitivity}
          disabled={!room.connected}
          onChange={(value) => void room.changeSensitivity(room.session.deviceId, value)}
        />
      </section>
    </>
  );
}

function ParentMonitor({ room }: { room: ReturnType<typeof useRoom> }) {
  const t = useIntl();
  if (room.babies.length === 0)
    return (
      <div className="device-list">
        <div className="empty-nest" data-testid="empty-nest">
          <KuekiMascot className="empty-nest-mascot" state="quiet" alt={t('parent.emptyAlt')} />
          <h2>{t('parent.emptyTitle')}</h2>
          <p>
            <T k="parent.emptyBody" components={{ br: () => <br /> }} />
          </p>
          <Button variant="primary" data-testid="empty-nest-invite" onClick={room.openInvitation}>
            {t('parent.emptyInvite')} <ForwardIcon size={18} />
          </Button>
        </div>
        <NotificationReadiness room={room} />
      </div>
    );
  // The baby cards come straight after a compact summary: at night the card is what a parent
  // reaches for, so it must not sit below a hero.
  return (
    <div className="device-list">
      {/* Without a connection the banner above says everything the summary could. */}
      {room.connected && <NestSummary room={room} />}
      <div className="device-grid" data-count={room.babies.length}>
        {room.babies.map((device) => (
          <BabyDevice key={device.id} room={room} device={device} />
        ))}
      </div>
      <NotificationReadiness room={room} />
    </div>
  );
}

function NotificationReadiness({ room }: { room: ReturnType<typeof useRoom> }) {
  const t = useIntl();
  // Live audio is shown on each baby card by its listen button, so this row is only about alerts.
  return (
    <section
      className="monitor-readiness"
      data-testid="monitor-readiness"
      data-on={room.pushEnabled}
      aria-label={t('readiness.title')}
    >
      <Status tone={room.pushEnabled ? 'good' : 'warning'}>
        {room.pushEnabled ? t('readiness.notificationsOn') : t('readiness.notificationsOff')}
      </Status>
      {!room.pushEnabled && (
        <Button
          variant="quiet"
          size="small"
          data-testid={room.installRequired ? 'open-install-guide' : 'enable-notifications'}
          disabled={room.busy || !room.connected}
          onClick={
            room.installRequired ? room.openInstallGuide : () => void room.enableNotifications()
          }
        >
          <AlertIcon size={17} />
          {room.installRequired ? t('readiness.install') : t('settings.notificationsEnable')}
        </Button>
      )}
    </section>
  );
}

function BabyDevice({ room, device }: { room: ReturnType<typeof useRoom>; device: PublicDevice }) {
  const t = useIntl();
  const status = room.audioStatuses[device.id];
  const available = room.connected && device.online && device.monitoring;
  const needsResume = status === 'paused' || status === 'disconnected' || status === 'failed';
  return (
    <article
      className="device-card"
      data-testid="device-card"
      data-device-id={device.id}
      data-device-name={device.name}
    >
      <div className="device-heading">
        <div className="device-icon">
          <BabyIcon size={26} />
        </div>
        <div>
          <h3>{device.name}</h3>
          <Status
            tone={available ? 'good' : 'warning'}
            data-testid="device-status"
            data-state={
              !room.connected
                ? 'unknown'
                : !device.online
                  ? 'offline'
                  : device.monitoring
                    ? 'monitoring'
                    : 'paused'
            }
          >
            {!room.connected
              ? t('parent.deviceUnknown')
              : !device.online
                ? t('parent.deviceOffline')
                : device.monitoring
                  ? t('parent.deviceMonitoring')
                  : t('parent.devicePaused')}
          </Status>
        </div>
      </div>
      <div className="device-actions">
        {needsResume && (
          <Button
            variant="primary"
            size="small"
            data-testid="resume-audio"
            disabled={!available}
            onClick={() =>
              status === 'paused' ? room.resumeAudio(device.id) : room.listenTo(device.id)
            }
          >
            <ParentIcon size={18} />
            <span>{t('parent.resumeAudio')}</span>
          </Button>
        )}
        {isListening(status) || needsResume ? (
          <Button
            variant="secondary"
            size="small"
            data-testid="listen-toggle"
            data-listening="true"
            onClick={() => room.stopListening(device.id)}
          >
            <PauseIcon size={17} weight="fill" />
            <span>{t('parent.stopListening')}</span>
          </Button>
        ) : (
          !needsResume && (
            <Button
              variant="primary"
              size="small"
              data-testid="listen-toggle"
              data-listening="false"
              disabled={!available}
              onClick={() => room.listenTo(device.id)}
            >
              <ParentIcon size={18} />
              <span>{t('parent.listen')}</span>
            </Button>
          )
        )}
        <MuteToggle room={room} device={device} />
      </div>
      {/* The listen button already says whether audio is on, so the line below only speaks up
          for states the button cannot show: connecting, and audio that dropped out. */}
      <div className="device-audio" data-testid="audio-status" data-status={status || 'off'}>
        <AudioMeter
          value={available ? device.level : 0}
          threshold={SENSITIVITY_THRESHOLDS[device.sensitivity - 1]}
        />
        {needsExplaining(status) && (
          <p className="audio-status" role="status">
            <SoundIcon size={17} />
            {audioStatusLabel(status, t)}
          </p>
        )}
        <Caption as="span">
          {device.lastNoise
            ? t('parent.deviceLastSound', { time: relativeTime(device.lastNoise) })
            : t('parent.deviceNoSounds')}
        </Caption>
      </div>
      <details className="device-sensitivity" data-testid="sensitivity-details">
        <summary>
          {t('sensitivity.label')}
          <span>{t(SENSITIVITY_KEYS[device.sensitivity - 1]!)}</span>
        </summary>
        <Sensitivity
          id={`sensitivity-${device.id}`}
          testId="device-sensitivity"
          label={t('parent.deviceSensitivity', { name: device.name })}
          value={device.sensitivity}
          disabled={!room.connected}
          onChange={(value) => void room.changeSensitivity(device.id, value)}
        />
      </details>
    </article>
  );
}

function NestSummary({ room }: { room: ReturnType<typeof useRoom> }) {
  const t = useIntl();
  const nest = describeNest(room.babies, room.connected, t);

  return (
    <section
      className="nest-summary"
      data-testid="nest-summary"
      data-state={nest.state}
      aria-live="polite"
    >
      <KuekiMascot state={nest.mascot} alt={t('nest.alt')} />
      <div>
        <h2>{nest.title}</h2>
        <p>{nest.detail}</p>
      </div>
    </section>
  );
}

function MuteToggle({ room, device }: { room: ReturnType<typeof useRoom>; device: PublicDevice }) {
  const t = useIntl();
  const muted = room.mutedBabies.includes(device.id);

  return (
    <Button
      variant="quiet"
      size="small"
      className="mute-toggle"
      data-testid="mute-toggle"
      data-muted={muted}
      aria-pressed={muted}
      disabled={!room.connected}
      onClick={() => void room.toggleMute(device.id)}
    >
      {muted ? <AlertMutedIcon size={17} /> : <AlertIcon size={17} />}
      <span>{muted ? t('mute.muted') : t('mute.mute')}</span>
    </Button>
  );
}

function Sensitivity({
  disabled,
  id,
  label,
  testId,
  value,
  onChange,
}: {
  disabled?: boolean;
  id: string;
  label?: string;
  testId: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useIntl();
  const { settings } = useRoom();
  return (
    <div className="sensitivity">
      {/* With an explicit label the slider sits under a disclosure that already names it and
          shows the level, so a visible heading would repeat it. */}
      {!label && (
        <label htmlFor={id}>
          {t('sensitivity.label')} <span>{t(SENSITIVITY_KEYS[value - 1]!)}</span>
        </label>
      )}
      <Slider
        id={id}
        data-testid={testId}
        aria-label={label}
        aria-describedby={`${id}-description`}
        aria-valuetext={t(SENSITIVITY_KEYS[value - 1]!)}
        min="1"
        max="3"
        step="1"
        disabled={disabled}
        value={value}
        style={
          { '--slider-progress': (value - 1) / (SENSITIVITY_KEYS.length - 1) } as CSSProperties
        }
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <Caption id={`${id}-description`}>
        {t(
          value === 1
            ? 'sensitivity.lowDetail'
            : value === 3
              ? 'sensitivity.highDetail'
              : 'sensitivity.mediumDetail',
        )}
      </Caption>
      <Caption>
        {t('sensitivity.hint', {
          after: settings.alertAfterMs
            ? t('sensitivity.hintAfter', { duration: durationText(settings.alertAfterMs) })
            : t('sensitivity.hintInstant'),
          cooldown: durationText(settings.cooldownMs),
        })}
      </Caption>
    </div>
  );
}

function needsExplaining(status?: AudioStatus): status is AudioStatus {
  return (
    status === 'connecting' ||
    status === 'paused' ||
    status === 'disconnected' ||
    status === 'failed'
  );
}

function isListening(status?: AudioStatus) {
  return Boolean(status && AUDIO_ACTIVE_STATUSES.includes(status));
}

function audioStatusLabel(status: AudioStatus, translate: ReturnType<typeof useIntl>) {
  return status ? translate(AUDIO_STATUS_KEYS[status]) : '';
}
