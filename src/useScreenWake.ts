import { useCallback, useEffect, useRef, useState } from 'react';

export function useScreenWake(enabled: boolean) {
  const [awake, setAwake] = useState(false);
  const [supported] = useState(() => 'wakeLock' in navigator);
  const [interacted, setInteracted] = useState(false);
  const acquireRef = useRef(() => {});
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let pending = false;
    let lock: WakeLockSentinel | undefined;
    let retry: ReturnType<typeof setTimeout>;
    const acquire = async () => {
      if (
        disposed ||
        pending ||
        (lock && !lock.released) ||
        document.visibilityState !== 'visible' ||
        !navigator.wakeLock
      )
        return;
      pending = true;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (disposed) {
          await next.release();
          return;
        }
        lock = next;
        setAwake(true);
        next.addEventListener('release', () => {
          setAwake(false);
          if (!disposed) retry = setTimeout(() => void acquire(), 1000);
        });
      } catch {
        setAwake(false);
      } finally {
        pending = false;
      }
    };
    const interact = () => {
      setInteracted(true);
      if (document.visibilityState === 'visible') void acquire();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    const key = () => {
      setInteracted(true);
    };
    document.addEventListener('visibilitychange', visible);
    document.addEventListener('pointerdown', interact);
    document.addEventListener('keydown', key);
    document.addEventListener('touchstart', interact);
    window.addEventListener('focus', visible);
    acquireRef.current = interact;
    void acquire();
    return () => {
      disposed = true;
      clearTimeout(retry);
      document.removeEventListener('visibilitychange', visible);
      document.removeEventListener('pointerdown', interact);
      document.removeEventListener('keydown', key);
      document.removeEventListener('touchstart', interact);
      window.removeEventListener('focus', visible);
      void lock?.release();
      setAwake(false);
    };
  }, [enabled]);
  const activate = useCallback(() => acquireRef.current(), []);
  return { awake, supported, needsInteraction: supported && !awake && !interacted, activate };
}
