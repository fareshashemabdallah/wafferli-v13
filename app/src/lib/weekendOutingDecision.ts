import {budgetAlignment} from "./financeAlignment";
import {computeMoney,type MoneyState} from "./money";
import {getMoneyOverview} from "./moneyOverview";
import {getFinancialReadiness} from "./financialReadiness";
import {roundJod} from "./cashflow";
import type {FamilyPreferences} from "./familyPreferences";

export type WeekendStatus="needs-details"|"review"|"possible";
export type WeekendMissing="real-budget"|"cash"|"cash-date"|"bills"|null;
export type WeekendOutingDecision={
 status:WeekendStatus; missing:WeekendMissing;
 weekendFrom:string; weekendTo:string;
 suggestedJod:number|null;
 recordedMarginJod:number|null; monthlyRoomJod:number|null;
 unpaidBillsJod:number|null; essentialBudgetJod:number|null; emergencyReserveJod:number|null;
 cashJod:number|null;
 headlineEn:string;headlineAr:string;explanationEn:string;explanationAr:string;
 nextEn:string;nextAr:string;
};
/** Friday/Saturday are weekend days in Jordan. Pure local dates, no UTC rollover. */
export function nextJordanWeekend(now=new Date()):{from:string;to:string}{
 const day=now.getDay(),offset=day===5?0:day===6?-1:(5-day+7)%7;
 const friday=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset,12);
 const saturday=new Date(friday.getFullYear(),friday.getMonth(),friday.getDate()+1,12);
 const iso=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),
  String(d.getDate()).padStart(2,"0")].join("-");
 return {from:iso(friday),to:iso(saturday)};
}
const roundDown5=(v:number)=>Math.floor((v+1e-8)/5)*5;
const leisure=/out(?:ing|ings)?|entertain|recreat|fun|activities|leisure|trip|park|cinema|طلعة|طلعات|نزهة|ترفيه|خروج|نشاط|نشاطات/i;
/** Conservative planning conversation, not an account, affordability or safety verdict.
 * Never reconstruct spendable bank cash from monthly budgets or unverified income.
 */
export function decideWeekendOuting(
 money:MoneyState,prefs:FamilyPreferences,now=new Date()
):WeekendOutingDecision{
 const weekend=nextJordanWeekend(now),readiness=getFinancialReadiness(money,now);
 const base={weekendFrom:weekend.from,weekendTo:weekend.to};
 const updated=money.cashUpdatedAt&&/^\d{4}-\d{2}-\d{2}$/.test(money.cashUpdatedAt)?
  new Date(money.cashUpdatedAt+"T12:00:00"):null;
 const freshWeekend=readiness.cashFresh&&!!updated&&
  now.getTime()-updated.getTime()>=-86400000&&now.getTime()-updated.getTime()<=3*86400000;
 const missing:WeekendMissing=money.demo||!readiness.budgetReady?"real-budget":
  !readiness.cashKnown?"cash":
  !freshWeekend?"cash-date":
  !readiness.billsReviewed?"bills":null;
 const oneMissing:Record<Exclude<WeekendMissing,null>,[string,string,string,string]>={
  "real-budget":[
   "Start with your family's actual monthly plan","بلّش بميزانية العائلة الفعلية",
   "We only have sample or incomplete monthly figures. I can't judge whether an outing fits yet.",
   "الأرقام الشهرية الحالية تجريبية أو ناقصة. ما فيني أحدد إذا الطلعة مناسبة بعد."
  ],
  "cash":[
   "One thing is missing: today's cash balance","ناقصنا معلومة واحدة: الرصيد الحالي",
   "Your monthly plan isn't the cash available today. Enter today's combined cash and accessible bank balance to check the recorded bills and cushion.",
   "خطة الشهر مش هي الرصيد المتاح اليوم. سجّل النقد ورصيد البنك المتاح حتى نراجع الفواتير والاحتياطي."
  ],
  "cash-date":[
   "Can you confirm today's cash balance?","فينا نأكد رصيد اليوم؟",
   "The saved balance is older than the freshness check. Confirm or update it before relying on an outing budget.",
   "الرصيد المسجل قديم. أكّده أو حدّثه قبل الاعتماد على ميزانية للطلعة."
  ],
  "bills":[
   "Which unpaid bills are coming up?","شو الفواتير اللي بعد ما اندفعت؟",
   "We need dated unpaid bills—or your confirmation that none are due this month—before comparing an outing against your cash reserve.",
   "بدنا الفواتير غير المدفوعة بمواعيدها، أو تأكيد ما في فواتير هالشهر، قبل تقييم مصروف الطلعة."
  ]
 };
 if(missing){
  const [headlineEn,headlineAr,explanationEn,explanationAr]=oneMissing[missing];
  return {...base,status:"needs-details",missing,suggestedJod:null,recordedMarginJod:null,
   monthlyRoomJod:null,unpaidBillsJod:null,essentialBudgetJod:null,emergencyReserveJod:null,cashJod:null,
   headlineEn,headlineAr,explanationEn,explanationAr,
   nextEn:missing==="cash"||missing==="cash-date"?"Enter or confirm one cash balance":"Review the missing money detail",
   nextAr:missing==="cash"||missing==="cash-date"?"أدخل أو أكّد الرصيد":"راجع المعلومة الناقصة"};
 }
 const budget=budgetAlignment(money,now),month=computeMoney(money,now),overview=getMoneyOverview(money,now);
 const reserve=Number.isFinite(money.cashReserve)&&money.cashReserve!>=0?money.cashReserve!:0;
 const cash=money.cashOnHand!;
 const upcoming=overview.forecast.upcomingBills;
 const categories=money.categories.filter(x=>leisure.test(x.name));
 // Do not double-count a category whose scheduled bill is already deducted.
 // Remaining *non-bill* category envelopes are estimates of essentials yet
 // to be paid; treating them as spending capacity would be misleading.
 const billLinked=new Set((money.commitments??[]).map(x=>x.categoryId).filter(Boolean));
 const essentials=roundJod(money.categories.filter(x=>!leisure.test(x.name)&&!billLinked.has(x.id))
  .reduce((sum,x)=>sum+Math.max(0,month.plannedBy(x.id)-month.spentBy(x.id)),0));
 const recordedMargin=roundJod(cash-upcoming-essentials-reserve);
 const leisureLeft=roundJod(categories.reduce((sum,x)=>
  sum+Math.max(0,month.plannedBy(x.id)-month.spentBy(x.id)),0));
 // A leisure envelope already exists? Don't additionally count unallocated
 // monthly margin; choose one funding basis, never add both.
 const monthlyRoom=categories.length?leisureLeft:Math.max(0,budget.gap);
 const reserveLow=overview.forecast.minimumBalance;
 const cautious=overview.dateProblems>0||overview.forecast.overdueCount>0||
  budget.status==="deficit"||recordedMargin<=0||reserve<=0||
  reserveLow===null||reserveLow<reserve||monthlyRoom<=0;
 const preferred=Number.isFinite(prefs.outingLimit)&&prefs.outingLimit>0?
  prefs.outingLimit:Infinity;
 // Retain 20% of the smaller planning allowance to avoid consuming every
 // recorded JOD. This is not a guarantee: everyday costs may be unrecorded.
 const possible=Math.min(preferred,recordedMargin,monthlyRoom,
  reserveLow===null?0:reserveLow-reserve);
 // Hold back at least 30% of the smallest recorded margin, even after
 // deducting remaining essential categories, before suggesting a test budget.
 const suggested=cautious?null:roundDown5(Math.max(0,possible)*0.7);
 const good=suggested!==null&&suggested>=5;
 const noReserve=reserve===0;
 const detailsEn="Entered cash "+roundJod(cash).toFixed(2)+
  " JOD − unpaid dated bills "+roundJod(upcoming).toFixed(2)+
  " JOD − remaining non-bill planned costs "+essentials.toFixed(2)+
  " JOD − chosen cushion "+roundJod(reserve).toFixed(2)+
  " JOD = "+recordedMargin.toFixed(2)+" JOD recorded margin. "+
  (categories.length?"Unspent recorded leisure envelope: ":"Unassigned monthly plan: ")+
  monthlyRoom.toFixed(2)+" JOD. "+
  (noReserve?"No emergency cushion was set. ":"")+
  "Cash, payments, current prices and unrecorded expenses have not been verified.";
 const detailsAr="الرصيد المسجّل "+roundJod(cash).toFixed(2)+
  " د.أ − الفواتير المؤرخة غير المدفوعة "+roundJod(upcoming).toFixed(2)+
  " د.أ − باقي المصاريف المخططة غير المدرجة كفواتير "+essentials.toFixed(2)+
  " د.أ − الاحتياطي المختار "+roundJod(reserve).toFixed(2)+
  " د.أ = "+recordedMargin.toFixed(2)+" د.أ هامشاً حسب البيانات المسجلة. "+
  (categories.length?"المتبقي المخطط للترفيه: ":"غير المخصّص بميزانية الشهر: ")+
  monthlyRoom.toFixed(2)+" د.أ. "+
  (noReserve?"ما تم تحديد احتياطي للطوارئ. ":"")+
  "الرصيد والدفع والأسعار والمصاريف غير المسجلة غير مؤكدة.";
 if(!good)return {...base,status:"review",missing:null,suggestedJod:null,
  recordedMarginJod:recordedMargin,monthlyRoomJod:monthlyRoom,unpaidBillsJod:upcoming,
  essentialBudgetJod:essentials,emergencyReserveJod:reserve,cashJod:cash,
  headlineEn:"I'd keep this outing low-cost for now",headlineAr:"الأفضل تخلي الطلعة قليلة الكلفة حالياً",
  explanationEn:detailsEn,explanationAr:detailsAr,
  nextEn:"Look for free or low-cost activities; review any overdue bills or budget pressure first.",
  nextAr:"دور على نشاطات مجانية أو قليلة الكلفة وراجع أي فواتير متأخرة أو ضغط على الميزانية أولاً."};
 return {...base,status:"possible",missing:null,suggestedJod:suggested,
  recordedMarginJod:recordedMargin,monthlyRoomJod:monthlyRoom,unpaidBillsJod:upcoming,
  essentialBudgetJod:essentials,emergencyReserveJod:reserve,cashJod:cash,
  headlineEn:"A modest outing may fit your recorded plan",headlineAr:"طلعة بسيطة ممكن تناسب الخطة المسجّلة",
  explanationEn:detailsEn,explanationAr:detailsAr,
  nextEn:"Try a total-family planning ceiling of "+suggested.toFixed(0)+
   " JOD, including tickets, food and transport. This is a cautious estimate—not confirmed money available to spend.",
  nextAr:"جرّب سقف تخطيط قدره "+suggested.toFixed(0)+
   " د.أ للعائلة كلها مع التذاكر والأكل والمواصلات. هذا تقدير بحذر، وليس رصيداً مؤكداً للإنفاق."};
}
