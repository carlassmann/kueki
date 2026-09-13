import type { ComponentProps } from 'react';
import './button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'quiet' | 'icon';
export type ButtonTone = 'default' | 'danger';
export type ButtonSize = 'medium' | 'small';

export type ButtonProps = ComponentProps<'button'> & ButtonLook;

export type ButtonLook = {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  full?: boolean;
};

export function buttonLook({
  variant = 'secondary',
  tone = 'default',
  size = 'medium',
  full = false,
}: ButtonLook = {}) {
  return {
    'data-ui': 'button',
    'data-variant': variant,
    'data-tone': tone,
    'data-size': size,
    'data-full': full || undefined,
  } as const;
}

export function Button({ variant, tone, size, full, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} {...buttonLook({ variant, tone, size, full })} />;
}
