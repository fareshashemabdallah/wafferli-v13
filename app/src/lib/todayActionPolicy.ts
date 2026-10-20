import {assessFinancialReality} from "./financialReality";
import {getMoneyOverview} from "./moneyOverview";
import {allFamilyMoments,dateKey,shiftDays,upcomingMoments,type FamilyMoment} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import {planKey} from "./occasionAdvisor";
import type {MoneyState,Member} from "./money";
import type {FamilyPlan} from "./familyPlans";
import type {FamilyPreferences} from "./familyPreferences";

/** Today is one read-only interpretation, not a fifth store or duplicate
 * decision workflow. All specialist pages keep their own existing records. */
export type TodayAction={
 kind:"bill"|"financial"|"gift"|"occasion"|"plan";
 id:string;
 titleEn:string;titleAr:string;detailEn:string;detailAr:string;
 actionEn:string;actionAr:string;
 route:"/money"|"/occasions"|"/explore/smartbuy"|"/plans";
 whyEn:string;whyAr:string;
 date?:string;planId?:string;occasionKey?:string;
 giftEstimateJod?:number;sellerCount?:number;
};
export type TodayWeekItem={
 id:string;title:string;date:string;type:"bill"|"moment"|"plan";
 route:"/money"|"/occasions"|"/plans";planId?:string;occasionKey?:string;
};
export type TodayBrief={
 action:TodayAction|null;
 week:TodayWeekItem[];
 moneyStatus:"demo"|"partial"|"risk"|"estimated";
 cashVerified:false;
 upcomingBillsJod:number|null;
 monthPaidJod:number|null;
 plannedGiftJod:number|null;
};
const daysFrom=(date:string,now:Date)=>Math.round(
 (new Date(date+"T12:00:00").getTime()-new Date(now.getFullYear(),now.getMonth(),now.getDate(),12).getTime())/86400000
);
export function buildTodayActionPolicy(input:{
 money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 plans:readonly FamilyPlan[];preferences:FamilyPreferences;now?:Date;
}):TodayBrief{
 const now=input.now??new Date(),today=dateKey(now);
 const {money,plans,preferences}=input;
 const overview=getMoneyOverview(money,now,plans);
 const reality=assessFinancialReality(money,plans,now);
 const bills=money.demo?[]:overview.forecast.events
  .filter(e=>e.kind==="bill"&&e.displayDate<=dateKey(shiftDays(now,14)))
  .sort((a,b)=>a.displayDate.localeCompare(b.displayDate));
 const moments=preferences.lifestyle?upcomingMoments(
  allFamilyMoments([...input.moments],realFamilyMembers(input.members)),now,22):[];
 const upcomingPlans=plans.filter(p=>p.status!=="completed"&&p.date&&
  p.date>=today&&p.date<=dateKey(shiftDays(now,21)))
  .slice().sort((a,b)=>a.date!.localeCompare(b.date!));
 const candidates:Array<{rank:number;date:string;item:TodayAction}>=[];
 const add=(rank:number,date:string,item:TodayAction)=>candidates.push({rank,date,item});
 if(!money.demo){
  const first=bills[0];
  if(first?.overdue){
   add(0,first.displayDate,{
    kind:"bill",id:"overdue:"+first.key,titleEn:"A recorded bill needs checking",
    titleAr:"فاتورة مسجلة بحاجة لمراجعة",
    detailEn:first.name+" was due "+first.displayDate+". Check whether it was paid; provider status isn't verified.",
    detailAr:"موعد "+first.name+" كان "+first.displayDate+". تأكد إذا تم الدفع؛ حالة السداد ليست مؤكدة من الجهة.",
    actionEn:"Review this bill",actionAr:"راجع هذه الفاتورة",route:"/money",
    whyEn:"Recorded due date has passed",whyAr:"تجاوز موعد الاستحقاق المدخل",date:first.displayDate
   });
  }
  if(reality.kind==="essentials-gap"||reality.kind==="plan-gap"||
     reality.kind==="tight"||reality.forecastCashRisk){
   add(reality.kind==="essentials-gap"||reality.forecastCashRisk?1:3,today,{
    kind:"financial",id:"financial:"+reality.kind,
    titleEn:reality.titleEn,titleAr:reality.titleAr,
    detailEn:reality.messageEn,detailAr:reality.messageAr,
    actionEn:reality.actionEn,actionAr:reality.actionAr,route:"/money",
    whyEn:"Based only on the costs and dates you entered",
    whyAr:"حسب التكاليف والمواعيد التي أدخلتها"
   });
  }
  const due=bills.find(x=>!x.overdue&&daysFrom(x.displayDate,now)<=3);
  if(due){
   add(2,due.displayDate,{
    kind:"bill",id:"due:"+due.key,
    titleEn:"A bill is due soon",titleAr:"فاتورة قريبة الاستحقاق",
    detailEn:due.name+" is recorded for "+due.displayDate+". Confirm its payment status before making new commitments.",
    detailAr:"موعد "+due.name+" المسجل هو "+due.displayDate+". تأكد من الدفع قبل التزامات جديدة.",
    actionEn:"Check this payment",actionAr:"راجع هذه الدفعة",route:"/money",
    whyEn:"Due within three days",whyAr:"تستحق خلال ثلاثة أيام",date:due.displayDate
   });
  }
 }
 for(const moment of moments){
  const key=planKey(moment);
  const plan=plans.find(p=>p.sourceRef==="occasion:"+key);
  if(plan?.status==="completed")continue;
  const gift=plan?.occasionPreparation?.gift;
  const paid=!!plan&&money.expenses.some(e=>e.status!=="planned"&&
   e.sourcePlanId===plan.id&&e.sourceOccasionCost==="gift");
  const day=daysFrom(moment.occursOn,now);
  if(day>21)continue;
  if(gift&&gift.amountJod>0&&gift.description.trim().length>=2&&!paid){
   add(5,moment.occursOn,{
    kind:"gift",id:"gift:"+key,
    titleEn:moment.title,titleAr:moment.title,
    detailEn:gift.selectedQuote?
     "A seller option is saved for the gift. Review it, then record a payment only after you actually pay.":
     "The gift and its estimate are saved. Compare seller options before choosing; no payment has been recorded.",
    detailAr:gift.selectedQuote?
     "حفظت خياراً للهدية. راجعه، ولا تسجّل الدفع إلا بعد دفع المبلغ فعلياً.":
     "الهدية وتقدير تكلفتها محفوظان. قارن الأسعار قبل الاختيار؛ لم يُسجل أي دفع.",
    actionEn:gift.selectedQuote?"Review gift choice":"Compare gift options",
    actionAr:gift.selectedQuote?"راجع خيار الهدية":"قارن خيارات الهدية",
    route:"/explore/smartbuy",date:moment.occursOn,planId:plan!.id,occasionKey:key,
    giftEstimateJod:gift.amountJod,sellerCount:gift.selectedQuote?1:0,
    whyEn:"Your family's saved occasion is approaching",
    whyAr:"المناسبة المحفوظة لعيلتك اقتربت"
   });
  }else if(!plan?.occasionPreparation&&day<=14){
   add(7,moment.occursOn,{
    kind:"occasion",id:"occasion:"+key,
    titleEn:moment.title,titleAr:moment.title,
    detailEn:"You have an upcoming family occasion. Prepare it only if useful to your family.",
    detailAr:"لديك مناسبة عائلية قادمة. حضّر لها إذا كان ذلك مناسباً لعيلتك.",
    actionEn:"Prepare this occasion",actionAr:"حضّر هذه المناسبة",
    route:"/occasions",date:moment.occursOn,occasionKey:key,
    whyEn:"Saved in your family calendar",whyAr:"محفوظة في تقويم العائلة"
   });
  }
 }
 for(const plan of upcomingPlans){
  if(plan.kind==="occasion")continue; // The calendar occasion has its own canonical action.
  add(9,plan.date!,{
   kind:"plan",id:"plan:"+plan.id,titleEn:plan.title,titleAr:plan.title,
   detailEn:"Continue your saved family plan. Nothing here marks it paid or booked.",
   detailAr:"تابع خطة العيلة المحفوظة. هذه الخطوة لا تؤكد الدفع أو الحجز.",
   actionEn:"Continue this plan",actionAr:"تابع الخطة",route:"/plans",
   date:plan.date!,planId:plan.id,
   whyEn:"Coming up in your saved plans",whyAr:"قريبة ضمن خطط العيلة"
  });
 }
 const dueWeek=bills.filter(x=>x.displayDate<=dateKey(shiftDays(now,7)))
  .map(x=>({id:"bill:"+x.key,title:x.name,date:x.displayDate,type:"bill" as const,route:"/money" as const}));
 const momentWeek=moments.filter(x=>x.occursOn<=dateKey(shiftDays(now,7)))
  .map(x=>({id:"occasion:"+planKey(x),title:x.title,date:x.occursOn,
   type:"moment" as const,route:"/occasions" as const,occasionKey:planKey(x)}));
 const planWeek=upcomingPlans.filter(x=>x.kind!=="occasion"&&x.date!<=dateKey(shiftDays(now,7)))
  .map(x=>({id:"plan:"+x.id,title:x.title,date:x.date!,
   type:"plan" as const,route:"/plans" as const,planId:x.id}));
 const week:TodayWeekItem[]=[...dueWeek,...momentWeek,...planWeek]
  .sort((a,b)=>a.date.localeCompare(b.date))
  .filter((x,i,all)=>all.findIndex(y=>y.id===x.id)===i).slice(0,3);
 const action=candidates.sort((a,b)=>a.rank-b.rank||a.date.localeCompare(b.date))[0]?.item??null;
 const gift=action?.kind==="gift"?action.giftEstimateJod:null;
 const bill7=money.demo?null:overview.billsNext7Days;
 return {action,week,moneyStatus:money.demo?"demo":
  reality.kind==="essentials-gap"||reality.kind==="plan-gap"||reality.kind==="tight"||reality.forecastCashRisk?
  "risk":reality.kind==="unknown"||money.financialInputsPartial?"partial":"estimated",
  cashVerified:false,
  upcomingBillsJod:bill7,monthPaidJod:money.demo?null:overview.month.spent,
  plannedGiftJod:gift??null};
}
