import {selectFamilyPriority} from "./familyPriority";
import {selectFamilyLifeAdvice} from "./familyLifeAdvice";
import {dateKey,shiftDays,allFamilyMoments,upcomingMoments,type FamilyMoment} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import {getMoneyOverview} from "./moneyOverview";
import type {FamilyPlan} from "./familyPlans";
import {taskAttention,type FamilyTask} from "./familyTasks";
import {nextWishlistReminder} from "./wishlistAttention";
import type {WishlistItem} from "./familyWishlist";
import type {FamilyPreferences} from "./familyPreferences";
import type {MoneyState,Member} from "./money";

export type AttentionItem={
 key:string;
 category:"finance"|"bill"|"plan"|"occasion"|"inspiration"|"task"|"shopping";
 severity:"critical"|"important"|"gentle";
 priority:number;
 titleEn:string;titleAr:string;
 detailEn:string;detailAr:string;
 actionEn:string;actionAr:string;
 link:"/money"|"/plans"|"/space"|"/calendar"|"/explore/together"|"/explore/smartbuy"|"/occasions";
 /** Critical warnings must remain visible until the underlying data changes. */
 canSnooze:boolean;
};
export type AttentionSnoozes=Record<string,string>;
export const FAMILY_ATTENTION_SNOOZES_KEY="familyAttentionSnoozes";

const dateSnoozed=(until:unknown,now:Date):boolean=>
 typeof until==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(until)&&until>dateKey(now);
/** Snooze is device-local and temporary. Critical warnings are never snoozed.
 * The dismissal changes the display only, not a bill, plan or payment status.
 */
export function snoozeAttention(
 previous:AttentionSnoozes,item:AttentionItem,now=new Date()
):AttentionSnoozes {
 if(!item.canSnooze)return previous;
 const cleaned=Object.fromEntries(Object.entries(previous)
  .filter(([key,date])=>key.length<=240&&dateSnoozed(date,now))
  .slice(-60)) as AttentionSnoozes;
 return {...cleaned,[item.key]:dateKey(shiftDays(now,item.severity==="gentle"?7:1))};
}

export function buildFamilyAttention(input:{
 money:MoneyState;
 members:readonly Member[];
 preferences:FamilyPreferences;
 preferencesConfirmed:boolean;
 plans:readonly FamilyPlan[];
 moments:readonly FamilyMoment[];
 tasks?:readonly FamilyTask[];
 wishlist?:readonly WishlistItem[];
 snoozes?:AttentionSnoozes;
 now?:Date;
 maxItems?:number;
}):AttentionItem[]{
 const {money,members,preferences:p,plans,moments}=input;
 const now=input.now??new Date(),today=dateKey(now);
 const snoozes=input.snoozes??{};
 if(p.notificationFrequency==="off")return [];
 const signals:AttentionItem[]=[];
 const finance=selectFamilyPriority(money,p,now);
 if(finance){
  signals.push({
   key:"finance:"+finance.id+":"+today.slice(0,7),
   category:"finance",severity:finance.id==="cash-risk"?"critical":finance.severity==="gentle"?"gentle":"important",
   priority:finance.id==="cash-risk"?0:finance.severity==="gentle"?80:16,
   titleEn:finance.titleEn,titleAr:finance.titleAr,
   detailEn:finance.detailEn,detailAr:finance.detailAr,
   actionEn:finance.actionEn,actionAr:finance.actionAr,
   link:"/money",canSnooze:finance.id!=="cash-risk"
  });
 }
 const overview=getMoneyOverview(money,now);
 if(!money.demo&&p.billReminders){
  const bills=overview.forecast.events
   .filter(e=>e.kind==="bill"&&e.displayDate<=dateKey(shiftDays(now,7)));
  const overdue=bills.filter(e=>e.overdue);
  const due=bills.filter(e=>!e.overdue);
  if(overdue.length){
   signals.push({
    key:"bill:overdue:"+overdue.map(e=>e.key).sort().join("|").slice(0,200),
    category:"bill",severity:"critical",priority:1,canSnooze:false,
    titleEn:"Review overdue bills",titleAr:"راجع الفواتير المتأخرة",
    detailEn:String(overdue.length)+" recorded bill instalment(s) are overdue or unconfirmed. Verify payment dates before making new commitments.",
    detailAr:"هناك "+String(overdue.length)+" دفعة مسجّلة متأخرة أو غير مؤكدة. راجع تواريخ الدفع قبل أي التزام جديد.",
    actionEn:"Check bills",actionAr:"راجع الفواتير",link:"/money"
   });
  }else if(due.length){
   const first=due[0]!;
   signals.push({
    key:"bill:due:"+first.sourceId+":"+first.displayDate,
    category:"bill",severity:"important",priority:12,canSnooze:true,
    titleEn:"A bill is due soon",titleAr:"هناك فاتورة موعدها قريب",
    detailEn:"Your recorded "+first.name+" bill is due "+first.displayDate+
     (due.length>1?". "+String(due.length-1)+" other bill(s) also fall within seven days.":".")+
     " Check your payment plan; this is not confirmation that it remains unpaid at the provider.",
    detailAr:"موعد فاتورة "+first.name+" المسجلة هو "+first.displayDate+
     (due.length>1?" ولديك "+String(due.length-1)+" فاتورة أخرى خلال سبعة أيام":"")+". تأكد من السداد؛ هذه ليست حالة دفع مؤكدة من الجهة المعنية.",
    actionEn:"Check due dates",actionAr:"راجع المواعيد",link:"/money"
   });
  }
 }
 if(p.lifestyle){
  const pending=taskAttention(input.tasks??[],now);
  if(pending)signals.push({
   key:"task:"+pending.id+":"+pending.date,
   category:"task",severity:pending.urgent?"important":"gentle",priority:pending.urgent?9:35,
   titleEn:pending.urgent?"A family responsibility needs attention":"Family task due soon",
   titleAr:pending.urgent?"مهمة عائلية تستحق انتباهك":"موعد مهمة عائلية قريب",
   detailEn:pending.title+" · "+pending.date+" ("+pending.count+" due or overdue task(s) recorded).",
   detailAr:pending.title+" · "+pending.date+" ("+pending.count+" مهام مسجلة قريبة أو متأخرة).",
   actionEn:"Review responsibilities",actionAr:"راجع المهام",link:"/space",canSnooze:!pending.urgent
  });
 }
 if(input.preferencesConfirmed&&p.shoppingTips){
  const wish=nextWishlistReminder(input.wishlist??[],now);
  if(wish){
   const when=wish.daysUntil<0?"overdue":wish.daysUntil===0?"today":
    wish.daysUntil<=7?"within seven days":"within 14 days";
   const whenAr=wish.daysUntil<0?"تاريخها فات":wish.daysUntil===0?"اليوم":
    wish.daysUntil<=7?"خلال سبعة أيام":"خلال ١٤ يوماً";
   const review=wish.priceStatus==="missing"?"No price has been checked yet.":
    wish.priceStatus==="stale"?"Your last recorded price is more than 14 days old.":
    "The last price was entered by you; it is not independently verified.";
   const reviewAr=wish.priceStatus==="missing"?"لا يوجد سعر مسجّل بعد.":
    wish.priceStatus==="stale"?"آخر سعر مسجّل أقدم من ١٤ يوماً.":
    "السعر أدخلته بنفسك وليس متحققاً منه بشكل مستقل.";
   signals.push({
    key:"shopping:"+wish.item.id+":"+wish.item.targetDate,
    category:"shopping",priority:wish.daysUntil<=7?19:50,
    severity:wish.daysUntil<=7?"important":"gentle",canSnooze:true,
    titleEn:wish.item.kind==="gift"?"Prepare a planned gift":"A planned purchase needs review",
    titleAr:wish.item.kind==="gift"?"جهّز هدية مخططة":"راجع مشتريات العائلة القادمة",
    detailEn:wish.item.name+" is needed "+when+". "+review+
     (wish.overBudget?" Your last entered price exceeds your chosen ceiling.":"")+
     " No order or payment has been made.",
    detailAr:wish.item.name+" موعدها "+whenAr+". "+reviewAr+
     (wish.overBudget?" السعر المدخل أعلى من السقف الذي اخترته.":"")+
     " لا يوجد طلب أو دفع تلقائي.",
    actionEn:"Review your wishlist",actionAr:"راجع القائمة",
    link:wish.link
   });
  }
 }
 const advice=selectFamilyLifeAdvice({money,members,preferences:p,
  preferencesConfirmed:input.preferencesConfirmed,plans,moments,now});
 if(advice){
  const planIdentity=plans.filter(x=>x.status!=="completed"&&x.date&&x.date>=today&&x.date<=dateKey(shiftDays(now,30)))
   .sort((a,b)=>(a.date??"").localeCompare(b.date??""))[0];
  const isPlan=advice.id.startsWith("plan");
  signals.push({
   key:"family:"+advice.id+":"+(isPlan?planIdentity?.id+":"+planIdentity?.updatedAt:"inspiration"),
   category:isPlan?"plan":"inspiration",
   severity:advice.urgency==="attention"?"important":"gentle",
   priority:advice.urgency==="attention"?23:95,
   titleEn:advice.titleEn,titleAr:advice.titleAr,
   detailEn:advice.detailEn,detailAr:advice.detailAr,
   actionEn:advice.actionEn,actionAr:advice.actionAr,
   link:advice.link,canSnooze:true
  });
 }
 if(p.lifestyle){
  // Sample profiles never create real birthday alerts. Hand-entered calendar
  // moments remain under the parent's control and do not leave this device.
  const actual=realFamilyMembers(members);
  const events=allFamilyMoments([...moments],actual);
  const upcoming=upcomingMoments(events,now,8);
  if(upcoming.length){
   const event=upcoming[0]!;
   signals.push({
    key:"occasion:"+event.id+":"+event.occursOn,
    category:"occasion",severity:"important",priority:18,canSnooze:true,
    titleEn:"A family date is coming up",titleAr:"هناك مناسبة عائلية قريبة",
    detailEn:event.title+" is on "+event.occursOn+". Plan a meaningful moment with an appropriate budget, if needed.",
    detailAr:event.title+" بتاريخ "+event.occursOn+". يمكن التخطيط للمناسبة بميزانية مناسبة إذا لزم.",
    actionEn:"See calendar",actionAr:"افتح التقويم",link:"/calendar"
   });
  }
 }
 const unique=new Set<string>();
 return signals.filter(item=>{
  if(unique.has(item.key)||(item.canSnooze&&dateSnoozed(snoozes[item.key],now)))return false;
  unique.add(item.key);
  return p.notificationFrequency==="gentle"||item.severity!=="gentle";
 }).sort((a,b)=>a.priority-b.priority||a.key.localeCompare(b.key))
 .slice(0,Math.max(1,Math.min(20,input.maxItems??4)));
}
