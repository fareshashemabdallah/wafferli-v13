import { useI18n } from "@/lib/i18n";

/** Dabberna — Arabic-first identity, also readable in English. */
export function Logo({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} dir="ltr">
      <svg viewBox="0 0 40 40" className="size-8 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="12" className="fill-brand" />
        <path d="M12 10v20h7c7 0 11-4.5 11-10s-4-10-11-10h-7z" className="stroke-lime" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="30.7" cy="10.5" r="2.2" className="fill-lime" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight text-brand" dir={lang === "ar" ? "rtl" : "ltr"}>{lang === "ar" ? "دبّرنا" : "dabberna"}</span>
    </span>
  );
}
