import {
  AlertIcon,
  BabyIcon,
  CheckIcon,
  DeviceIcon,
  DisclosureIcon,
  ParentIcon,
  type IconComponent,
} from '../../../icons';
import { useState, type ReactNode } from 'react';
import { request } from '../../../connection';
import { ROOM_SETTING_CHOICES, type PublicDevice } from '../../../protocol';
import { RenameField } from '../parts/room-components';
import { RemoveDeviceConfirmation } from '../parts/room-modals';
import { useRoom } from '../room-context';
import { useIntl } from '../../../intl/setup';
import { durationText } from '../../../format';
import { LanguageSelect } from '../../../LanguageSelect';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { InstallRequiredCard } from '../../../InstallGuide';
import './settings-screen.css';

export function SettingsScreen() {
  const t = useIntl();
  const room = useRoom();

  return (
    <div className="settings">
      {!room.isBaby && (
        <SettingsGroup title={t('settings.room')}>
          <li className="settings-row settings-row-field">
            <RenameField
              label={t('settings.roomName')}
              testId="rename-room"
              value={room.session.roomName}
              onSave={(name) => request('rename-room', { ...room.session, name })}
            />
          </li>
        </SettingsGroup>
      )}
      <AlertSettings room={room} />
      <RoomDevices room={room} />
      {room.isBaby ? <BabySetup /> : <NotificationSetup room={room} />}
      <SettingsGroup title={t('language.title')}>
        <li className="settings-row">
          <span className="settings-row-label">{t('language.label')}</span>
          <LanguageSelect showLabel={false} />
        </li>
      </SettingsGroup>
      <SettingsGroup title={t('settings.thisDevice')}>
        <SettingsLinkRow
          icon={DeviceIcon}
          label={t('settings.manageDevice')}
          testId="manage-device"
          onClick={room.openSettings}
        />
        {room.preferences}
      </SettingsGroup>
    </div>
  );
}

const ALERT_SETTINGS = [
  ['alertAfterMs', 'alerts.alertAfter', 'alerts.alertAfterHint'],
  ['cooldownMs', 'alerts.cooldown', 'alerts.cooldownHint'],
  ['offlineAlertMs', 'alerts.offlineAlert', 'alerts.offlineAlertHint'],
  ['retentionMs', 'alerts.retention', 'alerts.retentionHint'],
] as const;

function AlertSettings({ room }: { room: ReturnType<typeof useRoom> }) {
  const t = useIntl();

  if (room.isBaby) return null;

  return (
    <SettingsGroup title={t('alerts.title')}>
      {ALERT_SETTINGS.map(([key, label, hint]) => (
        <li className="settings-row settings-row-choice" key={key}>
          <div className="settings-row-text">
            <strong>{t(label)}</strong>
            <span>{t(hint)}</span>
          </div>
          <Select
            data-testid={`alert-${key}`}
            aria-label={t(label)}
            value={room.settings[key]}
            disabled={room.busy || !room.connected}
            onChange={(event) =>
              void room.changeRoomSettings({ [key]: Number(event.target.value) })
            }
          >
            {ROOM_SETTING_CHOICES[key].map((choice) => (
              <option value={choice} key={choice}>
                {durationText(choice)}
              </option>
            ))}
          </Select>
        </li>
      ))}
    </SettingsGroup>
  );
}

function SettingsGroup({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="settings-group">
      <h3 className="settings-group-title">{title}</h3>
      <ul className="settings-list">{children}</ul>
      {footer && <p className="settings-group-footer">{footer}</p>}
    </section>
  );
}

export function SettingsLinkRow({
  icon: Icon,
  label,
  testId,
  onClick,
}: {
  icon: IconComponent;
  label: string;
  testId: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className="settings-link" data-testid={testId} onClick={onClick}>
        <span className="card-icon">
          <Icon size={19} />
        </span>
        <span>{label}</span>
        <DisclosureIcon size={18} />
      </button>
    </li>
  );
}

function RoomDevices({ room }: { room: ReturnType<typeof useRoom> }) {
  const t = useIntl();
  const [pendingRemoval, setPendingRemoval] = useState<PublicDevice | null>(null);
  const otherDevices = room.devices.filter((device) => device.id !== room.session.deviceId);

  if (otherDevices.length === 0 && !room.accessNotice) return null;

  return (
    <SettingsGroup
      title={t('settings.devicesTitle')}
      footer={
        room.accessNotice ? (
          <span role="status">{room.accessNotice}</span>
        ) : (
          t('settings.devicesHint')
        )
      }
    >
      {otherDevices.map((device) => (
        <DeviceRow
          key={device.id}
          device={device}
          room={room}
          onRemove={() => setPendingRemoval(device)}
        />
      ))}
      {pendingRemoval && (
        <RemoveDeviceConfirmation
          device={pendingRemoval}
          busy={room.busy}
          onCancel={() => setPendingRemoval(null)}
          onConfirm={() => {
            room.removeDevice(pendingRemoval.id);
            setPendingRemoval(null);
          }}
        />
      )}
    </SettingsGroup>
  );
}

function DeviceRow({
  device,
  room,
  onRemove,
}: {
  device: PublicDevice;
  room: ReturnType<typeof useRoom>;
  onRemove: () => void;
}) {
  const t = useIntl();
  const [renaming, setRenaming] = useState(false);

  if (renaming) {
    return (
      <li className="settings-row settings-row-field">
        <RenameField
          label={t('settings.deviceNameFor', { name: device.name })}
          testId="rename-device"
          value={device.name}
          onSave={async (name) => {
            await request('rename-device', { ...room.session, name, target: device.id });
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      </li>
    );
  }

  return (
    <li
      className="settings-row device-row"
      data-testid="device-row"
      data-device-id={device.id}
      data-device-name={device.name}
    >
      <span className="card-icon">
        {device.role === 'baby' ? <BabyIcon size={19} /> : <ParentIcon size={19} />}
      </span>
      <div className="settings-row-text">
        <strong>{device.name}</strong>
        <span>
          {device.role === 'baby' ? t('role.baby') : t('role.parent')} ·{' '}
          {device.online ? t('settings.deviceOnline') : t('settings.deviceOffline')}
        </span>
      </div>
      <div className="device-row-actions">
        <Button
          variant="quiet"
          size="small"
          data-testid="device-rename"
          disabled={!room.connected}
          onClick={() => setRenaming(true)}
          aria-label={t('settings.renameLabel', { name: device.name })}
        >
          {t('settings.rename')}
        </Button>
        <Button
          variant="quiet"
          size="small"
          tone="danger"
          data-testid="device-remove"
          disabled={room.busy || !room.connected}
          onClick={onRemove}
          aria-label={t('settings.removeLabel', { name: device.name })}
        >
          {t('settings.remove')}
        </Button>
      </div>
    </li>
  );
}

function BabySetup() {
  const t = useIntl();
  return (
    <SettingsGroup title={t('settings.deviceSetup')} footer={t('settings.babyKeepPlugged')}>
      <li className="settings-row">
        <ul className="check-list">
          <li>
            <CheckIcon size={17} weight="bold" /> {t('settings.babyCheckAnalyzed')}
          </li>
          <li>
            <CheckIcon size={17} weight="bold" /> {t('settings.babyCheckNoSave')}
          </li>
          <li>
            <CheckIcon size={17} weight="bold" /> {t('settings.babyCheckListen')}
          </li>
        </ul>
      </li>
    </SettingsGroup>
  );
}

function NotificationSetup({ room }: { room: ReturnType<typeof useRoom> }) {
  const t = useIntl();
  return (
    <SettingsGroup
      title={t('settings.notifications')}
      footer={
        room.pushTestMessage ? (
          <span role="status">{room.pushTestMessage}</span>
        ) : (
          t('settings.notificationsHint')
        )
      }
    >
      {room.installRequired && !room.pushEnabled ? (
        <li className="settings-row settings-row-stack">
          <InstallRequiredCard onShowGuide={room.openInstallGuide}>
            {t('pwa.notificationsNeedInstall')}
          </InstallRequiredCard>
        </li>
      ) : room.pushEnabled ? (
        <li className="settings-row">
          <span className="card-icon">
            <AlertIcon size={19} />
          </span>
          <div className="settings-row-text">
            <strong>{t('settings.notificationsEnabled')}</strong>
            <span>{t('settings.notificationsBody')}</span>
          </div>
          <CheckIcon size={20} weight="bold" className="settings-row-check" />
        </li>
      ) : (
        <li className="settings-row settings-row-stack">
          <p>{t('settings.notificationsBody')}</p>
          <Button
            variant="primary"
            size="small"
            full
            data-testid="enable-notifications"
            disabled={room.busy || !room.connected}
            onClick={() => void room.enableNotifications()}
          >
            <AlertIcon size={17} /> {t('settings.notificationsEnable')}
          </Button>
        </li>
      )}
      {room.pushEnabled && (
        <li>
          <button
            type="button"
            className="settings-link"
            data-testid="test-notification"
            disabled={room.busy}
            onClick={() => void room.testNotification()}
          >
            <span>{t('settings.notificationsTest')}</span>
            <DisclosureIcon size={18} />
          </button>
        </li>
      )}
    </SettingsGroup>
  );
}
