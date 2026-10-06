import type { ReactNode } from 'react';

type Props = { eyebrow: string; title: ReactNode; description?: string; align?: 'left' | 'center' };

export function SectionHeading({ eyebrow, title, description, align = 'left' }: Props) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        {eyebrow}
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
