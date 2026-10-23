import {useI18n} from "@/lib/i18n";
import type {MoneyState} from "@/lib/money";
import type {RhythmForecast} from "@/lib/familyMoneyRhythm";
import {oneMoneyDashboard} from "@/lib/oneMoneyDashboard";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {SpendingMixDashboard} from "./SpendingMixDashboard";

type Props={state:MoneyState;forecast:RhythmForecast;
 onIncome:()=>void;onBills:()=>void;onExpense:()=>void;onOpenCategory:(categoryId:string)=>void;};
export function OneMoneyDashboardSummary({state,forecast,onIncome,onExpense,onOpenCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const overview=oneMoneyDashboard(state,forecast,localToday());
 const money=(value:number|null)=>value===null?t("Not entered","غير مدخل"):fmtJOD(value);
 // Core money snapshot only. Scheduled bills remain inside their category.
 const values=[
  {id:"income",emoji:"💵",label:t("Monthly income","الدخل الشهري"),value:money(overview.monthlyIncome),
   subtitle:t("Expected; confirmed received this month: ","متوقع؛ المستلم المؤكد هالشهر: ")+money(overview.receivedIncome),bg:"#EAF5E8",action:onIncome},
  {id:"plan",emoji:"🧺",label:t("Monthly spending plan","خطة مصروف الشهر"),value:money(overview.planned),
   subtitle:t("Usual + confirmed adjustments","المعتاد والتعديلات المؤكدة"),bg:"#EDF3FF",action:()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth",block:"start"})},
  {id:"paid",emoji:"✅",label:t("Paid so far","المدفوع لليوم"),value:money(overview.paid),
   subtitle:t("Confirmed expenses only","مصاريف مدفوعة فعلياً فقط"),bg:"#FFF0F5",action:onExpense}
 ];
 return <div className="space-y-3" data-testid="unified-money-dashboard">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h3 className="text-lg font-extrabold text-[#275E44]">{t("Your family's money this month","مالية العيلة بهالشهر")}</h3>
    <p className="text-xs text-[#738676]">{t("One picture · all amounts you recorded","صورة واحدة · كل الأرقام اللي دخلتها")}</p></div>
   <button type="button" onClick={onExpense}
    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#408F64] px-4 text-xs font-extrabold text-white">＋ {t("Add expense","سجّل مصروف")}</button>
  </div>
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{values.map(v=>
   <button type="button" key={v.id} onClick={v.action} data-testid={"money-summary-"+v.id}
    className="min-w-0 rounded-2xl border border-white p-3 text-start transition hover:ring-2 hover:ring-[#AED6B5]"
    style={{background:v.bg}}>
    <div className="flex items-center gap-2"><span className="text-xl" aria-hidden="true">{v.emoji}</span>
      <span className="text-xs font-bold leading-tight text-[#3F6450]">{v.label}</span></div>
    <strong className="mt-2 block break-words text-lg font-black tabular-nums text-[#316C4C] sm:text-xl">{v.value}</strong>
    <p className="mt-1 text-[10px] leading-relaxed text-[#718675]">{v.subtitle}</p>
   </button>)}</div>
  <SpendingMixDashboard state={state} onOpenCategory={onOpenCategory}/>
 </div>;
}
