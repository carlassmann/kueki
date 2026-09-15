import { useEffect, useState, useSyncExternalStore } from 'react';
import QRCode from 'qrcode';
import { useIntl } from './intl/setup';
import './InvitationQr.css';

/* Scanners need a light quiet zone and dark modules, so the dark theme dims the
   light side to a warm parchment instead of inverting it. */
const QR_COLORS = {
  light: { dark: '#2c3448', light: '#fffdf9' },
  dark: { dark: '#111620', light: '#d6d1c2' },
};

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function subscribeToColorScheme(onChange: () => void) {
  darkQuery.addEventListener('change', onChange);
  return () => darkQuery.removeEventListener('change', onChange);
}

export function InvitationQr({ code }: { code: string }) {
  const t = useIntl();
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const prefersDark = useSyncExternalStore(
    subscribeToColorScheme,
    () => darkQuery.matches,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(code, {
      width: 512,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: prefersDark ? QR_COLORS.dark : QR_COLORS.light,
    })
      .then((url) => {
        if (!cancelled) setImage(url);
      })
      .catch(() => {
        if (!cancelled) setError(t('qr.unavailable'));
      });
    return () => {
      cancelled = true;
    };
  }, [code, prefersDark, t]);

  return (
    <div className="invitation-qr">
      {image && <img src={image} width="224" height="224" alt={t('qr.alt')} />}
      <p>{t('qr.hint')}</p>
      {error && <p role="status">{error}</p>}
    </div>
  );
}
