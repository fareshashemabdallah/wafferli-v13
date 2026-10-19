import {useState} from "react";
import {ArrowRight,CalendarClock,Coins,ShieldCheck,Wallet} from "lucide-react";
import {fmtJOD} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type MoneyState} from "@/lib/money";
import {getMoneyOverview} from "@/lib/moneyOverview";
import {QuickMoneySetup} from "./QuickMoneySetup";

type Props={money:MoneyState;setMoney:(fn:(s:MoneyState)=>MoneyState)=>void;
 onBudget:()=>void;onSpending:()=>void;onBills:()=>void;onInsights:()=>void;setupNeeded:boolean};
const card="rounded-[1.2rem] border border-[#DFE9DD] bg-white p-4 sm:p-5";

/** Money is the detailed workspace, not another four-step journey.
 * No repeated financial story, milestone hero, progress score or inferred cash.
 */
export function AdventureMoneyJourney({money,setMoney,onBudget,onSpending,onBills,onInsights,setupNeeded}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [setupOpen,setSetupOpen]=useState(false);
 const figures=computeMoney(money),overview=getMoneyOverview(money);
 const values=[
  {key:"income",label:t("Monthly income entered","الدخل الشهري المسجّل"),value:money.demo||(!money.incomeKnown&&figures.monthlyIncome===0)?t("Not entered","غير مدخل"):fmtJOD(figures.monthlyIncome),icon:Coins},
  {key:"plan",label:t("Planned household costs","مصاريف البيت المخططة"),value:money.demo||money.categories.length===0?t("Not entered","غير مدخل"):fmtJOD(figures.planned),icon:Wallet},
  {key:"paid",label:t("Recorded paid spending","مصاريف مدفوعة مسجّلة"),value:money.demo?t("Not entered","غير مدخل"):fmtJOD(figures.spent),icon:Wallet},
  {key:"bills",label:t("Upcoming recorded bills","فواتير مسجّلة قادمة"),value:money.demo||!overview.hasBillSchedule?t("Not entered","غير مدخل"):fmtJOD(overview.forecast.upcomingBills),icon:CalendarClock}
 ];
 return <div className="mx-auto max-w-[900px] space-y-4 text-[#193D39]" data-adventure-money>
  <section className={card} aria-label={t("Money workspace","مساحة مال العيلة")}>
   <p className="text-xs font-extrabold uppercase tracking-wide text-[#35836A]">{t("UNDERSTAND · YOUR MONEY RECORDS","افهم · سجلات مال العيلة")}</p>
   <h2 className="mt-1 text-xl font-black">{t("One place for the actual numbers","مكان واحد للأرقام الفعلية")}</h2>
   <p className="mt-1 text-xs leading-relaxed text-[#667B70]">{t(
    "The weekly family story lives on Today. Here, review or change the underlying figures—without another progress journey.",
    "الحكاية الأسبوعية موجودة باليوم. هون بتراجع وبتعدّل الأرقام الأساسية، بدون رحلة تقدم مكررة.")}</p>
  </section>
  <section className={card} aria-label={t("Your monthly picture","صورة الشهر")}>
   <h2 className="text-base font-extrabold">{t("This month's recorded picture","صورة الشهر حسب بياناتك")}</h2>
   <div className="mt-3 grid grid-cols-2 gap-2">
    {values.map(v=><div key={v.key} className="rounded-xl border border-[#E0E9E0] bg-[#F6FAF5] p-3">
     <v.icon className="size-4 text-[#36866D]" aria-hidden="true"/>
     <p className="mt-2 text-xs font-semibold text-[#536C5F]">{v.label}</p>
     <p className="mt-1 break-words text-lg font-black tabular-nums text-[#20493A]">{v.value}</p>
    </div>)}
   </div>
   <p className="mt-3 text-[11px] leading-relaxed text-[#71867A]">{t(
    "Planned costs, recorded spending and scheduled bills may overlap. They cannot be added together or treated as bank-confirmed spendable cash.",
    "المخطط والمدفوع والفواتير ممكن يتداخلوا. ما منجمعهم مع بعض أو نعتبرهم نقد متاح ومؤكد من البنك.")}</p>
  </section>
  <section className={card} aria-label={t("Work with your money","تفاعل مع مال العيلة")}>
   <h2 className="text-base font-extrabold">{t("What do you want to do?","شو حابب تعمل؟")}</h2>
   <div className="mt-3 grid gap-2 sm:grid-cols-3">
    <button type="button" onClick={setupNeeded?()=>setSetupOpen(true):onBudget}
     className="min-h-14 rounded-xl border border-[#CFE5D3] bg-[#EDF7ED] px-3 text-sm font-bold text-[#246247]">
     {t("Explore household categories","استكشف فئات مصاريف البيت")} <ArrowRight className="ms-1 inline size-4 rtl:rotate-180"/>
    </button>
    <button type="button" onClick={onSpending} className="min-h-14 rounded-xl border border-[#E0E9DE] bg-white px-3 text-sm font-bold text-[#2B6552]">
     {t("Record actual spending","سجّل مصروف مدفوع")}
    </button>
    <button type="button" onClick={onBills} className="min-h-14 rounded-xl border border-[#E0E9DE] bg-white px-3 text-sm font-bold text-[#2B6552]">
     {t("Review bills & commitments","راجع الفواتير والالتزامات")}
    </button>
   </div>
   {setupNeeded&&<p className="mt-3 text-xs leading-relaxed text-[#728475]">{t(
    "Financial setup is optional. Start with one household cost when ready; no income or savings goal required.",
    "إدخال المالية اختياري. ابدأ بمصروف واحد وقت تكون جاهز، بدون فرض دخل أو هدف ادخار.")}</p>}
   {setupNeeded&&setupOpen&&<div className="mt-3 rounded-xl border border-[#DFE8DC] bg-[#F8FBF6] p-3">
    <button type="button" onClick={()=>setSetupOpen(false)} className="mb-2 min-h-10 text-xs font-bold text-brand underline">{t("Close","إغلاق")}</button>
    <QuickMoneySetup money={money} setMoney={setMoney}/>
   </div>}
   <button type="button" onClick={onInsights} className="mt-4 min-h-11 text-xs font-bold text-[#397C61] underline underline-offset-2">
    {t("Detailed financial insights (optional)","تحليلات مالية تفصيلية (اختياري)")}
   </button>
  </section>
  <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#71867A]"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   {t("The finances shown here are your local records, not verified balances. The Family Money Journey uses these same entries—no second set of financial data.",
    "الأرقام هون من سجلاتك المحلية مش أرصدة مؤكدة. رحلة مال العيلة بتقرأ نفس البيانات—ما في سجلات مالية ثانية.")}</p>
 </div>;
}
