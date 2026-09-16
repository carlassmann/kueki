import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { CloseIcon } from '../../icons';
import { useIntl } from '../../intl/setup';
import { Button } from './button';
import './dialog.css';

export function Dialog({
  title,
  close,
  children,
  testId = 'dialog',
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  testId?: string;
}) {
  const t = useIntl();
  const ref = useRef<HTMLDialogElement>(null);
  const swipe = useSwipeToDismiss(ref, close);

  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      data-ui="dialog"
      data-testid={testId}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !swipe.swallowClick()) close();
      }}
      onPointerDown={swipe.onPointerDown}
      onPointerMove={swipe.onPointerMove}
      onPointerUp={swipe.onPointerUp}
      onPointerCancel={swipe.onPointerCancel}
    >
      <div data-ui="dialog-content">
        <Button
          variant="icon"
          data-ui-slot="dialog-close"
          data-testid="close-dialog"
          onClick={close}
          aria-label={t('common.closeDialog')}
        >
          <CloseIcon size={19} />
        </Button>
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

const SHEET_MEDIA_QUERY = '(max-width: 680px)';
const DRAG_START_PX = 8;
const DISMISS_DISTANCE_PX = 96;
const DISMISS_VELOCITY_PX_PER_MS = 0.5;
// Velocity needs a sample from a moment ago; the last move is often the release point itself.
const VELOCITY_WINDOW_MS = 50;
const SETTLE_MS = 320;
const DISMISS_MS = 240;

type Drag = {
  pointerId: number;
  startY: number;
  offset: number;
  sampleY: number;
  sampleTime: number;
  dragging: boolean;
  frame: number;
};

/** Below the sheet breakpoint the dialog is a bottom sheet, so a downward drag dismisses it. */
function useSwipeToDismiss(ref: React.RefObject<HTMLDialogElement | null>, close: () => void) {
  const drag = useRef<Drag | null>(null);
  const dragEnded = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // iOS claims a downward swipe as a scroll unless the gesture cancels it, and only a
    // non-passive listener may do that, which React's onTouchMove cannot be.
    const keepGesture = (event: TouchEvent) => {
      if (drag.current?.dragging) event.preventDefault();
    };
    dialog.addEventListener('touchmove', keepGesture, { passive: false });
    return () => dialog.removeEventListener('touchmove', keepGesture);
  }, [ref]);

  const settle = useCallback(() => {
    const dialog = ref.current;
    if (dialog) glideTo(dialog, '', SETTLE_MS);
  }, [ref]);

  const dismiss = useCallback(() => {
    const dialog = ref.current;
    if (!dialog || prefersReducedMotion()) return close();
    glideTo(dialog, 'translateY(100%)', DISMISS_MS).onfinish = close;
  }, [ref, close]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const dialog = ref.current;
      if (!dialog || !event.isPrimary || !matchMedia(SHEET_MEDIA_QUERY).matches) return;
      if (scrolledAway(event.target as Element, dialog)) return;
      drag.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        offset: 0,
        sampleY: event.clientY,
        sampleTime: event.timeStamp,
        dragging: false,
        frame: 0,
      };
    },
    [ref],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const state = drag.current;
      const dialog = ref.current;
      if (!state || !dialog || event.pointerId !== state.pointerId) return;
      const offset = Math.max(0, event.clientY - state.startY);
      if (!state.dragging) {
        if (offset < DRAG_START_PX) return;
        state.dragging = true;
        takeOverTransform(dialog);
        dialog.setPointerCapture(event.pointerId);
      }
      if (event.timeStamp - state.sampleTime > VELOCITY_WINDOW_MS) {
        state.sampleY = event.clientY;
        state.sampleTime = event.timeStamp;
      }
      state.offset = offset;
      // Several moves can arrive per frame, and only the last one is worth painting.
      if (!state.frame) {
        state.frame = requestAnimationFrame(() => {
          state.frame = 0;
          dialog.style.transform = `translateY(${state.offset}px)`;
        });
      }
    },
    [ref],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const state = drag.current;
      const dialog = ref.current;
      drag.current = null;
      if (!state || !dialog || event.pointerId !== state.pointerId || !state.dragging) return;
      cancelAnimationFrame(state.frame);
      dragEnded.current = true;
      const offset = Math.max(0, event.clientY - state.startY);
      dialog.style.transform = `translateY(${offset}px)`;
      const elapsed = event.timeStamp - state.sampleTime;
      const velocity = elapsed > 0 ? (event.clientY - state.sampleY) / elapsed : 0;
      const flicked = velocity > DISMISS_VELOCITY_PX_PER_MS;
      if (offset > DISMISS_DISTANCE_PX || (flicked && offset > DRAG_START_PX)) dismiss();
      else settle();
    },
    [ref, dismiss, settle],
  );

  const onPointerCancel = useCallback(() => {
    const state = drag.current;
    drag.current = null;
    if (state) cancelAnimationFrame(state.frame);
    settle();
  }, [settle]);

  // Pointer capture retargets the closing click to the dialog, which would look like a backdrop tap.
  const swallowClick = useCallback(() => {
    const swallow = dragEnded.current;
    dragEnded.current = false;
    return swallow;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, swallowClick };
}

/** Hands the transform from CSS to the drag, leaving the sheet exactly where it is now. */
function takeOverTransform(dialog: HTMLDialogElement) {
  for (const animation of dialog.getAnimations()) animation.finish();
  dialog.setAttribute('data-swiping', 'true');
}

/** Moves the sheet from wherever the finger left it to `transform`, which becomes its resting style. */
function glideTo(dialog: HTMLDialogElement, transform: string, duration: number) {
  const from = dialog.style.transform || 'none';
  dialog.style.transform = transform;
  return dialog.animate([{ transform: from }, { transform: transform || 'none' }], {
    duration: prefersReducedMotion() ? 0 : duration,
    easing: getComputedStyle(dialog).getPropertyValue('--spring').trim() || 'ease-out',
  });
}

function scrolledAway(target: Element, dialog: HTMLDialogElement) {
  for (let node: Element | null = target; node; node = node.parentElement) {
    if (node.scrollTop > 0) return true;
    if (node === dialog) return false;
  }
  return false;
}

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
