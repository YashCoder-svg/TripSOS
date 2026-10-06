import type { ReactNode } from 'react';

type Props = { open: boolean; title: string; children: ReactNode; onClose: () => void };
export function Modal({ open, title, children, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
