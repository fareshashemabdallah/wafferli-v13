import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarHeart, ChevronRight, CloudSun, Compass, Sparkles, Wallet } from "lucide-react";
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
      { name: "description", content: "Dabberna helps families manage household spending, remember important dates and choose outings, gifts and services that fit their priorities and budget." },
      { property: "og:title", content: "Dabberna — Family money, plans and better choices" },
      { property: "og:description", content: "Manage household spending, plan family occasions, and compare everyday choices. Spend Wisely. Live Well." },
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
      <section className="hero-surface rounded-3xl p-5 sm:p-7">
        <p className="text-xs font-semibold tracking-wide text-brand">{lang==="ar"?"دبّرنا · رفيق العائلة اليومي":"DABBERNA · YOUR EVERYDAY FAMILY COMPANION"}</p>
        <h1 className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {lang==="ar"?"مصروف العائلة، وخططها، وقراراتها… في مكان واحد.":"Your family’s money, plans and decisions. All in one place."}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#4B665A] sm:text-base">
          {lang==="ar"
            ?"دبّرنا يساعدك تتابع مصروف البيت، وتتذكّر المناسبات، وتختار طلعات وهدايا ومشتريات تناسب احتياجاتك وميزانيتك."
            :"Dabberna helps you keep track of spending, remember important moments, and choose outings, gifts and purchases that fit your needs and budget."}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand">
          <Sparkles className="size-4" aria-hidden="true"/>
          {tr("Spend wisely. Live well.")}
        </div>
      </section>

      <section className="mt-6" aria-label={lang==="ar"?"كيف يساعدك دبّرنا":"How Dabberna helps you"}>
        <h2 className="text-lg font-semibold text-ink">{lang==="ar"?"شو حابب تدبّر أول شي؟":"Where would you like to start?"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{lang==="ar"?"اختَر خطوة واحدة، ومنساعدك فيها.":"Choose one thing to work on. You can explore the rest later."}</p>
        <div className="mt-3 grid gap-2.5">
          {[
            {to:"/money" as const,Icon:Wallet,en:"Manage my money",ar:"دبّر مصروفي",desc:"See spending, bills and your household budget.",descAr:"تابع المصاريف والفواتير وميزانية البيت.",shade:"bg-[#ECF3EA]"},
            {to:"/space" as const,Icon:CalendarHeart,en:"Organize family life",ar:"نظّم حياة عائلتي",desc:"Keep family details, birthdays and important dates together.",descAr:"احفظ مناسبات العائلة وأعياد الميلاد والمواعيد المهمة.",shade:"bg-[#FBF0E9]"},
            {to:"/explore" as const,Icon:Compass,en:"Make better choices",ar:"اختَر الأفضل",desc:"Explore outings, gifts and services—and compare their value.",descAr:"اكتشف الطلعات والهدايا والخدمات وقارن القيمة.",shade:"bg-[#EDF1F8]"}
          ].map(({to,Icon,en,ar:arabic,desc,descAr,shade})=><Link key={to} to={to}
            className="group flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-white p-3.5 transition hover:border-brand/40 hover:shadow-sm sm:p-4">
            <span className={"grid size-12 shrink-0 place-items-center rounded-2xl text-brand "+shade}><Icon className="size-6" aria-hidden="true"/></span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold leading-tight text-ink">{lang==="ar"?arabic:en}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground sm:text-sm">{lang==="ar"?descAr:desc}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-brand/75 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true"/>
          </Link>)}
        </div>
      </section>

      <div className="mt-5 rounded-2xl bg-[#F2F6F0] px-4 py-3 text-sm text-[#496759]">
        <strong className="font-semibold">{lang==="ar"?"مثال بسيط: ":"For example: "}</strong>
        {lang==="ar"
          ?"إذا عندك عيد ميلاد قريب، خطّط للهدية أو الطلعة، وقارن الخيارات ضمن مبلغ مريح إلك."
          :"Have a birthday coming up? Plan a gift or outing and compare options within a comfortable spending limit."}
        <Link to="/occasions" className="ms-2 inline-flex items-center gap-1 whitespace-nowrap font-semibold text-brand underline-offset-2 hover:underline">{lang==="ar"?"خطّط لمناسبة":"Plan an occasion"} <ArrowRight className="size-3.5 rtl:rotate-180"/></Link>
      </div>

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
