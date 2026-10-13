export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} dir="ltr">
      <svg viewBox="0 0 40 40" className="size-8" aria-hidden>
        <rect width="40" height="40" rx="12" className="fill-brand" />
        <path
          d="M9 14l4.5 13 4-9.5 4 9.5L26 14"
          className="stroke-lime"
          strokeWidth="3.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="30.5" cy="14" r="2.4" className="fill-lime" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight text-brand">dabberna</span>
    </span>
  );
}