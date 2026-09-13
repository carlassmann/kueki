import type { ComponentProps, ElementType } from 'react';
import './text.css';

export function Caption({
  as: Element = 'p',
  ...props
}: ComponentProps<'p'> & { as?: ElementType }) {
  return <Element {...props} data-ui="caption" />;
}

export const codeLook = { 'data-ui': 'code' } as const;
