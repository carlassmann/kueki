import type { ComponentProps, ElementType } from 'react';
import './notice.css';

export type NoticeTone = 'alert' | 'sound';

export function Notice({
  as: Element = 'p',
  tone = 'alert',
  ...props
}: ComponentProps<'p'> & { as?: ElementType; tone?: NoticeTone }) {
  return <Element {...props} data-ui="notice" data-tone={tone} />;
}
