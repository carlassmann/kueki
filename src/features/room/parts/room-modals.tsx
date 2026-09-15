import { useState } from 'react';
import {
  CheckIcon,
  CopyIcon,
  DeviceIcon,
  DisclosureIcon,
  ForwardIcon,
  InviteLinkIcon,
} from '../../../icons';
import { request } from '../../../connection';
import { InvitationQr } from '../../../InvitationQr';
import { Dialog } from '../../../components/ui/dialog';
import type { PublicDevice, Session } from '../../../protocol';
import { useIntl } from '../../../intl/setup';
import { RenameField } from './room-components';
import { Button } from '../../../components/ui/button';
import './room-modals.css';
import { Caption, codeLook } from '../../../components/ui/text';
import { Notice } from '../../../components/ui/notice';

/** A failing action reports its own message: the room notice would sit behind the dialog backdrop. */
type DialogAction = () => Promise<string>;

function useDialogError() {
  const [error, setError] = useState('');
  return {
    error,
    run: (action: DialogAction) => void action().then(setError),
  };
}

function DialogError({ error }: { error: string }) {
  if (!error) return null;
  return (
    <Notice role="alert" data-testid="dialog-error">
      {error}
    </Notice>
  );
}

export function InvitationModal({
  accessNotice,
  busy,
  connected,
  copied,
  invitation,
  isBaby,
  onClose,
  onCopy,
  onReset,
}: {
  accessNotice: string;
  busy: boolean;
  connected: boolean;
  copied: string;
  invitation: string;
  isBaby: boolean;
  onClose: () => void;
  onCopy: (value: string, label: string) => Promise<string>;
  onReset: DialogAction;
}) {
  const t = useIntl();
  const { error, run } = useDialogError();
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (confirmingReset) {
    return (
      <ResetInvitationConfirmation
        busy={busy}
        onCancel={() => setConfirmingReset(false)}
        onConfirm={() => {
          run(onReset);
          setConfirmingReset(false);
        }}
      />
    );
  }

  return (
    <Dialog title={t('roomInvite.title')} testId="invite-dialog" close={onClose}>
      <p>{t('roomInvite.body')}</p>
      <InvitationQr key={invitation} code={invitation} />
      <label>
        {t('roomInvite.codeLabel')}
        <input
          {...codeLook}
          data-testid="invite-code"
          readOnly
          value={invitation}
          onFocus={(event) => event.target.select()}
        />
      </label>
      <Caption>{t('roomInvite.shareHint')}</Caption>
      <div className="invite-actions">
        <Button
          variant="primary"
          full
          data-testid="copy-invite-link"
          onClick={() =>
            run(() => onCopy(`${location.origin}/app/join#join=${invitation}`, 'link'))
          }
        >
          {copied === 'link' ? <CheckIcon size={18} weight="bold" /> : <InviteLinkIcon size={18} />}{' '}
          {copied === 'link' ? t('roomInvite.linkCopied') : t('roomInvite.copyLink')}
        </Button>
        <Button
          variant="secondary"
          full
          data-testid="copy-invite-code"
          onClick={() => run(() => onCopy(invitation, 'code'))}
        >
          <CopyIcon size={17} />
          {copied === 'code' ? t('roomInvite.codeCopied') : t('roomInvite.copyCode')}
        </Button>
      </div>
      <DialogError error={error} />
      {!isBaby && (
        <Button
          variant="secondary"
          full
          className="reset-invitation"
          data-testid="reset-invitation"
          disabled={busy || !connected}
          onClick={() => setConfirmingReset(true)}
        >
          {t('roomInvite.reset')}
        </Button>
      )}
      {accessNotice && <Caption role="status">{accessNotice}</Caption>}
    </Dialog>
  );
}

function ResetInvitationConfirmation({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useIntl();
  return (
    <Dialog title={t('resetInvitation.title')} testId="reset-invitation-dialog" close={onCancel}>
      <p>{t('resetInvitation.body')}</p>
      <Button
        variant="primary"
        full
        tone="danger"
        data-testid="confirm-reset-invitation"
        disabled={busy}
        onClick={onConfirm}
      >
        {t('resetInvitation.confirm')}
      </Button>
      <Button variant="secondary" full data-testid="keep-invitation" onClick={onCancel}>
        {t('resetInvitation.keep')}
      </Button>
    </Dialog>
  );
}

export function DeviceSettingsModal({
  busy,
  session,
  onChangeRole,
  onClose,
  onLeave,
}: {
  busy: boolean;
  session: Session;
  onChangeRole: DialogAction;
  onClose: () => void;
  onLeave: DialogAction;
}) {
  const t = useIntl();
  const { error, run } = useDialogError();
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const isBaby = session.role === 'baby';

  if (confirmingLeave) {
    return (
      <LeaveRoomConfirmation
        busy={busy}
        onCancel={() => setConfirmingLeave(false)}
        onConfirm={onLeave}
      />
    );
  }

  return (
    <Dialog title={t('deviceSettings.title')} testId="device-settings-dialog" close={onClose}>
      <div className="setting-detail">
        <DeviceIcon size={24} />
        <div>
          <strong>{session.name}</strong>
          <p>{isBaby ? t('settings.deviceTypeBaby') : t('settings.deviceTypeParent')}</p>
        </div>
      </div>
      <RenameField
        label={t('deviceSettings.name')}
        testId="rename-own-device"
        value={session.name}
        onSave={(name) => request('rename-device', { ...session, name })}
      />
      <Button
        variant="secondary"
        full
        data-testid="switch-role"
        disabled={busy}
        onClick={() => run(onChangeRole)}
      >
        {isBaby ? t('deviceSettings.switchToParent') : t('deviceSettings.switchToBaby')}
        <DisclosureIcon size={17} />
      </Button>
      <DialogError error={error} />
      <Caption>{t('deviceSettings.switchHint')}</Caption>
      <hr />
      <Button
        variant="quiet"
        tone="danger"
        data-testid="leave-room"
        disabled={busy}
        onClick={() => setConfirmingLeave(true)}
      >
        {t('deviceSettings.leave')} <ForwardIcon size={16} />
      </Button>
      <Caption>{t('deviceSettings.leaveHint')}</Caption>
    </Dialog>
  );
}

export function LeaveRoomConfirmation({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: DialogAction;
}) {
  const t = useIntl();
  const { error, run } = useDialogError();
  return (
    <Dialog title={t('leaveRoom.title')} testId="leave-room-dialog" close={onCancel}>
      <p>{t('leaveRoom.body')}</p>
      <Button
        variant="primary"
        full
        tone="danger"
        data-testid="confirm-leave-room"
        disabled={busy}
        onClick={() => run(onConfirm)}
      >
        {t('leaveRoom.confirm')}
      </Button>
      <Button variant="secondary" full data-testid="stay-in-room" onClick={onCancel}>
        {t('leaveRoom.stay')}
      </Button>
      <DialogError error={error} />
    </Dialog>
  );
}

export function RemoveDeviceConfirmation({
  device,
  busy,
  onCancel,
  onConfirm,
}: {
  device: PublicDevice;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useIntl();
  return (
    <Dialog
      title={t('removeDevice.title', { name: device.name })}
      testId="remove-device-dialog"
      close={onCancel}
    >
      <p>{t('removeDevice.body', { name: device.name })}</p>
      <Button
        variant="primary"
        full
        tone="danger"
        data-testid="confirm-remove-device"
        disabled={busy}
        onClick={onConfirm}
      >
        {t('removeDevice.confirm', { name: device.name })}
      </Button>
      <Button variant="secondary" full data-testid="keep-device" onClick={onCancel}>
        {t('removeDevice.keep')}
      </Button>
    </Dialog>
  );
}
