import { Link } from "@tanstack/react-router";
import { CalendarHeart, CalendarClock, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { buildForecast, legacyIncome, localToday } from "@/lib/cashflow";
import { defaultFamilyPreferences } from "@/lib/familyPreferences";
import { sampleMembers, sampleMoney } from "@/lib/money";
import { fmtJOD, useLocalState } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";

export function FamilyInsights() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [money] = useLocalState("money", sampleMoney());
  const [members] = useLocalState("members", sampleMembers());
  const [prefs] = useLocalState("familyPreferences", defaultFamilyPreferences);
  const forecast = useMemo(() => buildForecast({
    incomes: money.incomeSources ?? legacyIncome(money.income),
    commitments: money.commitments ?? [],
    openingBalance: money.cashOnHand ?? null,
    reserve: money.cashReserve ?? 0,
    today: localToday(),
    days: 30,
  }), [money]);
  const dueSoon = forecast.events.find(e=>e.kind==="bill" && e.date <= new Date(Date.now()+7*86400000).toISOString().slice(0,10));
  const hasChildren = members.some(m=>m.role==="child");
  const cards: {title:string;desc:string;link:"/money"|"/explore/together"|"/explore/smartbuy";cta:string;Icon:typeof Sparkles}[]=[];
  if (prefs.billReminders && dueSoon) cards.push({
    title: ar?"التزام قادم":"Upcoming commitment",
    desc: (ar?"تحقّق من الدفع المخطط لـ ":"Review the planned payment for ")+dueSoon.name+" ("+fmtJOD(dueSoon.amount)+").",
    link:"/money",cta:ar?"راجع التدفق النقدي":"Review cash flow",Icon:CalendarClock
  });
  if (prefs.lifestyle) cards.push({
    title:hasChildren?(ar?"وقت ممتع للعائلة":"Time together as a family"):(ar?"نشاط يناسب يومكم":"A moment for your day"),
    desc:hasChildren
      ?(ar?"استكشفوا نزهات تناسب أعمار الأطفال ضمن ميزانيتكم ومسافتكم المفضلة. التكاليف غير مؤكدة حتى تتحققوا منها.":"Explore child-friendly outings using your preferred budget and distance. Confirm prices before booking.")
      :(ar?"ابحثوا عن نشاط قريب يناسب الميزانية. تحققوا من التكلفة قبل الانطلاق.":"Find an activity close to home that suits your budget. Verify costs before going."),
    link:"/explore/together",cta:ar?"خطّطوا لنزهة":"Plan an outing",Icon:CalendarHeart
  });
  if (prefs.shoppingTips && cards.length<2) cards.push({
    title:ar?"تسوّقوا بذكاء":"Shop with confidence",
    desc: ar?"قارنوا كلفة المنتجات مع التنقل أو التوصيل قبل الشراء.":"Compare total item, delivery and travel costs before buying.",
    link:"/explore/smartbuy",cta:ar?"قارنوا الأسعار":"Compare costs",Icon:ShoppingBag
  });
  const shown=cards.slice(0,2);
  if (!shown.length) return null;
  return <section className="mt-6" aria-label={ar?"اقتراحات للعائلة":"Family suggestions"}>
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-brand"/>{ar?"من أجل عائلتكم":"For your family"}</h2>
      <Link to="/space" className="text-xs font-medium text-brand">{ar?"تخصيص":"Personalize"}</Link>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {shown.map(({title,desc,link,cta,Icon})=><div key={title} className="card-soft flex flex-col gap-2 p-4">
        <span className="grid size-10 place-items-center rounded-2xl bg-mint text-brand"><Icon className="size-5"/></span>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="flex-1 text-sm text-muted-foreground">{desc}</p>
        <Link to={link} className="mt-2 text-sm font-semibold text-brand">{cta} ↗</Link>
      </div>)}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{ar?"توصيات محلية وليست خدمات ذكاء اصطناعي متصلة بعد.":"Device-based suggestions; not a connected AI service yet."}</p>
  </section>;
}
