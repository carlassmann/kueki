import { useState } from 'react';
import { Dialog } from '../../../components/ui/dialog';
import { Notice } from '../../../components/ui/notice';
import { durationText, errorMessage, eventDay, eventTime } from '../../../format';
import { ConnectionIcon, SoundIcon } from '../../../icons';
import { useRoom } from '../room-context';
import { T, useIntl, useLocale } from '../../../intl/setup';
import { Button } from '../../../components/ui/button';
import './activity-screen.css';
import { Caption } from '../../../components/ui/text';
import { KuekiMascot } from '../../../KuekiMascot';

export function ActivityScreen() {
  const t = useIntl();
  const locale = useLocale();
  const { events, isBaby, clearEvents, settings, connected } = useRoom();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  async function confirmClear() {
    setClearing(true);
    setError('');
    try {
      await clearEvents();
      setConfirming(false);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setClearing(false);
    }
  }

  return (
    <section className="activity">
      <div className="section-heading">
        <div>
          <h2>{t('activity.title')}</h2>
          <Caption as="span" data-testid="activity-window">
            {settings.retentionMs === 86_400_000
              ? t('activity.last24h')
              : t('activity.window', { duration: durationText(settings.retentionMs) })}
          </Caption>
        </div>
        {!isBaby && events.length > 0 && (
          <Button
            variant="quiet"
            size="small"
            data-testid="clear-activity"
            disabled={!connected}
            onClick={() => {
              setError('');
              setConfirming(true);
            }}
          >
            {t('activity.clear')}
          </Button>
        )}
      </div>
      {events.length ? (
        <div className="event-list side-card">
          {events.map((event) => (
            <div
              className="event"
              key={event.id}
              data-testid="activity-event"
              data-kind={event.kind}
              data-device-name={event.name}
            >
              <span className={`event-icon ${event.kind !== 'noise' ? 'warning' : ''}`}>
                {event.kind === 'noise' ? <SoundIcon size={17} /> : <ConnectionIcon size={17} />}
              </span>
              <div>
                <strong>
                  {event.kind === 'noise'
                    ? t('activity.noise')
                    : event.kind === 'paused'
                      ? t('activity.paused')
                      : t('activity.offline')}
                </strong>
                <span>{event.name}</span>
              </div>
              <time dateTime={new Date(event.at).toISOString()}>
                <span className="event-date">{eventDay(event.at, locale)}</span>
                {eventTime(event.at, locale)}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-events" data-testid="activity-empty">
          <KuekiMascot className="empty-events-mascot" state="quiet" alt="" />
          <p>
            <T k="activity.empty" components={{ br: () => <br /> }} />
          </p>
        </div>
      )}
      {confirming && (
        <Dialog
          title={t('activity.clearTitle')}
          testId="clear-activity-dialog"
          close={() => {
            if (!clearing) setConfirming(false);
          }}
        >
          <p>{t('activity.clearBody')}</p>
          {error && <Notice role="alert">{error}</Notice>}
          <Button
            variant="primary"
            full
            tone="danger"
            data-testid="confirm-clear-activity"
            disabled={clearing || !connected}
            onClick={() => void confirmClear()}
          >
            {t('activity.clear')}
          </Button>
          <Button
            variant="secondary"
            full
            data-testid="keep-activity"
            disabled={clearing}
            onClick={() => setConfirming(false)}
          >
            {t('activity.keep')}
          </Button>
        </Dialog>
      )}
    </section>
  );
}
