import { useEffect, useRef, type ReactNode } from 'react';

/** Published on the document so scroll margins can keep a focused field clear of the toast. */
const BOTTOM_OVERLAY = '--bottom-overlay';

/** How much of the bottom of the visible viewport the toast stack covers, 0 when nothing is up.
    The toaster element itself has no height, so the frontmost toast marks the top of the band. */
function coveredHeight(area: HTMLElement) {
  const toasts = area.querySelectorAll('[data-sonner-toast]');
  if (!toasts.length) return 0;
  const viewportBottom = window.visualViewport?.height ?? window.innerHeight;
  const highest = Math.min(...[...toasts].map((toast) => toast.getBoundingClientRect().top));
  return Math.max(0, viewportBottom - highest);
}

/** Wraps the toaster so it can report the space it takes.

    Focusing a field scrolls it against the bottom of the viewport, which is also where the toast
    sits, so an update notice ends up covering the field the keyboard just opened for, and takes
    its taps. `scrollIntoView` cannot see the toast, so the toast measures itself instead and the
    fields add the result to their bottom scroll margin. */
export function ToastArea({ children }: { children: ReactNode }) {
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = area.current;
    if (!element) return;
    let frame = 0;
    const publish = () => {
      frame = 0;
      const height = Math.round(coveredHeight(element));
      document.documentElement.style.setProperty(BOTTOM_OVERLAY, `${height}px`);
    };
    // Toasts arrive, resize and leave in bursts, and only the last state of a frame is worth measuring.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(publish);
    };

    publish();
    const toasts = new MutationObserver(schedule);
    toasts.observe(element, { childList: true, subtree: true, attributes: true });
    // A toast slides in on a transform, which lands it in its real place without touching the DOM.
    element.addEventListener('transitionend', schedule);
    element.addEventListener('animationend', schedule);
    // The keyboard opening moves the toast without changing it.
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      toasts.disconnect();
      element.removeEventListener('transitionend', schedule);
      element.removeEventListener('animationend', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      document.documentElement.style.removeProperty(BOTTOM_OVERLAY);
    };
  }, []);

  return <div ref={area}>{children}</div>;
}
