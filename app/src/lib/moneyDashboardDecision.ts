import type {MoneyState} from "./money";
import type {RhythmForecast} from "./familyMoneyRhythm";
import {roundJod} from "./cashflow";
import {oneMoneyDashboard} from "./oneMoneyDashboard";
import {spendingMixSummary} from "./spendingMixSummary";

/** Read-only priorities derived from the original family ledger and forecast.
 * No second budget, due-date record, payment entry, or bank balance is created.
 */
export type MoneyDashboardAction={
 kind:"demo"|"income"|"categories"|"overdue"|"cash-risk"|"bill"|"dates"|"first-bill"|"review";
 titleEn:string;titleAr:string;detailEn:string;detailAr:string;
 labelEn:string;labelAr:string;target:"income"|"categories"|"bills"|"spending";
};
export function moneyDashboardDecision(state:MoneyState,forecast:RhythmForecast,today:string){
 const overview=oneMoneyDashboard(state,forecast,today);
 const mix=spendingMixSummary(state,today.slice(0,7));
 const unclassifiedRows=mix.unassigned.filter(row=>row.kind==="unclassified");
 const unclassifiedPlanned=mix.unclassified;
 const unclassifiedPaid=roundJod(unclassifiedRows.reduce((sum,row)=>sum+row.paid,0));
 const mostUnclassified=unclassifiedRows.filter(row=>row.planned>0||row.paid>0)
  .sort((a,b)=>Math.max(b.planned,b.paid)-Math.max(a.planned,a.paid))[0];
 // Paid expenses without a current category do not have a category budget.
 // Account for these once in the planning margin, but do NOT subtract paid
 // expenses that are already inside a category plan or double-count bills.
 const unallocated=overview.monthlyIncome!==null&&overview.planned!==null?
  roundJod(overview.monthlyIncome-overview.planned-overview.uncategorizedPaid):null;
 // Scheduled bills are often already included in the category plan; never
 // subtract them again from unallocated or call the difference "cash".
 const upcomingBill=forecast.events.filter(e=>
  (e.kind==="bill"||e.kind==="annual")&&e.amountJod<0)
  .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))[0]??null;
 const action=(kind:MoneyDashboardAction["kind"],titleEn:string,titleAr:string,
  detailEn:string,detailAr:string,labelEn:string,labelAr:string,
  target:MoneyDashboardAction["target"]):MoneyDashboardAction=>
  ({kind,titleEn,titleAr,detailEn,detailAr,labelEn,labelAr,target});
 let next:MoneyDashboardAction;
 if(state.demo){
  next=action("demo","Explore the example plan","جرّب الخطة التجريبية",
   "These are fictional figures. Review a category to see how the plan works.",
   "هذه أرقام تجريبية. راجع إحدى الفئات لتشوف كيف تعمل الخطة.",
   "Explore categories","استكشف الفئات","categories");
 }else if(overview.monthlyIncome===null){
  next=action("income","Add expected income","أضف الدخل المتوقع",
   "One monthly estimate is enough to start. It is not a confirmed receipt.",
   "تقدير واحد للشهر يكفي للبداية، لكنه ليس دخلاً مستلماً.",
   "Enter income","أدخل الدخل","income");
 }else if(!overview.hasCategoryPlan){
  next=action("categories","Start with one spending category","ابدأ بفئة مصروف واحدة",
   "Add the costs you know. Missing costs will remain unknown.",
   "أضف المصاريف التي تعرفها. المصاريف الناقصة تبقى غير معروفة.",
   "Add a category","أضف فئة","categories");
 }else if(upcomingBill?.overdue){
  next=action("overdue","Check an unconfirmed payment","راجع دفعة غير مؤكدة",
   upcomingBill.label+" may still need payment confirmation. Dabberna does not verify payments with providers.",
   "قد تحتاج دفعة "+upcomingBill.label+" إلى تأكيد السداد. دبّرنا لا يتحقق من الدفع لدى المزوّد.",
   "Review payment","راجع الدفعة","bills");
 }else if(forecast.cashStart!==null&&forecast.missingDates===0&&forecast.firstReserveRiskDate){
  next=action("cash-risk","Review a possible cash-flow dip","راجع احتمال انخفاض السيولة",
   "Your entered cash and scheduled dates suggest a possible dip below your chosen reserve. Expected income is not guaranteed.",
   "رصيدك المدخل والمواعيد المسجلة يشيران لاحتمال انخفاض السيولة تحت الاحتياطي. الدخل المتوقع غير مضمون.",
   "Review payment dates","راجع مواعيد الدفعات","bills");
 }else if(upcomingBill){
  next=action("bill","A scheduled payment is coming","دفعة مجدولة قادمة",
   "Check the timing of "+upcomingBill.label+". It may already be included in your monthly spending plan.",
   "راجع موعد "+upcomingBill.label+". قد تكون هذه الدفعة ضمن خطة مصاريف الشهر.",
   "Review this payment","راجع هذه الدفعة","bills");
 }else if(forecast.missingDates>0){
  next=action("dates","One payment date needs checking","موعد مالي بحاجة للمراجعة",
   "Some payments or income dates are missing, so the outlook is incomplete.",
   "بعض مواعيد الدفعات أو الدخل ناقصة، والتوقعات المالية غير مكتملة.",
   "Review dates","راجع المواعيد","bills");
 }else if(!(state.commitments??[]).length&&state.noBillsConfirmedMonth!==today.slice(0,7)){
  next=action("first-bill","Add your next payment date","سجّل موعد الدفعة القادمة",
   "A monthly category budget alone does not establish when a bill is due.",
   "ميزانية الفئة الشهرية لا تحدد وحدها موعد استحقاق الفاتورة.",
   "Add a bill","أضف فاتورة","bills");
 }else{
  next=action("review","Check your recorded spending","راجع مصاريفك المسجلة",
   "See what was actually paid, separately from planned amounts.",
   "راجع ما دُفع فعلياً بشكل منفصل عن المبالغ المخططة.",
   "Review spending","راجع المصاريف","spending");
 }
 return {overview,unallocated,upcomingBill,next,
  unclassifiedPlanned,unclassifiedPaid,
  unclassifiedCategoryId:mostUnclassified?.categoryId??null,
  planMayBeIncomplete:state.financialInputsPartial===true};
}
