import { useEffect, useRef, type ReactNode } from 'react';
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
        if (event.target === ref.current) close();
      }}
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
