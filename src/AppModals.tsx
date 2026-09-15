import { useId, useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { CheckIcon, ExpandIcon } from './icons';
import type { Session } from './protocol';
import { Dialog } from './components/ui/dialog';
import { useIntl } from './intl/setup';
import { Button } from './components/ui/button';
import './AppModals.css';
import { Notice } from './components/ui/notice';

export function InvitationModal({
  currentRoom,
  error,
  joining,
  onConfirm,
  onDismiss,
}: {
  currentRoom: string;
  error: string;
  joining: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const t = useIntl();
  return (
    <Dialog
      title={t('invite.openTitle')}
      testId="invitation-modal"
      close={() => !joining && onDismiss()}
    >
      <p>{t('invite.switchBody', { room: currentRoom })}</p>
      <Button
        variant="primary"
        full
        data-testid="invitation-confirm"
        data-busy={joining}
        disabled={joining}
        onClick={onConfirm}
      >
        {joining ? t('invite.switching') : t('invite.switchAndJoin')}
      </Button>
      <Button
        variant="secondary"
        full
        data-testid="invitation-keep"
        disabled={joining}
        onClick={onDismiss}
      >
        {t('invite.keep')}
      </Button>
      {error && <Notice role="alert">{error}</Notice>}
    </Dialog>
  );
}

export function RoomsPopover({
  activeDeviceId,
  align,
  error,
  rooms,
  switching,
  onActivate,
  onAdd,
  onForget,
  onOpen,
}: {
  activeDeviceId?: string;
  align: 'start' | 'end';
  error: string;
  rooms: Session[];
  switching: boolean;
  onActivate: (room: Session) => Promise<void>;
  onAdd: (path: '/app/create' | '/app/join') => Promise<void>;
  onForget: (room: Session) => void;
  onOpen: () => void;
}) {
  const t = useIntl();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  async function activate(room: Session) {
    try {
      await onActivate(room);
      setOpen(false);
    } catch {}
  }

  async function add(path: '/app/create' | '/app/join') {
    try {
      await onAdd(path);
      setOpen(false);
    } catch {}
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (switching) return;
        if (nextOpen) onOpen();
        setOpen(nextOpen);
      }}
    >
      <Popover.Trigger
        className="room-switcher"
        data-testid="room-switcher"
        aria-label={t('rooms.switchLabel')}
      >
        <span>
          {rooms.find((room) => room.deviceId === activeDeviceId)?.roomName || t('rooms.saved')}
        </span>
        <ExpandIcon size={18} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align={align} sideOffset={8} collisionPadding={16}>
          <Popover.Popup className="rooms-popover" aria-labelledby={titleId}>
            <h2 id={titleId}>{t('rooms.title')}</h2>
            <p>{t('rooms.subtitle')}</p>
            <div className="saved-rooms">
              {rooms.map((room) => (
                <div className="saved-room" key={room.roomId}>
                  <Button
                    variant="secondary"
                    full
                    data-testid="room-option"
                    data-room-id={room.roomId}
                    data-room-name={room.roomName}
                    data-device-id={room.deviceId}
                    data-device-name={room.name}
                    data-active={room.deviceId === activeDeviceId}
                    disabled={switching}
                    onClick={() => void activate(room)}
                  >
                    <span>
                      {room.roomName}
                      <small>
                        {room.name} · {room.role === 'baby' ? t('role.baby') : t('role.parent')}
                      </small>
                    </span>
                    {room.deviceId === activeDeviceId && <CheckIcon size={18} weight="bold" />}
                  </Button>
                  {room.deviceId !== activeDeviceId && (
                    <Button
                      variant="quiet"
                      size="small"
                      data-testid="forget-room"
                      data-room-name={room.roomName}
                      disabled={switching}
                      aria-label={t('rooms.forgetLabel', { room: room.roomName })}
                      onClick={() => onForget(room)}
                    >
                      {t('rooms.forget')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="rooms-popover-actions">
              <Button
                variant="primary"
                data-testid="create-room-popover"
                disabled={switching}
                onClick={() => void add('/app/create')}
              >
                {t('welcome.createRoom')}
              </Button>
              <Button
                variant="secondary"
                data-testid="join-room-popover"
                disabled={switching}
                onClick={() => void add('/app/join')}
              >
                {t('welcome.joinRoom')}
              </Button>
            </div>
            {error && (
              <Notice role="alert" data-testid="rooms-error">
                {error}
              </Notice>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ForgetRoomConfirmation({
  room,
  onCancel,
  onConfirm,
}: {
  room: Session;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useIntl();
  return (
    <Dialog
      title={t('forgetRoom.title', { room: room.roomName })}
      testId="forget-room-dialog"
      close={onCancel}
    >
      <p>{t('forgetRoom.body', { room: room.roomName })}</p>
      <Button
        variant="primary"
        full
        tone="danger"
        data-testid="confirm-forget-room"
        onClick={onConfirm}
      >
        {t('forgetRoom.confirm', { room: room.roomName })}
      </Button>
      <Button variant="secondary" full data-testid="keep-room" onClick={onCancel}>
        {t('forgetRoom.keep')}
      </Button>
    </Dialog>
  );
}

export function PrivacyModal({ onClose }: { onClose: () => void }) {
  const t = useIntl();
  return (
    <Dialog title={t('privacy.title')} testId="privacy-modal" close={onClose}>
      <PrivacyContent />
    </Dialog>
  );
}

function PrivacyContent() {
  const t = useIntl();
  return (
    <>
      <p>{t('privacy.paragraph1')}</p>
      <p>{t('privacy.paragraph2')}</p>
      <div className="project-links">
        <a
          href="https://github.com/carlassmann/kueki"
          target="_blank"
          rel="noreferrer"
          data-testid="source-code"
        >
          {t('privacy.source')}
        </a>
        <a href="https://carlassmann.com" target="_blank" rel="noreferrer">
          carlassmann.com
        </a>
      </div>
    </>
  );
}
