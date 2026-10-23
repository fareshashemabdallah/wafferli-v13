import {useI18n} from "@/lib/i18n";
import type {MoneyState} from "@/lib/money";
import type {RhythmForecast} from "@/lib/familyMoneyRhythm";
import {oneMoneyDashboard} from "@/lib/oneMoneyDashboard";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {SpendingMixDashboard} from "./SpendingMixDashboard";

type Props={state:MoneyState;forecast:RhythmForecast;
 onIncome:()=>void;onCash:()=>void;onSavings:()=>void;onBills:()=>void;onExpense:()=>void;
 onTimeline:()=>void;onOpenCategory:(categoryId:string)=>void;};
export function OneMoneyDashboardSummary({state,forecast,onIncome,onCash,onSavings,onBills,onExpense,onTimeline,onOpenCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const overview=oneMoneyDashboard(state,forecast,localToday());
 const money=(value:number|null)=>value===null?t("Not entered","غير مدخل"):fmtJOD(value);
 const values=[
  {id:"income",emoji:"💵",label:t("Monthly income","الدخل الشهري"),value:money(overview.monthlyIncome),
   subtitle:t("Expected; confirmed received this month: ","متوقع؛ المستلم المؤكد هالشهر: ")+money(overview.receivedIncome),bg:"#EAF5E8",action:onIncome},
  {id:"plan",emoji:"🧺",label:t("Monthly spending plan","خطة مصروف الشهر"),value:money(overview.planned),
   subtitle:t("Usual + confirmed adjustments","المعتاد والتعديلات المؤكدة"),bg:"#EDF3FF",action:()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth",block:"start"})},
  {id:"paid",emoji:"✅",label:t("Paid so far","المدفوع لليوم"),value:money(overview.paid),
   subtitle:t("Confirmed expenses only","مصاريف مدفوعة فعلياً فقط"),bg:"#FFF0F5",action:onExpense},
  {id:"bills",emoji:"📅",label:t("Bills due · next 30 days","فواتير تستحق خلال ٣٠ يوم"),value:money(overview.billsDue),
   subtitle:t("Unpaid scheduled commitments","التزامات مجدولة غير مدفوعة"),bg:"#FFF6E6",action:onBills}
 ].filter(v=>v.id!=="bills"||overview.billsDue!==null);
 const recommendation=state.demo?
  t("Example finances are shown. Start with your actual family records before making decisions.","البيانات تجريبية، ابدأ بسجلات عيلتك الفعلية قبل اتخاذ أي قرار."):
  overview.financialInputsPartial||overview.monthlyIncome===null||overview.planned===null?
  t("Your picture is still partial. Add the missing essential amounts when convenient; no savings or cash availability is assumed.",
   "صورتك المالية بعدها جزئية. أضف مبالغ الأساسيات الناقصة لما تقدر؛ ما منفترض ادخار أو سيولة متاحة."):
  overview.reserveRiskDate?
  t("A possible dip below your chosen reserve appears around "+overview.reserveRiskDate+". Review dated payments and expected income.",
   "في احتمال نزول تحت الاحتياطي المدخل حوالي "+overview.reserveRiskDate+". راجع مواعيد الدفعات والدخل المتوقع."):
  overview.openingCash===null?
  t("Your spending plan is recorded. Add an optional actual cash balance to assess timing between payments.",
   "خطة مصاريفك مسجلة. فيك تدخل السيولة الفعلية اختيارياً لتقييم مواعيد الدفعات."):
  t("Your family figures are together here. Future spending is estimated, not an actual debit or a bank-confirmed balance.",
   "أرقام العيلة صارت بمكان واحد. الصرف المستقبلي تقديري، مش خصم فعلي ولا رصيد بنك مؤكد.");
 return <div className="space-y-3" data-testid="unified-money-dashboard">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h3 className="text-lg font-extrabold text-[#275E44]">{t("Your family's money this month","مالية العيلة بهالشهر")}</h3>
    <p className="text-xs text-[#738676]">{t("One picture · all amounts you recorded","صورة واحدة · كل الأرقام اللي دخلتها")}</p></div>
   <button type="button" onClick={onExpense}
    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#408F64] px-4 text-xs font-extrabold text-white">＋ {t("Add expense","سجّل مصروف")}</button>
  </div>
  <div className={values.length===4?"grid grid-cols-1 gap-2 sm:grid-cols-4":"grid grid-cols-1 gap-2 sm:grid-cols-3"}>{values.map(v=>
   <button type="button" key={v.id} onClick={v.action} data-testid={"money-summary-"+v.id}
    className="min-w-0 rounded-2xl border border-white p-3 text-start transition hover:ring-2 hover:ring-[#AED6B5]"
    style={{background:v.bg}}>
    <div className="flex items-center gap-2"><span className="text-xl" aria-hidden="true">{v.emoji}</span>
      <span className="text-xs font-bold leading-tight text-[#3F6450]">{v.label}</span></div>
    <strong className="mt-2 block break-words text-lg font-black tabular-nums text-[#316C4C] sm:text-xl">{v.value}</strong>
    <p className="mt-1 text-[10px] leading-relaxed text-[#718675]">{v.subtitle}</p>
   </button>)}</div>
  <SpendingMixDashboard state={state} onOpenCategory={onOpenCategory}/>
  <div className="rounded-2xl border border-[#DCEBDF] bg-[#F3F9F0] p-4">
   <h3 className="text-sm font-black text-[#315E45]">🌿 {t("What matters now","شو المهم هلّق؟")}</h3>
   <p className="mt-2 text-sm leading-relaxed text-[#5C7865]">{recommendation}</p>
   <div className="mt-3 flex flex-wrap items-center gap-2">
    <button type="button" onClick={overview.monthlyIncome===null||overview.financialInputsPartial?onIncome:onTimeline}
     className="min-h-11 rounded-xl bg-[#39875F] px-4 text-xs font-bold text-white">
     {overview.monthlyIncome===null||overview.financialInputsPartial?
      t("Review income and essentials","راجع الدخل والأساسيات"):
      t("Review upcoming cash flow","راجع السيولة الجاية")}
    </button>
    <details className="text-xs text-[#3C7C5A]">
     <summary className="flex min-h-11 cursor-pointer items-center px-3 font-semibold">
      {t("Cash & savings options (optional)","خيارات السيولة والادخار (اختيارية)")}
     </summary>
     <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border border-[#DCEADD] bg-white p-3">
      <span className="text-xs text-[#6E8272]">
       {t("Cash (manually entered)","سيولة مدخلة يدوياً")}: {money(overview.openingCash)}
       {" · "}{t("Savings target (not saved cash)","هدف ادخار وليس سيولة")}: {state.savingsTargetAmount!==undefined||state.savingsPct>0?
        money(state.savingsTargetAmount??Math.round((overview.monthlyIncome??0)*state.savingsPct)/100):t("Not set","غير محدد")}
      </span>
      <button type="button" className="min-h-10 rounded-xl border border-[#C9E0CD] bg-white px-3 font-bold text-[#347B56]"
       onClick={onCash}>{t("Edit cash","عدّل السيولة")}</button>
      <button type="button" className="min-h-10 rounded-xl border border-[#C9E0CD] bg-white px-3 font-bold text-[#347B56]"
       onClick={onSavings}>{t("Edit savings goal","تعديل هدف الادخار")}</button>
      <button type="button" className="min-h-10 rounded-xl border border-[#C9E0CD] bg-white px-3 font-bold text-[#347B56]"
       onClick={onIncome}>{t("Edit paydays","عدّل الرواتب")}</button>
     </div>
    </details>
   </div>
  </div>
  <p className="text-[11px] leading-relaxed text-[#738576]">
   {t("Category amounts automatically enter the future outlook as estimated weekly spending; dated bills linked to those categories take precedence to avoid duplicate costs.",
    "مخصصات الفئات بتدخل تلقائياً كتقدير صرف أسبوعي بالتوقعات؛ والفواتير المرتبطة بنفس الفئة إلها الأولوية حتى ما تنحسب التكلفة مرتين.")}</p>
 </div>;
}
