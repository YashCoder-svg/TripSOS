type Props = { className?: string; label?: string };
export function Skeleton({ className = '', label = 'Loading' }: Props) {
  return <div className={`skeleton ${className}`} aria-label={label} aria-busy="true" />;
}
