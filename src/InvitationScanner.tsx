import { useEffect, useRef, useState } from 'react';
import { Dialog } from './components/ui/dialog';
import { Notice } from './components/ui/notice';
import { useIntl } from './intl/setup';
import './InvitationScanner.css';

export function InvitationScanner({
  onScan,
  close,
}: {
  onScan: (code: string) => void;
  close: () => void;
}) {
  const t = useIntl();
  const video = useRef<HTMLVideoElement>(null);
  const [failure, setFailure] = useState<'' | 'camera' | 'invalid'>('');
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    let controls: { stop: () => void } | undefined;
    const stop = () => {
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) return stop();
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (cancelled) return stop();
        controls = await new BrowserQRCodeReader().decodeFromStream(
          stream,
          video.current!,
          (result) => {
            if (!result || cancelled) return;
            let code = result.getText().trim();
            try {
              const url = new URL(code);
              code = new URLSearchParams(url.hash.slice(1)).get('join') || '';
            } catch {}
            if (!/^(?:[a-f0-9]{64}\.)?[A-Za-z0-9_-]{20,128}$/.test(code)) {
              setFailure('invalid');
              return;
            }
            cancelled = true;
            stop();
            onScan(code);
          },
        );
        if (cancelled) stop();
      } catch {
        stop();
        if (!cancelled) setFailure('camera');
      }
    }
    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [onScan]);
  const message =
    failure === 'camera'
      ? t('scanner.cameraUnavailable')
      : failure === 'invalid'
        ? t('scanner.invalid')
        : t('scanner.prompt');

  return (
    <Dialog title={t('scanner.title')} testId="scanner-dialog" close={close}>
      {/* An unusable camera would otherwise leave a full-width black square behind. */}
      {failure !== 'camera' && (
        <video ref={video} autoPlay muted playsInline className="invitation-camera" />
      )}
      {failure ? (
        <Notice role="status" data-testid="scanner-status" data-state="error">
          {message}
        </Notice>
      ) : (
        <p role="status" data-testid="scanner-status" data-state="scanning">
          {message}
        </p>
      )}
    </Dialog>
  );
}
