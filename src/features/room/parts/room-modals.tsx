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
  onCopy: (value: string, label: string) => void;
  onReset: () => void;
}) {
  const t = useIntl();
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
      <div className="invite-actions">
        <Button
          variant="primary"
          full
          data-testid="copy-invite-link"
          onClick={() => onCopy(`${location.origin}/app/join#join=${invitation}`, 'link')}
        >
          {copied === 'link' ? <CheckIcon size={18} weight="bold" /> : <InviteLinkIcon size={18} />}{' '}
          {copied === 'link' ? t('roomInvite.linkCopied') : t('roomInvite.copyLink')}
        </Button>
        <Button
          variant="secondary"
          full
          data-testid="copy-invite-code"
          onClick={() => onCopy(invitation, 'code')}
        >
          <CopyIcon size={17} />
          {copied === 'code' ? t('roomInvite.codeCopied') : t('roomInvite.copyCode')}
        </Button>
      </div>
      <Caption>{t('roomInvite.shareHint')}</Caption>
      {!isBaby && (
        <Button
          variant="secondary"
          full
          data-testid="reset-invitation"
          disabled={busy || !connected}
          onClick={onReset}
        >
          {t('roomInvite.reset')}
        </Button>
      )}
      {accessNotice && <Caption role="status">{accessNotice}</Caption>}
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
  onChangeRole: () => void;
  onClose: () => void;
  onLeave: () => void;
}) {
  const t = useIntl();
  const isBaby = session.role === 'baby';

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
        onClick={onChangeRole}
      >
        {isBaby ? t('deviceSettings.switchToParent') : t('deviceSettings.switchToBaby')}
        <DisclosureIcon size={17} />
      </Button>
      <Caption>{t('deviceSettings.switchHint')}</Caption>
      <hr />
      <Button
        variant="quiet"
        tone="danger"
        data-testid="leave-room"
        disabled={busy}
        onClick={onLeave}
      >
        {t('deviceSettings.leave')} <ForwardIcon size={16} />
      </Button>
      <Caption>{t('deviceSettings.leaveHint')}</Caption>
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
