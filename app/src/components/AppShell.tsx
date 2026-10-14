import { Link } from "@tanstack/react-router";
import { Compass, Home, Info, Languages, MessageCircle, Sparkles, UserRound, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n, type Key } from "@/lib/i18n";
import { Logo } from "./Logo";

const tabs: { to: "/" | "/explore" | "/money" | "/space" | "/community"; key: Key; icon: typeof Home; exact?: boolean }[] = [
  { to: "/", key: "home", icon: Home, exact: true },
  { to: "/explore", key: "explore", icon: Compass },
  { to: "/money", key: "money", icon: Wallet },
  { to: "/community", key: "circles", icon: MessageCircle },
  { to: "/space", key: "space", icon: UserRound },
];

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border bg-card px-3 text-sm font-medium"
      aria-label="Switch language"
    >
      <Languages className="size-4" />
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e bg-sidebar p-5 md:flex">
        <Link to="/" aria-label="dabberna home"><Logo /></Link>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
          {tabs.map(({ to, key, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={exact ? { exact: true } : {}}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted data-[status=active]:bg-mint data-[status=active]:text-brand"
            >
              <Icon className="size-5" /> {t(key)}
            </Link>
          ))}
          <Link
            to="/about"
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted data-[status=active]:bg-mint data-[status=active]:text-brand"
          >
            <Info className="size-5" /> {t("about")}
          </Link>
        </nav>
        <div className="mt-auto"><LangToggle /></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pt-safe sticky top-0 z-30 border-b bg-background/85 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/" aria-label="dabberna home"><Logo /></Link>
            <div className="flex items-center gap-2">
              <Link to="/about" aria-label={t("about")} className="grid size-10 place-items-center rounded-full border bg-card">
                <Info className="size-4" />
              </Link>
              <LangToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-40 pt-5 md:px-8 md:pb-20 md:pt-10">
          {title && <h1 className="mb-5 text-3xl font-semibold text-ink">{title}</h1>}
          {children}
        </main>
      </div>

      {/* A genuine entry to the existing affordability advisor, always accessible without claiming live AI. */}
      <Link
        to="/advisor"
        aria-label={t("advisor")}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.4rem)] end-4 z-30 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:bottom-6 md:end-6"
      >
        <Sparkles className="size-4" aria-hidden="true" /> {t("advisor")}
      </Link>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {tabs.map(({ to, key, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={exact ? { exact: true } : {}}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 pt-2 text-[10px] font-medium text-muted-foreground data-[status=active]:text-brand"
            >
              <Icon className="size-5" /> {t(key)}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PilotBadge({ children = "Sample" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-warn px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn-foreground">
      {children}
    </span>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed bg-mint/60 p-3 text-sm text-ink">{children}</div>;
}