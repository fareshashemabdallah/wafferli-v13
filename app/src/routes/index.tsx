import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ListChecks, MessagesSquare, Receipt, ShoppingBag, Sparkles, Users, UtensilsCrossed } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell, PilotBadge } from "@/components/AppShell";
import { FamilyFinanceSnapshot } from "@/components/FamilyFinanceSnapshot";
import { FamilyWeather } from "@/components/FamilyWeather";
import { FamilyInsights } from "@/components/FamilyInsights";
import { defaultFamilyPreferences } from "@/lib/familyPreferences";
import { useLocalState } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { routeIntent, type Intent } from "@/lib/intent";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dabberna — A caring companion for family life" },
      { name: "description", content: "Ask once, Dabberna routes you to budgeting, smart buying, shopping lists or a friends' restaurant vote in Amman." },
      { property: "og:title", content: "Dabberna — Personal Pilot" },
      { property: "og:description", content: "Household budgeting, smart buying and group restaurant votes for Amman." },
    ],
  }),
  component: Index,
});

type Msg = { q: string; intent: Intent | null };

function Index() {
  const { tr } = useI18n();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [prefs] = useLocalState("familyPreferences", defaultFamilyPreferences);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = q.trim();
    if (!text) return;
    setMsgs((m) => [...m, { q: text, intent: routeIntent(text) }].slice(-4));
    setQ("");
  };

  const shortcuts = [
    { to: "/explore/together" as const, label: t("planOuting"), icon: Users },
    { to: "/community" as const, label: tr("Parents & friends groups"), icon: MessagesSquare },
    { to: "/money" as const, label: t("trackSpend"), icon: Receipt },
    { to: "/explore/shopping" as const, label: t("shopList"), icon: ListChecks },
    { to: "/explore/smartbuy" as const, label: t("smartBuy"), icon: ShoppingBag },
    { to: "/explore/restaurants" as const, label: t("restaurants"), icon: UtensilsCrossed },
  ];

  return (
    <AppShell>
      <section className="hero-surface rounded-3xl p-6 md:p-8">
        <p className="text-sm opacity-80">{tr("Marhaba 👋 · Amman")}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">{t("greeting")}</h1>
        <form onSubmit={submit} className="mt-5 flex gap-2 rounded-2xl bg-card p-1.5">
          <label htmlFor="ask" className="sr-only">{t("ask")}</label>
          <input
            id="ask"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={200}
            placeholder={t("askPh")}
            className="min-w-0 flex-1 bg-transparent px-3 text-ink outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="lg" className="rounded-xl">
            {t("ask")}
          </Button>
        </form>
        <p className="mt-2 flex items-center gap-1.5 text-xs opacity-80">
          <Sparkles className="size-3.5" /> {t("routerNote")}
        </p>
      </section>

      <FamilyFinanceSnapshot />
      {prefs.weather && <FamilyWeather />}
      {prefs.notificationFrequency !== "off" && <FamilyInsights />}

      {msgs.length > 0 && (
        <section className="mt-5 space-y-3" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-ee-sm bg-brand px-4 py-2.5 text-primary-foreground">{m.q}</div>
              <div className="card-soft max-w-[90%] p-4">
                {m.intent ? (
                  <>
                    <p className="text-sm">{tr(m.intent.reply)}</p>
                    <Button className="mt-3" onClick={() => navigate({ to: m.intent!.to })}>
                      {tr(m.intent.label)} <ArrowRight className="size-4 rtl:rotate-180" />
                    </Button>
                  </>
                ) : (
                  <p className="text-sm"> {tr("I couldn't match that yet. Try words like “dinner with friends”, “budget”, “groceries” or “buy shoes”, or pick a shortcut below.")} </p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">{tr("Rule-based suggestion — not AI, not live internet data.")}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("shortcuts")}</h2>
          <Link to="/explore/services" className="text-sm font-semibold text-brand">{tr("Find family services")} ↗</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shortcuts.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="card-soft flex min-h-24 flex-col justify-between p-4 transition hover:-translate-y-0.5">
              <span className="grid size-10 place-items-center rounded-xl bg-mint text-brand"><Icon className="size-5" /></span>
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card-soft mt-7 flex items-center justify-between gap-3 p-4">
        <div>
          <div className="flex items-center gap-2 font-medium">{tr("Personal pilot")} <PilotBadge>{tr("V13")}</PilotBadge></div>
          <p className="text-sm text-muted-foreground">{tr("Family budgets stay on this device. Votes and community conversations use separate online services.")}</p>
        </div>
        <Link to="/about" className="shrink-0 text-sm font-semibold text-brand underline-offset-4 hover:underline">{tr("Details")}</Link>
      </section>
    </AppShell>
  );
}