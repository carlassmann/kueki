import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { BabyIcon, BackIcon, ForwardIcon, InviteLinkIcon, ParentIcon } from './icons';
import { InvitationScanner } from './InvitationScanner';
import { KuekiMascot } from './KuekiMascot';
import { request } from './connection';
import { errorMessage } from './format';
import { T, useIntl } from './intl/setup';
import type { Role, Session } from './protocol';
import { Button } from './components/ui/button';
import './Welcome.css';
import { Notice } from './components/ui/notice';
import { codeLook } from './components/ui/text';

function scrollFocusedFieldIntoView() {
  const field = document.activeElement;
  if (field instanceof HTMLInputElement)
    field.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// iOS Safari shrinks the visual viewport when the on-screen keyboard opens, but it leaves the
// focused field where it was, so it can end up hidden behind the keyboard. Re-centering on every
// viewport resize also covers the keyboard changing height (suggestion bar, emoji panel). The app
// shell resizes itself from the same event, so wait a frame for its new height before scrolling.
function useFieldVisibleAboveKeyboard() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const recenterAfterLayout = () => requestAnimationFrame(scrollFocusedFieldIntoView);
    viewport.addEventListener('resize', recenterAfterLayout);
    return () => viewport.removeEventListener('resize', recenterAfterLayout);
  }, []);
}

export function Welcome({
  onJoin,
  appMode = false,
}: {
  onJoin: (value: Session) => void;
  appMode?: boolean;
}) {
  const t = useIntl();
  useFieldVisibleAboveKeyboard();
  const route = useLocation();
  const navigate = useNavigate();
  const invited = new URLSearchParams(route.hash.replace(/^#/, '')).get('join') || '';
  const legacySetup = new URLSearchParams(route.searchStr).get('setup');
  const mode =
    invited || route.pathname === '/app/join' || legacySetup === 'join'
      ? 'join'
      : route.pathname === '/app/create' || legacySetup === 'create'
        ? 'create'
        : '';
  const [scanning, setScanning] = useState(false);
  const scanned = useCallback((code: string) => {
    setRoomKey(code);
    setScanning(false);
  }, []);
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [roomKey, setRoomKey] = useState(invited);
  const [roomName, setRoomName] = useState(() => t('welcome.defaultRoomName'));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await request('register', {
        name:
          name.trim() ||
          (role === 'baby' ? t('welcome.defaultBabyName') : t('welcome.defaultParentName')),
        role,
        ...(mode === 'join' ? { roomKey } : { roomName }),
      });
      onJoin(session);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={appMode ? 'welcome app-onboarding' : 'welcome'}>
      {!appMode && (
        <section className="welcome-art">
          <h1>
            <T
              k="welcome.hero"
              components={{
                br: () => <br />,
                em: ({ children }) => <em>{children}</em>,
              }}
            />
          </h1>
          <div className="mascot-wrap">
            <figure className="landing-mascot-state">
              <KuekiMascot className="landing-mascot" state="quiet" alt={t('welcome.mascotAlt')} />
              <figcaption>
                <T
                  k="welcome.mascotHint"
                  components={{
                    hint: ({ children }) => <span className="kueki-hover-hint">{children}</span>,
                  }}
                />
              </figcaption>
            </figure>
          </div>
        </section>
      )}
      <section className="welcome-content">
        {!mode ? (
          <>
            <h2>{appMode ? t('welcome.setupTitle') : t('welcome.title')}</h2>
            <p>{t('welcome.intro')}</p>
            <div className="welcome-actions">
              <Button
                variant="primary"
                data-testid="create-room"
                onClick={() => void navigate({ to: '/app/create' })}
              >
                {t('welcome.createRoom')} <ForwardIcon size={18} />
              </Button>
              <Button
                variant="secondary"
                data-testid="join-room"
                onClick={() => void navigate({ to: '/app/join' })}
              >
                {t('welcome.joinRoom')} <InviteLinkIcon size={18} />
              </Button>
            </div>
            {!appMode && (
              <section className="steps">
                <h3>{t('welcome.stepsTitle')}</h3>
                <ol>
                  <li>{t('welcome.stepCreate')}</li>
                  <li>{t('welcome.stepInvite')}</li>
                  <li>{t('welcome.stepListen')}</li>
                </ol>
              </section>
            )}
          </>
        ) : (
          <form onSubmit={submit} className="setup">
            <Button
              variant="quiet"
              className="back"
              data-testid="back"
              onClick={() => void navigate({ to: '/app', hash: '', search: {} })}
            >
              <BackIcon size={16} /> {t('welcome.back')}
            </Button>
            <h2>{mode === 'join' ? t('welcome.joinRoom') : t('welcome.createRoom')}</h2>
            <p>{mode === 'join' ? t('welcome.joinIntro') : t('welcome.createIntro')}</p>
            {mode === 'join' ? (
              <>
                <label>
                  {t('welcome.invitationCode')}
                  <input
                    required
                    data-testid="invitation-code"
                    {...codeLook}
                    onFocus={scrollFocusedFieldIntoView}
                    value={roomKey}
                    onChange={(e) => setRoomKey(e.target.value)}
                    placeholder={t('welcome.invitationPlaceholder')}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
                <Button
                  variant="secondary"
                  full
                  data-testid="scan-qr"
                  onClick={() => setScanning(true)}
                >
                  {t('welcome.scanQr')}
                </Button>
                {scanning && (
                  <InvitationScanner onScan={scanned} close={() => setScanning(false)} />
                )}
              </>
            ) : (
              <label>
                {t('welcome.roomName')}
                <input
                  required
                  maxLength={40}
                  data-testid="room-name"
                  onFocus={scrollFocusedFieldIntoView}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </label>
            )}
            <fieldset>
              <legend>{t('welcome.roleLegend')}</legend>
              <div className="role-picker">
                <button
                  type="button"
                  data-testid="role-baby"
                  aria-pressed={role === 'baby'}
                  onClick={() => setRole('baby')}
                >
                  <BabyIcon size={24} />
                  <strong>{t('welcome.roleBaby')}</strong>
                  <span>{t('welcome.roleBabyDetail')}</span>
                </button>
                <button
                  type="button"
                  data-testid="role-parent"
                  aria-pressed={role === 'parent'}
                  onClick={() => setRole('parent')}
                >
                  <ParentIcon size={24} />
                  <strong>{t('welcome.roleParent')}</strong>
                  <span>{t('welcome.roleParentDetail')}</span>
                </button>
              </div>
            </fieldset>
            <label>
              {t('welcome.deviceName')}
              <input
                maxLength={40}
                data-testid="device-name"
                onFocus={scrollFocusedFieldIntoView}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  role === 'baby' ? t('welcome.deviceNameBaby') : t('welcome.deviceNameParent')
                }
              />
            </label>
            {error && (
              <Notice role="alert" data-testid="form-error">
                {error}
              </Notice>
            )}
            <Button
              variant="primary"
              full
              type="submit"
              data-testid="submit-room"
              disabled={busy || (mode === 'join' && !roomKey.trim())}
            >
              {busy
                ? t('welcome.submitting')
                : mode === 'join'
                  ? t('welcome.submitJoin')
                  : t('welcome.submitCreate')}
              <ForwardIcon size={18} />
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
