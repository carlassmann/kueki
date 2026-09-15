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
const DISMISS_ANIMATION_MS = 240;

type Drag = {
  pointerId: number;
  startY: number;
  sampleY: number;
  sampleTime: number;
  dragging: boolean;
};

/** Below the sheet breakpoint the dialog is a bottom sheet, so a downward drag dismisses it. */
function useSwipeToDismiss(ref: React.RefObject<HTMLDialogElement | null>, close: () => void) {
  const drag = useRef<Drag | null>(null);
  const dragEnded = useRef(false);

  const settle = useCallback(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.removeAttribute('data-dragging');
    dialog.style.transform = '';
  }, [ref]);

  const dismiss = useCallback(() => {
    const dialog = ref.current;
    if (!dialog || prefersReducedMotion()) return close();
    dialog.removeAttribute('data-dragging');
    dialog.style.transform = 'translateY(100%)';
    setTimeout(close, DISMISS_ANIMATION_MS);
  }, [ref, close]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const dialog = ref.current;
      if (!dialog || !event.isPrimary || !matchMedia(SHEET_MEDIA_QUERY).matches) return;
      if (scrolledAway(event.target as Element, dialog)) return;
      drag.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        sampleY: event.clientY,
        sampleTime: event.timeStamp,
        dragging: false,
      };
    },
    [ref],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const state = drag.current;
      const dialog = ref.current;
      if (!state || !dialog || event.pointerId !== state.pointerId) return;
      const offset = event.clientY - state.startY;
      if (!state.dragging) {
        if (offset < DRAG_START_PX) return;
        state.dragging = true;
        dialog.setAttribute('data-dragging', 'true');
        dialog.setPointerCapture(event.pointerId);
      }
      if (event.timeStamp - state.sampleTime > VELOCITY_WINDOW_MS) {
        state.sampleY = event.clientY;
        state.sampleTime = event.timeStamp;
      }
      dialog.style.transform = `translateY(${Math.max(0, offset)}px)`;
    },
    [ref],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDialogElement>) => {
      const state = drag.current;
      const dialog = ref.current;
      drag.current = null;
      if (!state || !dialog || event.pointerId !== state.pointerId || !state.dragging) return;
      dragEnded.current = true;
      const offset = event.clientY - state.startY;
      const elapsed = event.timeStamp - state.sampleTime;
      const velocity = elapsed > 0 ? (event.clientY - state.sampleY) / elapsed : 0;
      const flicked = velocity > DISMISS_VELOCITY_PX_PER_MS;
      if (offset > DISMISS_DISTANCE_PX || (flicked && offset > DRAG_START_PX)) dismiss();
      else settle();
    },
    [ref, dismiss, settle],
  );

  const onPointerCancel = useCallback(() => {
    drag.current = null;
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
