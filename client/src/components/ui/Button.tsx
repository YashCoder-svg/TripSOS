import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'danger' };
export function Button({ className, variant = 'primary', ...props }: Props) {
  return <button className={cn('button', `button--${variant}`, className)} {...props} />;
}
