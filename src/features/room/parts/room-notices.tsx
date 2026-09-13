import { AlertActiveIcon, BrightIcon, CloseIcon, ConnectionIcon } from '../../../icons';
import type { ConnectionStatus } from '../../../connection';
import type { Alert } from '../../../protocol';
import { useIntl } from '../../../intl/setup';
import type { MessageKey } from '../../../intl/messages';
import { Button } from '../../../components/ui/button';
import './room-notices.css';
import { Notice } from '../../../components/ui/notice';
import { Status } from '../../../components/ui/status';
import { Tooltip } from '../../../components/ui/tooltip';

const CONNECTION_KEYS = {
  Connecting: 'status.connecting',
  Connected: 'status.connected',
  'Connection lost': 'status.lost',
  'Access removed': 'status.accessRemoved',
  'Room inactive': 'status.inactive',
  'Open in another tab': 'status.openElsewhere',
} as const satisfies Record<ConnectionStatus, MessageKey>;

const CONNECTION_CODES = {
  Connecting: 'connecting',
  Connected: 'connected',
  'Connection lost': 'lost',
  'Access removed': 'accessRemoved',
  'Room inactive': 'inactive',
  'Open in another tab': 'openElsewhere',
} as const satisfies Record<ConnectionStatus, string>;

export function ConnectionIndicator({
  connected,
  connection,
  parentAwake,
}: {
  connected: boolean;
  connection: ConnectionStatus;
  parentAwake: boolean;
}) {
  const t = useIntl();
  return (
    <div className="connection-indicator">
      <Tooltip label={t(CONNECTION_KEYS[connection])}>
        <Status
          tone={connected ? 'good' : 'warning'}
          data-testid="connection-status"
          data-status={CONNECTION_CODES[connection]}
        />
      </Tooltip>
      {parentAwake && (
        <Tooltip label={t('room.screenAwake')}>
          <span className="wake-status" data-testid="wake-status">
            <BrightIcon size={16} />
          </span>
        </Tooltip>
      )}
    </div>
  );
}

export function ConnectionNotice({ connection }: { connection: ConnectionStatus }) {
  const t = useIntl();
  const message =
    connection === 'Access removed'
      ? t('notice.accessRemoved')
      : connection === 'Open in another tab'
        ? t('notice.openElsewhere')
        : t('notice.connectionUnavailable');

  return (
    <Notice role="alert" data-testid="connection-notice" data-status={CONNECTION_CODES[connection]}>
      <ConnectionIcon size={20} />
      {message}
    </Notice>
  );
}

export function ErrorNotice({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  const t = useIntl();
  return (
    <Notice role="alert" data-testid="error-notice">
      <span>{error}</span>
      <Button
        variant="icon"
        data-testid="dismiss-error"
        aria-label={t('common.dismissError')}
        onClick={onDismiss}
      >
        <CloseIcon size={17} />
      </Button>
    </Notice>
  );
}

export function EventNotice({ event, onDismiss }: { event: Alert; onDismiss: () => void }) {
  const t = useIntl();
  const title =
    event.kind === 'noise'
      ? t('event.noise.title')
      : event.kind === 'paused'
        ? t('event.paused.title')
        : t('event.offline.title');
  const detail =
    event.kind === 'offline'
      ? t('event.offline.detail', { name: event.name })
      : event.kind === 'noise'
        ? t('event.noise.detail', { name: event.name })
        : t('event.paused.detail', { name: event.name });

  return (
    <Notice
      as="div"
      tone={event.kind === 'noise' ? 'sound' : 'alert'}
      role="alert"
      data-testid="event-notice"
      data-kind={event.kind}
    >
      <AlertActiveIcon size={20} />
      <span>
        <strong>{title}</strong>
        <br />
        {detail}
      </span>
      <Button
        variant="icon"
        data-testid="dismiss-notice"
        aria-label={t('notice.dismiss')}
        onClick={onDismiss}
      >
        <CloseIcon size={17} />
      </Button>
    </Notice>
  );
}
