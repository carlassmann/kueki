import type { ComponentProps } from 'react';
import { ExpandIcon } from '../../icons';
import './select.css';

export type SelectVariant = 'control' | 'quiet';

export function Select({
  variant = 'control',
  ...props
}: ComponentProps<'select'> & { variant?: SelectVariant }) {
  return (
    <span data-ui="select" data-variant={variant}>
      <select {...props} />
      <ExpandIcon size={14} weight="bold" aria-hidden />
    </span>
  );
}
