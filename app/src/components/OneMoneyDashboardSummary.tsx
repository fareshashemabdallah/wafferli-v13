import {useI18n} from "@/lib/i18n";
import {frenchUI} from "@/lib/french";
import type {MoneyState} from "@/lib/money";
import type {RhythmForecast} from "@/lib/familyMoneyRhythm";
import {moneyDashboardDecision} from "@/lib/moneyDashboardDecision";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {SpendingMixDashboard} from "./SpendingMixDashboard";

type Props={state:MoneyState;forecast:RhythmForecast;
 onIncome:()=>void;onExpense:()=>void;onBills:()=>void;onSpending:()=>void;onReviewUncategorized:()=>void;
 onOpenCategory:(categoryId:string)=>void;};
export function OneMoneyDashboardSummary({state,forecast,onIncome,onExpense,onBills,onSpending,onReviewUncategorized,onOpenCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:lang==="fr"?frenchUI(en):en;
 const {overview,unallocated,upcomingBill,next,planMayBeIncomplete,
  unclassifiedPlanned,unclassifiedPaid,unclassifiedCategoryId}=
  moneyDashboardDecision(state,forecast,localToday());
 const money=(value:number|null)=>value===null?t("Not entered","غير مدخل"):fmtJOD(value);
 const openCategories=()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth",block:"start"});
 const nextAction=()=>({
  income:onIncome,categories:openCategories,bills:onBills,spending:onSpending
 })[next.target]();
 const values=[
  {id:"income",emoji:"💵",label:t("Expected monthly income","الدخل الشهري المتوقع"),value:money(overview.monthlyIncome),
   subtitle:t("Received: ","المستلم: ")+money(overview.receivedIncome),bg:"#EAF5E8",action:onIncome},
  {id:"plan",emoji:"🧺",label:t("Monthly cost plan","خطة مصاريف الشهر"),value:money(overview.planned),
   subtitle:t("Includes planned category costs","تشمل تكاليف الفئات المخططة"),bg:"#EDF3FF",action:openCategories},
  {id:"paid",emoji:"✅",label:t("Recorded as paid","المسجّل كمدفوع"),value:money(overview.paid),
   subtitle:t("Only confirmed expense entries","فقط المصاريف المؤكدة"),bg:"#FFF0F5",action:onExpense}
 ];
 return <div className="space-y-3" data-testid="unified-money-dashboard">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h3 className="text-lg font-extrabold text-[#275E44]">{t("This month, at a glance","الشهر بنظرة سريعة")}</h3>
   <button type="button" onClick={onExpense}
    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#408F64] px-4 text-xs font-extrabold text-white">＋ {t("Add expense","سجّل مصروف")}</button>
  </div>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
   {values.map(v=><button type="button" key={v.id} onClick={v.action} data-testid={"money-summary-"+v.id}
    className="min-w-0 rounded-2xl border border-white p-3 text-start transition hover:ring-2 hover:ring-[#AED6B5]"
    style={{background:v.bg}}>
    <div className="flex items-center gap-1.5"><span className="text-lg" aria-hidden="true">{v.emoji}</span>
     <span className="text-[11px] font-bold leading-tight text-[#3F6450]">{v.label}</span></div>
    <strong className="mt-2 block break-words text-base font-black tabular-nums text-[#316C4C] sm:text-lg">{v.value}</strong>
    <p className="mt-1 text-[10px] leading-snug text-[#718675]">{v.subtitle}</p>
   </button>)}
   <div data-testid="money-summary-unallocated" className="min-w-0 rounded-2xl border border-[#E6E5D6] bg-[#FAF8EC] p-3">
    <div className="flex items-center gap-1.5">
     <span className="text-lg" aria-hidden="true">📊</span>
     <span className="text-[11px] font-bold leading-tight text-[#6D6747]">{unallocated===null?
      t("To be calculated","بانتظار البيانات"):unallocated<0?
      t("Monthly plan gap","عجز الخطة الشهرية"):
      t("Not yet allocated","غير مخصّص بعد")}</span>
    </div>
    <strong className={"mt-2 block break-words text-base font-black tabular-nums sm:text-lg "+(unallocated!==null&&unallocated<0?"text-[#A94D3C]":"text-[#6D6747]")}>
     {money(unallocated===null?null:Math.abs(unallocated))}
    </strong>
    <p className="mt-1 text-[10px] leading-snug text-[#817F6B]">{t("Income − category plans − paid costs without a category; not cash","الدخل ناقص خطط الفئات والمصاريف المدفوعة بلا فئة؛ وليس نقداً")}</p>
   </div>
  </div>
  {unallocated!==null&&<p className="text-[11px] leading-relaxed text-[#657C6B]" data-testid="money-unallocated-caution">
   {overview.uncategorizedPaid>0?
    t("Paid expenses without a category are deducted once from this planning difference, not added to the monthly category plan. It is not spendable cash.",
      "المصاريف المدفوعة دون فئة تُخصم مرة واحدة من فرق التخطيط، ولا تُضاف لخطة الفئات. هذا ليس نقداً متاحاً."):
    planMayBeIncomplete?
    t("Your plan is still partial. Unentered costs and savings goals can change this difference.",
      "خطتك ما زالت جزئية. المصاريف غير المدخلة وأهداف الادخار قد تغيّر هذا الفرق."):
    t("This is a planning difference, not money available to spend. Check savings, payment dates and actual cash.",
      "هذا فرق في التخطيط، وليس مبلغاً متاحاً للصرف. راجع الادخار ومواعيد الدفعات والنقد الفعلي.")}
  </p>}
  {!state.demo&&(overview.uncategorizedPaid>0||unclassifiedPlanned>0||unclassifiedPaid>0)&&
   <section data-testid="money-needs-categorization" aria-label={t("Amounts needing categorization","مبالغ بحاجة إلى تصنيف")}
    className="rounded-2xl border border-[#E7D8B6] bg-[#FFFCF5] p-3 sm:p-4">
    <h4 className="text-sm font-extrabold text-[#755E38]">{t("Money needing a clearer category","مصاريف بحاجة لتصنيف أوضح")}</h4>
    {overview.uncategorizedPaid>0&&<div className="mt-2 flex flex-wrap items-center justify-between gap-2" data-testid="money-uncategorized-paid">
     <div>
      <p className="text-xs font-bold text-[#755E38]">{t("Paid without a category","مدفوع دون فئة")}: <span className="tabular-nums">{fmtJOD(overview.uncategorizedPaid)}</span></p>
      <p className="mt-0.5 text-[11px] text-[#806F54]">{t("Already in Paid; outside category plans · ","ضمن المدفوع، وخارج خطط الفئات · ")}
       {overview.uncategorizedPaidCount} {t("record(s)","حركة")}</p>
     </div>
     <button type="button" data-testid="review-uncategorized-paid" onClick={onReviewUncategorized}
      className="min-h-10 rounded-xl border border-[#DBC697] bg-white px-3 text-xs font-bold text-[#7A613E]">
      {t("Review payments","راجع المصاريف")}</button>
    </div>}
    {(unclassifiedPlanned>0||unclassifiedPaid>0)&&<div className="mt-2 flex flex-wrap items-center justify-between gap-2" data-testid="money-unclassified-plan">
     <div>
      <p className="text-xs font-bold text-[#755E38]">{t("Categories still unclassified","فئات لم تُصنّف بعد")}</p>
      <p className="mt-0.5 text-xs tabular-nums text-[#755E38]">
       {t("Planned ","المخطط ")}{fmtJOD(unclassifiedPlanned)} · {t("Paid ","المدفوع ")}{fmtJOD(unclassifiedPaid)}</p>
      <p className="mt-0.5 text-[11px] text-[#806F54]">
       {t("Already inside category budgets and Paid; not an extra cost.",
         "محتسبة ضمن ميزانيات الفئات والمدفوع؛ ليست تكلفة إضافية.")}</p>
     </div>
     {unclassifiedCategoryId&&<button type="button" data-testid="review-unclassified-category"
      onClick={()=>onOpenCategory(unclassifiedCategoryId)}
      className="min-h-10 rounded-xl border border-[#DBC697] bg-white px-3 text-xs font-bold text-[#7A613E]">
      {t("Review category","راجع الفئة")}</button>}
    </div>}
   </section>}
  <div className="grid gap-2 sm:grid-cols-2">
   <section data-testid="money-upcoming-payment" aria-label={t("What is coming","ما القادم")}
    className="rounded-2xl border border-[#DCE8DC] bg-white p-3 sm:p-4">
    <h4 className="text-xs font-bold text-[#63836C]">{t("COMING UP","القادم")}</h4>
    {upcomingBill&&!state.demo?<>
     <p className="mt-1 text-sm font-extrabold text-[#295C43]">{upcomingBill.label}</p>
     <p className="mt-1 text-sm font-bold tabular-nums text-[#315B43]">
      {fmtJOD(Math.abs(upcomingBill.amountJod))} · {upcomingBill.overdue?
       t("Due date passed — check payment","تجاوز الموعد — تأكد من الدفع"):upcomingBill.date}
     </p>
     <p className="mt-1 text-[11px] text-[#718675]">{t("Outstanding scheduled amount; not an extra budget cost.",
      "المبلغ المجدول المتبقي، وليس تكلفة إضافية على الميزانية.")}</p>
    </>:<p className="mt-2 text-sm text-[#526F5C]">{t("No upcoming dated bill recorded in the next 30 days.",
     "لا توجد فاتورة قادمة بموعد مسجّل خلال ٣٠ يوماً.")}</p>}
   </section>
   <section data-testid="money-next-step" aria-label={t("One useful next step","خطوة عملية واحدة")}
    className="rounded-2xl border border-[#C8DDD0] bg-[#F3F9F2] p-3 sm:p-4">
    <h4 className="text-xs font-bold text-[#63836C]">{t("ONE USEFUL NEXT STEP","خطوة عملية واحدة")}</h4>
    <p className="mt-1 text-sm font-extrabold text-[#285F42]">{t(next.titleEn,next.titleAr)}</p>
    <p className="mt-1 text-xs leading-relaxed text-[#587461]">{t(next.detailEn,next.detailAr)}</p>
    <button type="button" onClick={nextAction} data-testid="money-next-action"
     className="mt-3 min-h-11 rounded-xl bg-[#408F64] px-4 text-xs font-extrabold text-white">
     {t(next.labelEn,next.labelAr)}
    </button>
   </section>
  </div>
  <SpendingMixDashboard state={state} onOpenCategory={onOpenCategory}/>
 </div>;
}
