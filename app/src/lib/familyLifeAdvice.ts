import type {FamilyPlan} from "./familyPlans";
import type {FamilyPreferences} from "./familyPreferences";
import type {FamilyMoment} from "./familyCalendar";
import {dateKey,upcomingMoments} from "./familyCalendar";
import {getMoneyOverview} from "./moneyOverview";
import {computeMoney,type Member,type MoneyState} from "./money";
import {realFamilyMembers} from "./familySetup";
import {getFinancialReadiness} from "./financialReadiness";

export type FamilyLifeAdvice={
 id:"plans-over-budget"|"plan-cash-review"|"plan-needs-cost"|"plan-coming-up"|"child-outing"|"family-outing";
 titleEn:string;titleAr:string;detailEn:string;detailAr:string;
 actionEn:string;actionAr:string;
 link:"/plans"|"/plans";
 urgency:"attention"|"gentle";
};
/** Read-only recommendations, never checked-out offers or guaranteed affordability.
 * Actual family members, preferences, plans and recorded budgets only.
 * No invented locations, provider prices, transfer actions or bank balances.
 */
export function selectFamilyLifeAdvice(input:{
 money:MoneyState;
 members:readonly Member[];
 preferences:FamilyPreferences;
 preferencesConfirmed:boolean;
 plans:readonly FamilyPlan[];
 moments?:readonly FamilyMoment[];
 now?:Date;
}):FamilyLifeAdvice|null {
 const {money,members,preferences:p,preferencesConfirmed,plans}=input;
 const now=input.now??new Date();
 if(p.notificationFrequency==="off")return null;
 const today=dateKey(now);
 const horizon=dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()+30,12));
 const active=plans.filter(x=>x.status!=="completed"&&
   typeof x.date==="string"&&x.date>=today&&x.date<=horizon)
  .sort((a,b)=>(a.date??"").localeCompare(b.date??"")||a.id.localeCompare(b.id));
 const first=active[0];
 const readiness=getFinancialReadiness(money,now);
 const budgetReady=!money.demo&&readiness.budgetReady&&readiness.savingsReady;
 // An upcoming plan is never marked safe merely because a monthly envelope exists.
 if(first){
  const cost=(plan:FamilyPlan)=>{
   const n=plan.choice?.estimatedJod??plan.budgetJod;
   return typeof n==="number"&&Number.isFinite(n)&&n>=0?n:null;
  };
  const affected=active.filter(x=>x.date?.slice(0,7)===first.date?.slice(0,7));
  const aggregate=affected.map(cost);
  const validAmounts=aggregate.every(v=>v!==null);
  const monthDate=new Date(Number(first.date!.slice(0,4)),Number(first.date!.slice(5,7))-1,15,12);
  const fig=computeMoney(money,monthDate);
  const headroom=fig.monthlyIncome+fig.carryover.net-fig.savingsTarget-fig.planned;
  if(p.financeTips&&budgetReady&&validAmounts&&
     aggregate.reduce<number>((n,v)=>n+(v??0),0)>Math.max(0,headroom)+0.005){
   return {
    id:"plans-over-budget",urgency:"attention",
    titleEn:"Your upcoming plans need a budget review",titleAr:"خططك القادمة بحاجة لمراجعة الميزانية",
    detailEn:"Combined estimated costs for "+affected.length+" plan(s) may exceed unallocated monthly room after your savings target. Check what's already included in your spending categories to avoid double counting.",
    detailAr:"قد تتجاوز التكاليف التقديرية لـ "+affected.length+" خطة المبلغ غير الموزّع لهذا الشهر بعد الادخار. راجع ما هو محسوب أصلاً ضمن الفئات حتى لا يتكرر احتسابه.",
    actionEn:"Review plans together",actionAr:"راجع الخطط",
    link:"/plans"
   };
  }
  if(p.financeTips&&!money.demo&&cost(first)!==null){
   const overview=getMoneyOverview(money,now);
   const unsafe=overview.cashAfterBills!==null&&overview.cashAfterBills<cost(first)! ||
     overview.forecast.overdueCount>0 ||
     (overview.forecast.minimumBalance!==null&&overview.forecast.minimumBalance<0);
   if(unsafe) return {
     id:"plan-cash-review",urgency:"attention",
     titleEn:"Review cash before committing to "+first.title,titleAr:"راجع السيولة قبل الالتزام بـ "+first.title,
     detailEn:"Recorded cash, reserve or upcoming bills may not support this plan. Check your actual balance and obligations first.",
     detailAr:"الرصيد والاحتياطي والفواتير المسجلة قد لا تكفي لهذه الخطة. راجع الرصيد الفعلي والالتزامات أولاً.",
     actionEn:"Check the plan",actionAr:"راجع الخطة",link:"/plans"
    };
  }
  const days=Math.round((new Date(first.date!+"T12:00:00").getTime()-new Date(today+"T12:00:00").getTime())/86400000);
  if(p.lifestyle&&days<=14&&cost(first)===null)return {
    id:"plan-needs-cost",urgency:"attention",
    titleEn:"Set a budget for "+first.title,titleAr:"حدّد ميزانية لـ "+first.title,
    detailEn:"This plan is approaching, but its cost is still missing. Add an estimate before comparing options or booking.",
    detailAr:"موعد الخطة قريب، لكن تكلفتها غير محددة. أضف تقديراً قبل مقارنة الخيارات أو الحجز.",
    actionEn:"Add an estimate",actionAr:"أضف تقدير",link:"/plans"
  };
  if(p.lifestyle&&days<=7)return {
    id:"plan-coming-up",urgency:"attention",
    titleEn:"A family plan is approaching",titleAr:"موعد إحدى خطط العائلة قريب",
    detailEn:first.title+" is planned for "+first.date+". Recheck real prices, availability, children's attendance and cash before committing; estimates are not payment approval.",
    detailAr:"الخطة "+first.title+" بتاريخ "+first.date+". تأكّد من الأسعار والتوافر وحضور الأطفال والسيولة قبل الالتزام؛ التقديرات ليست موافقة على الصرف.",
    actionEn:"Open family plan",actionAr:"افتح الخطة",link:"/plans"
  };
 }
 // No fabricated child profile: sample members are never evidence of real children.
 // Generic optional inspiration only when a parent expressly chose gentle tips.
 if(!p.lifestyle||p.notificationFrequency!=="gentle"||!preferencesConfirmed)return null;
 const actual=realFamilyMembers(members);
 if(!actual.length||p.experienceMode==="individual")return null;
 const joining=p.typicalChildrenAttendance==="yes";
 const hasChild=actual.some(x=>x.role==="child");
 const childFocus=p.typicalOutingFocus==="children";
 // If an occasion is imminent, the existing occasion card handles it.
 const moments=input.moments??[];
 if(upcomingMoments([...moments],now,10).length>0)return null;
 const limit=Number.isFinite(p.outingLimit)&&p.outingLimit>=0?p.outingLimit:null;
 const distance=Number.isFinite(p.distanceKm)&&p.distanceKm>0?p.distanceKm:null;
 const constraint=[limit!==null?"planned ceiling "+limit+" JOD":null,distance!==null?"preferred distance "+distance+" km":null]
   .filter(Boolean).join(", ");
 if(joining&&hasChild)return {
   id:"child-outing",urgency:"gentle",
   titleEn:childFocus?"Plan a child-focused experience":"Plan a family outing together",
   titleAr:childFocus?"خطّط لنشاط يفرّح الأطفال":"خطّط لطلعة تناسب الجميع",
   detailEn:"You indicated children usually join. Explore age-suitable ideas"+
     (constraint?" using your "+constraint:"")+". Confirm attendance, safety, actual prices and budget fit for each outing.",
   detailAr:"بناءً على تفضيلاتك، الأطفال عادة بيشاركوا. اكتشف نشاطاً مناسباً لأعمارهم"+
     (limit!==null?" ضمن سقف "+limit+" د.أ":"")+
     (distance!==null?" ومسافة مفضلة "+distance+" كم":"")+". تأكد من الحضور والملاءمة والأسعار الفعلية قبل القرار.",
   actionEn:"Plan with children",actionAr:"خطّط مع الأطفال",link:"/plans"
 };
 return {
   id:"family-outing",urgency:"gentle",
   titleEn:"Make room for a meaningful outing",titleAr:"خصّص وقتاً لطلعة حلوة",
   detailEn:"Explore an experience"+(constraint?" using your "+constraint:"")+
     ". The planner will ask if children are joining; no booking or affordability is assumed.",
   detailAr:"اكتشف تجربة تناسب تفضيلاتك"+
     (limit!==null?" بميزانية "+limit+" د.أ":"")+
     (distance!==null?" ولمسافة "+distance+" كم":"")+
     ". سنسألك بكل مرة إن كان الأطفال معنا؛ ما في حجز أو ضمان قدرة مالية.",
   actionEn:"Explore an outing",actionAr:"استكشف طلعة",link:"/plans"
 };
}
