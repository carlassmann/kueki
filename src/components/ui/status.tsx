import type { ComponentProps } from 'react';
import './status.css';

export type StatusTone = 'neutral' | 'good' | 'warning';

export function Status({
  tone = 'neutral',
  children,
  ...props
}: ComponentProps<'span'> & { tone?: StatusTone }) {
  return (
    <span {...props} data-ui="status" data-tone={tone}>
      <i />
      {children}
    </span>
  );
}
