import type { ReactNode, SelectHTMLAttributes } from "react";

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint && !error && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs font-normal text-destructive" role="alert">{error}</span>}
    </label>
  );
}

export function NativeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring ${props.className ?? ""}`}
    />
  );
}

export const inputCls = "h-11 bg-card text-base";