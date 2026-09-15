import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { AddIcon, ParentIcon, SettingsIcon, SoundIcon } from '../../../icons';
import { useIntl } from '../../../intl/setup';
import { Button } from '../../../components/ui/button';
import './room-header.css';

const ROOM_NAVIGATION = [
  ['/app', 'nav-monitor', 'nav.monitor', ParentIcon],
  ['/app/activity', 'nav-activity', 'nav.activity', SoundIcon],
  ['/app/settings', 'nav-settings', 'nav.settings', SettingsIcon],
] as const;

export function RoomHeader({
  roomName,
  roomSwitcher,
  onInvite,
  indicator,
}: {
  roomName: string;
  roomSwitcher: ReactNode;
  onInvite: () => void;
  indicator: ReactNode;
}) {
  const t = useIntl();
  return (
    <header className="room-header">
      <Link to="/app" className="room-brand" aria-label={t('app.roomHomeLabel')}>
        <img src="/icon.svg" alt="" />
      </Link>
      <h1 data-testid="room-title" data-room-name={roomName} aria-label={roomName}>
        {roomSwitcher}
      </h1>
      <nav className="room-navigation" aria-label={t('nav.roomLabel')}>
        {ROOM_NAVIGATION.map(([to, testId, label, Icon]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} data-testid={testId}>
            <Icon size={19} />
            {/* The label is repeated as a data attribute so CSS can reserve its
                bold width and keep the item from resizing when it turns active. */}
            <span data-label={t(label)}>{t(label)}</span>
          </Link>
        ))}
      </nav>
      <div className="room-tools">
        {indicator}
        <Button
          variant="secondary"
          size="small"
          className="invite-device-button"
          data-testid="invite-device"
          aria-label={t('room.inviteDevice')}
          onClick={onInvite}
        >
          <AddIcon size={18} weight="bold" />
          <span className="invite-device-label">{t('room.inviteDevice')}</span>
        </Button>
      </div>
    </header>
  );
}
