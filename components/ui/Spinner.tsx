/** A small, non-essential spinner. The text beside it carries the meaning. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-7 w-7 shrink-0 animate-spin rounded-full border-4 border-line border-t-navy motion-reduce:animate-none ${className}`}
    />
  );
}
