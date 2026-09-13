import type { ComponentProps } from 'react';
import './slider.css';

export function Slider(props: ComponentProps<'input'>) {
  return <input {...props} type="range" data-ui="slider" />;
}
