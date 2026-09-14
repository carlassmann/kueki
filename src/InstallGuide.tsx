import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AddToHomeIcon, BrowserMenuIcon, CheckIcon, ShareIcon, type IconComponent } from './icons';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';
import { useIntl } from './intl/setup';
import { isAndroid, isIOS, isMobile } from './platform';
import type { usePwa } from './pwa';
import './InstallGuide.css';

const NUDGE_DISMISSED_KEY = 'kueki-install-nudge-dismissed';
const NUDGE_SEEN_KEY = 'kueki-install-nudge-seen';
const NUDGE_DELAY_MS = 2600;
const NUDGE_DURATION_MS = 14_000;

export function InstallGuideDialog({ pwa }: { pwa: ReturnType<typeof usePwa> }) {
  const t = useIntl();
  const steps = installSteps();
  const promptable = pwa.canInstall && !isIOS();
  return (
    <Dialog title={t('pwa.installTitle')} testId="install-guide" close={pwa.closeInstallGuide}>
      <p>{t('pwa.installWhy')}</p>
      {promptable ? (
        <p className="install-intro">{t('pwa.androidStepPrompt')}</p>
      ) : (
        <>
          <p className="install-intro">{t('pwa.installStepsIntro')}</p>
          <ol className="install-steps">
            {steps.map(({ key, icon: Icon, message }) => (
              <li key={key}>
                <span className="install-step-icon">
                  <Icon size={18} />
                </span>
                <span>{t(message)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      {promptable && (
        <Button variant="primary" full data-testid="install-app" onClick={() => void pwa.install()}>
          {t('pwa.installAction')}
        </Button>
      )}
      {isIOS() && <p className="install-note">{t('pwa.iosNote')}</p>}
      {!promptable && (
        <Button
          variant="secondary"
          full
          data-testid="install-guide-done"
          onClick={pwa.closeInstallGuide}
        >
          <CheckIcon size={17} /> {t('pwa.installDone')}
        </Button>
      )}
    </Dialog>
  );
}

export function InstallRequiredCard({
  onShowGuide,
  children,
}: {
  onShowGuide: () => void;
  children: ReactNode;
}) {
  const t = useIntl();
  return (
    <div className="install-required">
      <p>{children}</p>
      <Button
        variant="primary"
        size="small"
        full
        data-testid="open-install-guide"
        onClick={onShowGuide}
      >
        <AddToHomeIcon size={17} /> {t('pwa.notificationsInstallAction')}
      </Button>
    </div>
  );
}

export function useInstallNudge(pwa: ReturnType<typeof usePwa>, paused: boolean) {
  const t = useIntl();
  const [dismissed, setDismissed] = useState(nudgeDismissed);
  const wanted = isMobile() && !pwa.installed && !dismissed && !paused;
  useEffect(() => {
    if (!wanted || sessionStorage.getItem(NUDGE_SEEN_KEY)) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(NUDGE_SEEN_KEY, 'true');
      toast(
        <div className="install-nudge">
          <strong>{t('pwa.installTitle')}</strong>
          <span>{t('pwa.installNudge')}</span>
          <div className="install-nudge-actions">
            <Button
              variant="primary"
              size="small"
              data-testid="install-nudge-show"
              onClick={() => {
                toast.dismiss('kueki-install');
                pwa.openInstallGuide();
              }}
            >
              {t('pwa.installShowMe')}
            </Button>
            <Button
              variant="quiet"
              size="small"
              data-testid="install-nudge-later"
              onClick={() => {
                toast.dismiss('kueki-install');
                rememberNudgeDismissed();
                setDismissed(true);
              }}
            >
              {t('pwa.installLater')}
            </Button>
          </div>
        </div>,
        { id: 'kueki-install', duration: NUDGE_DURATION_MS },
      );
    }, NUDGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [wanted, pwa.openInstallGuide, t]);
  useEffect(() => {
    if (pwa.installed) toast.dismiss('kueki-install');
  }, [pwa.installed]);
}

function installSteps(): { key: string; icon: IconComponent; message: InstallStepMessage }[] {
  if (isIOS())
    return [
      { key: 'share', icon: ShareIcon, message: 'pwa.iosStepShare' },
      { key: 'add', icon: AddToHomeIcon, message: 'pwa.iosStepAdd' },
      { key: 'open', icon: CheckIcon, message: 'pwa.iosStepOpen' },
    ];
  if (isAndroid())
    return [
      { key: 'menu', icon: BrowserMenuIcon, message: 'pwa.androidStepMenu' },
      { key: 'add', icon: AddToHomeIcon, message: 'pwa.androidStepAdd' },
      { key: 'open', icon: CheckIcon, message: 'pwa.androidStepOpen' },
    ];
  return [
    { key: 'menu', icon: BrowserMenuIcon, message: 'pwa.genericStepMenu' },
    { key: 'add', icon: AddToHomeIcon, message: 'pwa.genericStepAdd' },
    { key: 'open', icon: CheckIcon, message: 'pwa.genericStepOpen' },
  ];
}

type InstallStepMessage =
  | 'pwa.iosStepShare'
  | 'pwa.iosStepAdd'
  | 'pwa.iosStepOpen'
  | 'pwa.androidStepMenu'
  | 'pwa.androidStepAdd'
  | 'pwa.androidStepOpen'
  | 'pwa.genericStepMenu'
  | 'pwa.genericStepAdd'
  | 'pwa.genericStepOpen';

function nudgeDismissed() {
  try {
    return localStorage.getItem(NUDGE_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberNudgeDismissed() {
  try {
    localStorage.setItem(NUDGE_DISMISSED_KEY, 'true');
  } catch {
    // private browsing: the nudge simply returns next session
  }
}
