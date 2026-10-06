type Props = { message: string; tone?: 'info' | 'success' | 'error' };
export function Toast({ message, tone = 'info' }: Props) {
  return (
    <div className={`toast toast--${tone}`} role="status">
      {message}
    </div>
  );
}
