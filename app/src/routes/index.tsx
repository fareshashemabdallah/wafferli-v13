import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CloudSun, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { FamilyFinanceSnapshot } from "@/components/FamilyFinanceSnapshot";
import { HomeJourneyHighlights } from "@/components/HomeJourneyHighlights";
import { FamilyWeather } from "@/components/FamilyWeather";
import { defaultFamilyPreferences } from "@/lib/familyPreferences";
import { useLocalState } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { routeIntent, type Intent } from "@/lib/intent";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Day — Spend Wisely. Live Well. | Dabberna" },
      { name: "description", content: "Make everyday family decisions with more confidence: affordability, value for money, and living well." },
      { property: "og:title", content: "My Day — Dabberna" },
      { property: "og:description", content: "Spend Wisely. Live Well. A helpful home for family finances, outings and purchases." },
    ],
  }),
  component: Index,
});

type Msg = { q: string; intent: Intent | null };

function Index() {
  const { tr,t,lang } = useI18n();
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

  return (
    <AppShell>
      <section className="hero-surface rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wider text-brand">{tr("Spend wisely. Live well.")}</p>
          <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat(lang==="ar"?"ar-JO":"en-US",{weekday:"long",day:"numeric",month:"short"}).format(new Date())}</p>
        </div>
        <h1 className="mt-2 text-2xl font-semibold leading-snug text-ink sm:text-3xl">{lang==="ar"?"شو حابّين تعملوا اليوم؟":"What matters today?"}</h1>
        <p className="mt-2 max-w-md text-sm text-[#586F63]">{lang==="ar"?"مكان واحد لخططك وخياراتك اليومية.":"A simple home for everyday plans and decisions."}</p>
      </section>

      <HomeJourneyHighlights />
      <FamilyFinanceSnapshot />

      {prefs.weather && <details className="group mt-4 rounded-2xl border border-border bg-card p-4">
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="grid size-10 place-items-center rounded-xl bg-mint text-brand"><CloudSun className="size-5"/></span>
          <span className="flex-1"><span className="block text-sm font-semibold">{lang==="ar"?"الطقس والاستعداد للخروج":"Weather & getting ready"}</span><span className="block text-xs text-muted-foreground">{lang==="ar"?"تفاصيل مفيدة فقط عندما تحتاجها":"Practical details whenever you need them"}</span></span>
          <span className="text-xs font-semibold text-brand group-open:hidden">{lang==="ar"?"عرض":"View"} +</span>
          <span className="hidden text-xs font-semibold text-brand group-open:block">{lang==="ar"?"إخفاء":"Hide"} −</span>
        </summary>
        <FamilyWeather />
      </details>}

      <details className="group mt-5 rounded-2xl border border-border bg-white p-4 sm:p-5">
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="grid size-10 place-items-center rounded-xl bg-mint text-brand"><Sparkles className="size-5"/></span>
          <span className="flex-1"><span className="block text-sm font-semibold">{lang==="ar"?"لست متأكدًا من أين تبدأ؟":"Not sure where to begin?"}</span><span className="block text-xs text-muted-foreground">{lang==="ar"?"صف ما تحتاجه وسنوجّهك للقسم المناسب":"Describe your goal and we'll find the right tool"}</span></span>
          <span className="text-xs font-semibold text-brand group-open:hidden">{lang==="ar"?"اسأل":"Ask"} +</span>
          <span className="hidden text-xs font-semibold text-brand group-open:block">{lang==="ar"?"إغلاق":"Close"} −</span>
        </summary>
        <form onSubmit={submit} className="mt-4 flex gap-2 rounded-2xl border border-border bg-background p-1.5">
          <label htmlFor="ask" className="sr-only">{t("ask")}</label>
          <input id="ask" value={q} onChange={e=>setQ(e.target.value)} maxLength={200}
            placeholder={t("askPh")} className="min-w-0 flex-1 bg-transparent px-3 text-ink outline-none placeholder:text-muted-foreground"/>
          <Button type="submit" size="lg" className="rounded-xl">{t("ask")}</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">{t("routerNote")}</p>
      </details>

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

      <p className="mt-7 text-center text-xs text-muted-foreground">{lang==="ar"?"بياناتك المالية ومناسباتك على هذا الجهاز فقط.":"Financial and family dates remain on this device."} <Link to="/about" className="font-semibold text-brand underline underline-offset-2">{lang==="ar"?"كيف نعمل؟":"How it works"}</Link></p>
    </AppShell>
  );
}
