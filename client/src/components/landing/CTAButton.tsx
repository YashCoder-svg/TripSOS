import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type Props = { to: string; children: ReactNode; tone?: 'light' | 'dark'; className?: string };

export function CTAButton({ to, children, tone = 'dark', className = '' }: Props) {
  return (
    <Link className={`cta-button cta-button--${tone} ${className}`} to={to}>
      {children}
      <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  );
}
