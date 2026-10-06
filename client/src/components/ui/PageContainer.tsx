import type { HTMLAttributes } from 'react';

export function PageContainer(props: HTMLAttributes<HTMLElement>) {
  const { className = '', ...mainProps } = props;
  return <main className={`page-container ${className}`} {...mainProps} />;
}
