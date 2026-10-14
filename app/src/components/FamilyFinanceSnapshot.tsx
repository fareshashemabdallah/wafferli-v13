import { Link } from "@tanstack/react-router";
import { ArrowUpRight, PiggyBank, ShieldCheck, Wallet, CalendarClock } from "lucide-react";
import { useMemo } from "react";
import { buildForecast,legacyIncome,localToday } from "@/lib/cashflow";
import { useI18n } from "@/lib/i18n";
import { computeMoney,sampleMoney } from "@/lib/money";
import { fmtJOD,useLocalState } from "@/lib/storage";

/** The home card is intentionally discreet: never open with large financial figures. */
export function FamilyFinanceSnapshot(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,ready]=useLocalState("money",sampleMoney());
 const finances=useMemo(()=>computeMoney(money),[money]);
 const cashFlow=useMemo(()=>buildForecast({
  incomes:money.incomeSources??legacyIncome(money.income),
  commitments:money.commitments??[],
  openingBalance:money.cashOnHand??null,
  reserve:money.cashReserve??0,
  today:localToday(),days:30
 }),[money]);
 const demo=money.demo;
 const needsReview=!demo && (cashFlow.overdueCount>0 ||
   (cashFlow.minimumBalance!==null&&cashFlow.minimumBalance<0) ||
   finances.projectedSavings<finances.savingsTarget);
 const stats=[
  {label:ar?"الدخل الشهري":"Monthly income",value:finances.monthlyIncome,Icon:Wallet},
  {label:ar?"المصاريف هذا الشهر":"Spent this month",value:finances.spent,Icon:CalendarClock},
  {label:ar?"هدف الادخار":"Savings goal",value:finances.savingsTarget,Icon:PiggyBank},
  {label:ar?"المتبقي من المخصص الشهري":"Monthly allowance left",value:finances.remaining,Icon:ShieldCheck}
 ];
 return <section className="mt-5" aria-label={ar?"المالية العائلية":"Family finances"}>
  <div className="card-soft overflow-hidden p-4 sm:p-5">
   <div className="flex items-start gap-3">
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-brand"><Wallet className="size-5"/></span>
    <div className="min-w-0 flex-1">
     <p className="text-xs font-medium tracking-wide text-brand">{ar?"راحة البال والتخطيط":"PEACE OF MIND"}</p>
     <h2 className="mt-0.5 text-lg font-semibold text-ink">{ar?"مالية العائلة، على راحتك":"Your finances, at your pace"}</h2>
     <p className="mt-1 text-sm text-muted-foreground">{ar?"اعرف ما يناسب عائلتك، واستمتع بالإنفاق على ما يهم. تفاصيل الميزانية متاحة عند الحاجة.":"Make thoughtful choices and enjoy what matters. Your numbers are here whenever you want them."}</p>
    </div>
    <Link to="/money" className="shrink-0 rounded-xl border border-border px-2.5 py-2 text-xs font-semibold text-brand" aria-label={ar?"فتح مالية العائلة":"Open Our Finances"}>
     {ar?"التفاصيل":"Details"} <ArrowUpRight className="ms-1 inline size-3.5 rtl:-rotate-90"/>
    </Link>
   </div>
   {!ready?<p className="mt-3 text-sm text-muted-foreground">{ar?"جارٍ تحميل الميزانية...":"Loading your saved plan…"}</p>:
    <>
     {needsReview&&<p className="mt-3 rounded-xl bg-[#FFF4E8] p-3 text-xs text-[#765B43]" role="status">{ar?"قد يكون هناك التزام يستحق المراجعة. ستجد التفاصيل في المالية.":"An upcoming commitment or spending estimate may deserve attention. Review the details when convenient."}</p>}
     <details className="group mt-4 rounded-xl bg-muted/45 px-3 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-brand [&::-webkit-details-marker]:hidden">
       <span className="flex items-center gap-2"><ShieldCheck className="size-4"/>{ar?"عرض الملخص المالي":"View financial overview"}</span>
       <span className="text-xs font-normal text-muted-foreground group-open:hidden">{ar?"اضغط لعرض الأرقام":"Tap to show figures"}</span>
       <span className="hidden text-xs font-normal text-muted-foreground group-open:block">{ar?"يمكن إغلاقه":"Tap to close"}</span>
      </summary>
      <div className="mt-4 grid grid-cols-2 gap-2">
       {stats.map(({label,value,Icon})=><div className="rounded-xl bg-white p-3" key={label}>
        <Icon className="size-4 text-brand"/>
        <p className="mt-2 text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-base font-semibold tabular-nums text-ink">{fmtJOD(value)}</p>
       </div>)}
      </div>
      <div className="mt-3 rounded-lg border border-border bg-white/90 p-3 text-xs text-muted-foreground">
       {demo
         ? ar?"هذه أرقام تجريبية وليست تقييمًا لمالية عائلتك. عدّلها في صفحة المالية.":"Illustrative demo figures, not an assessment of your family. You can adjust them in Our Finances."
         : ar?"هذه تقديرات تعتمد فقط على البيانات التي أدخلتها، ولا تؤكد أمان وضعك المالي.":"These estimates use only your recorded data and cannot confirm your financial safety."}
       {cashFlow.safeToSpend!==null&&!demo&&<p className="mt-2 font-medium">{ar?"تقدير المبلغ غير الملتزم وفق بياناتك: ":"Estimated uncommitted cash based on your entries: "}{fmtJOD(cashFlow.safeToSpend)}</p>}
      </div>
     </details>
    </>}
  </div>
 </section>;
}
