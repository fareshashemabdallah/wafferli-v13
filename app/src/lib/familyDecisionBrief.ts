import {dateKey,shiftDays,upcomingMoments,allFamilyMoments,type FamilyMoment} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import {assessImmediateSpending} from "./spendingScenario";
import {taskSummary,type FamilyTask} from "./familyTasks";
import type {MoneyState,Member} from "./money";
import type {FamilyPreferences} from "./familyPreferences";
import type {FamilyPlan} from "./familyPlans";
import {nextWishlistReminder} from "./wishlistAttention";
import type {WishlistItem} from "./familyWishlist";
export type DecisionStep={
 id:string;titleEn:string;titleAr:string;detailEn:string;detailAr:string;
 link:"/money"|"/plans"|"/calendar"|"/space"|"/explore/together"|"/explore/market"|"/occasions";
 urgency:"important"|"normal";
};
export type FamilyDecisionBrief={
 titleEn:string;titleAr:string;
 contextEn:string;contextAr:string;
 steps:DecisionStep[];
 notesEn:string;notesAr:string;
};
export function buildFamilyDecisionBrief(input:{
 money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 plans:readonly FamilyPlan[];tasks:readonly FamilyTask[];wishlist?:readonly WishlistItem[];preferences:FamilyPreferences;
 now?:Date
}):FamilyDecisionBrief {
 const now=input.now??new Date(),today=dateKey(now),end=dateKey(shiftDays(now,14));
 const p=input.preferences;
 const upcomingPlans=input.plans.filter(x=>x.status!=="completed"&&x.date&&x.date>=today&&x.date<=end)
  .sort((a,b)=>(a.date??"").localeCompare(b.date??""));
 const first=upcomingPlans[0];
 const moneyAllowed=p.financeTips&&!input.money.demo;
 const lifeAllowed=p.lifestyle;
 const upcoming=lifeAllowed?upcomingMoments(allFamilyMoments([...input.moments],
  realFamilyMembers(input.members)),now,15):[];
 const tasks=lifeAllowed?taskSummary(input.tasks,now):null;
 // Shopping is separately opt-in, even when family-life suggestions are enabled.
 const wishlist=p.shoppingTips?nextWishlistReminder(input.wishlist??[],now):null;
 const steps:DecisionStep[]=[];
 const add=(step:DecisionStep)=>{if(!steps.some(x=>x.id===step.id))steps.push(step);};
 let hasCashRisk=false;
 if(moneyAllowed&&first){
  const cost=first.choice?.estimatedJod??first.budgetJod;
  if(cost!==undefined&&cost>0){
   const check=assessImmediateSpending(input.money,cost,now);
   if(check.outcome!=="provisional"){
    hasCashRisk=true;
    add({id:"cash-review",urgency:"important",
     titleEn:"Check the budget before making a commitment",titleAr:"راجع الميزانية قبل أي التزام",
     detailEn:check.outcome==="unknown"?
      "A planned amount exists, but cash information is incomplete or stale. The app cannot assess it safely.":
      "Your recorded dated cash flow may be pressured by this additional plan. Recheck assumptions before spending.",
     detailAr:check.outcome==="unknown"?
      "هناك تكلفة مخططة لكن بيانات السيولة ناقصة أو قديمة؛ لا يمكن تقييمها بأمان.":
      "قد تؤثر هذه الخطة على السيولة المسجّلة. راجع التواريخ والمبالغ قبل الدفع.",
     link:"/money"});
   }
  }else if(p.financeTips){
   add({id:"plan-cost",urgency:"important",
    titleEn:"Estimate the full cost of your upcoming plan",titleAr:"قدّر التكلفة الكاملة للخطة القادمة",
    detailEn:"Include transport, fees and other extras before choosing.",
    detailAr:"احسب النقل والرسوم والتكاليف الإضافية قبل الاختيار.",link:"/plans"});
  }
 }
 if(lifeAllowed&&tasks&&(tasks.overdue>0||tasks.dueSoon>0)){
  add({id:"tasks",urgency:tasks.overdue>0?"important":"normal",
   titleEn:tasks.overdue>0?"Review overdue responsibilities":"Check this week's family tasks",
   titleAr:tasks.overdue>0?"راجع مهام العائلة المتأخرة":"راجع مهام العائلة القريبة",
   detailEn:tasks.overdue>0?tasks.overdue+" overdue local task(s) need review.":
    tasks.dueSoon+" task(s) are due within seven days.",
   detailAr:tasks.overdue>0?tasks.overdue+" مهام محلية متأخرة تحتاج للمراجعة.":
    tasks.dueSoon+" مهام خلال سبعة أيام.",link:"/space"});
 }
 if(wishlist){
  const {item,daysUntil,priceStatus,overBudget}=wishlist;
  // This is an entered intention, not a bill, merchant offer or recorded expense.
  const amount=item.budgetJod;
  const cashCheck=moneyAllowed&&typeof amount==="number"&&amount>0?
   assessImmediateSpending(input.money,amount,now).outcome:null;
  const caution=cashCheck==="review"||cashCheck==="unknown";
  const gift=item.kind==="gift";
  const priceNote=overBudget?
   "The last manually recorded price exceeds your chosen ceiling.":
   priceStatus==="missing"?"You have not recorded a price yet.":
   priceStatus==="stale"?"Your last manually checked price may be outdated.":
   "Recheck the recorded price with the seller.";
  const priceNoteAr=overBudget?
   "آخر سعر أدخلته يتجاوز السقف الذي حددته.":
   priceStatus==="missing"?"لم تسجّل سعراً بعد.":
   priceStatus==="stale"?"السعر الذي سجلته قديم ويحتاج مراجعة.":
   "تأكد من السعر المسجّل مع المتجر.";
  add({id:"shopping",urgency:overBudget||caution||daysUntil<=3?"important":"normal",
   titleEn:gift?"Prepare an upcoming gift thoughtfully":"Review an upcoming family purchase",
   titleAr:gift?"حضّر هدية قريبة بميزانية واضحة":"راجع مشتريات العائلة القادمة",
   detailEn:item.name+" — "+(daysUntil<0?"the planned date has passed":daysUntil===0?
    "planned for today":"planned in "+daysUntil+" day(s)")+". "+priceNote+
    (caution?" Check entered cash and bills before committing; this is not a verified affordability decision.":"")+
    (gift&&upcoming.length?" Check whether this gift relates to your upcoming family date.":""),
   detailAr:item.name+" — "+(daysUntil<0?"تجاوز الموعد المخطط":daysUntil===0?
    "الموعد اليوم":"بعد "+daysUntil+" يوم")+". "+priceNoteAr+
    (caution?" راجع الرصيد والفواتير قبل أي التزام؛ ليس هذا تأكيداً للقدرة المالية.":"")+
    (gift&&upcoming.length?" تأكد إن كانت الهدية مرتبطة بمناسبتك القريبة.":""),
   link:wishlist.link});
 }
 if(lifeAllowed&&upcoming.length){
  const event=upcoming[0]!;
  add({id:"occasion",urgency:"normal",
   titleEn:"Prepare for an important family date",titleAr:"جهّز لمناسبة عائلية",
   detailEn:event.title+" is on "+event.occursOn+". Plan what matters without automatically spending your full budget.",
   detailAr:event.title+" بتاريخ "+event.occursOn+". خطط لما يهمكم دون إنفاق الميزانية بالكامل.",
   link:"/calendar"});
 }
 if(lifeAllowed&&first){
  add({id:"plan",urgency:"normal",
   titleEn:"Review the next family plan",titleAr:"راجع الخطة العائلية القادمة",
   detailEn:first.title+" on "+first.date+". Confirm real availability and costs before booking.",
   detailAr:first.title+" بتاريخ "+first.date+". تحقق من الأسعار والتوفر قبل الحجز.",
   link:"/plans"});
 }
 if(lifeAllowed&&!first&&!upcoming.length&&!(tasks&&tasks.open)){
  add({id:"outing",urgency:"normal",
   titleEn:"Consider a simple family experience",titleAr:"فكّر بطلعة بسيطة مع العائلة",
   detailEn:"Choose whether children are attending and set a comfortable maximum first. No prices or venues are assumed.",
   detailAr:"اختر إذا كان الأطفال سيشاركون وحدد سقفاً مناسباً. لا نفترض أسعاراً أو أماكن محددة.",
   link:"/explore/together"});
 }
 if(!steps.length){
  add({id:"setup",urgency:"normal",
   titleEn:"Decide what you want Dabberna to help with",titleAr:"حدد المجالات التي تريد مساعدة دبّرنا فيها",
   detailEn:"Review family-life preferences and enter genuine information only when comfortable.",
   detailAr:"راجع تفضيلات العائلة وأدخل معلومات فعلية فقط إذا كنت مرتاحاً.",link:"/space"});
 }
 return {
  titleEn:hasCashRisk?"Protect what matters before you spend":"A thoughtful plan for your family",
  titleAr:hasCashRisk?"احمِ التزامات العائلة قبل المصروف":"خطة متوازنة لعيلتك",
  contextEn:hasCashRisk?"Your upcoming plans connect to a financial readiness question.":
   "These suggestions connect only the dates, plans and preferences you chose to record.",
  contextAr:hasCashRisk?"الخطط القادمة ترتبط بحاجة لمراجعة السيولة.":
   "هذه الخطوات تربط فقط المواعيد والخطط والتفضيلات التي أدخلتها.",
  steps:steps.slice(0,3),
  notesEn:"Rule-based guidance on this device. No live AI, bank verification, booking, price verification or co-parent synchronization.",
  notesAr:"إرشادات مبنية على قواعد وبيانات الجهاز، بلا ذكاء اصطناعي متصل أو تحقق بنكي أو حجز أو مزامنة بين الوالدين."
 };
}
