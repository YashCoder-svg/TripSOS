import type { ReactNode } from 'react';

type Props = { title: string; description: string; action?: ReactNode };
export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="empty-state">
      <span className="eyebrow">A little room to roam</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
