import {assessFinancialReality,type FinancialReality} from "./financialReality";
import {futureFamilyMilestones} from "./sixPillarDecisionEngine";
import {dateKey,shiftDays,type FamilyMoment} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import type {MoneyState,Member} from "./money";
import type {FamilyPlan} from "./familyPlans";
import type {FamilyPreferences} from "./familyPreferences";

export type MoneyJourneyFocus="understand"|"protect"|"prepare"|"live";
export type JourneyRoute="/money"|"/calendar"|"/plans"|"/advisor"|"/explore/weekend";
export type MoneyJourneyAction={titleEn:string;titleAr:string;detailEn:string;detailAr:string;route:JourneyRoute};
export type MoneyJourneyDimension={id:MoneyJourneyFocus;labelEn:string;labelAr:string;detailEn:string;detailAr:string};
export type MoneyJourneyInput={money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 plans:readonly FamilyPlan[];preferences:FamilyPreferences;now?:Date};
export type FamilyMoneyJourney={
 weekKey:string; weekEnd:string;
 knownFinances:boolean; reality:FinancialReality;
 storyEn:string;storyAr:string;statusEn:string;statusAr:string;
 next:MoneyJourneyAction;dimensions:MoneyJourneyDimension[];
 nextMilestones:Array<{title:string;date:string;kind:"bill"|"plan"|"occasion"}>;
 reviewedCategories:number;unclassifiedCategories:number;hasActualCash:boolean;
 childCount:number; protectedCount:number;
};
/** Calendar-week identifier is based on the user's local Monday, not a remote scheduled job. */
export function moneyJourneyWeek(now=new Date()):string{
 const monday=shiftDays(now,-((now.getDay()+6)%7));
 return dateKey(monday);
}
const routeFor=(kind:"bill"|"plan"|"occasion"):JourneyRoute=>
 kind==="bill"?"/money":kind==="plan"?"/plans":"/calendar";
/** One read-only interpretation of existing family data. No new charges, bills,
 * banking claims or confidence scores are calculated or persisted here. */
export function buildFamilyMoneyJourney(input:MoneyJourneyInput):FamilyMoneyJourney{
 const now=input.now??new Date();
 const {money,preferences,plans,members,moments}=input;
 const reality=assessFinancialReality(money,plans,now);
 const knownFinances=!money.demo&&reality.knownIncomeJod!==null;
 const actual=realFamilyMembers(members);
 const childCount=actual.filter(x=>x.role==="child").length;
 const protectedCount=(money.demo?[]:money.categories).filter(x=>x.priority==="protected").length+
  (preferences.protectedFamilyValues??[]).length;
 const reviewedCategories=money.demo?0:money.categories.filter(x=>!!x.priority).length;
 const unclassifiedCategories=money.demo?0:money.categories.filter(x=>!x.priority).length;
 const milestones=futureFamilyMilestones({money,members,moments,plans,preferences,now})
  .filter(x=>x.kind==="bill"||preferences.lifestyle)
  .map(x=>({title:x.title,date:x.date,kind:x.kind}));
 const first=milestones[0];
 const statusEn=!knownFinances?"Still getting to know your household":reality.kind==="essentials-gap"?
  "Essentials need careful attention":reality.kind==="plan-gap"?"The monthly plan needs a realistic choice":
  reality.kind==="tight"?"Payment timing may need attention":reality.kind==="unknown"?
  "Some important details remain uncertain":"Your entered monthly plan has a starting picture";
 const statusAr=!knownFinances?"عم نتعرّف على وضع البيت":reality.kind==="essentials-gap"?
  "المصاريف الأساسية تحتاج اهتمام":reality.kind==="plan-gap"?"خطة الشهر بحاجة لاختيار واقعي":
  reality.kind==="tight"?"مواعيد الدفعات بحاجة لمراجعة":reality.kind==="unknown"?
  "في معلومات مهمة بعدها غير واضحة":"صار عنا صورة أولية عن خطة الشهر";
 const storyEn=!knownFinances?
  "Start with whatever you know. No income disclosure, savings target or complete setup is required to explore and plan family life.":
  reality.kind==="essentials-gap"?
  "Your entered essential costs are higher than income. Tracking alone cannot resolve this; review needs and realistic support or income options without blame.":
  reality.kind==="plan-gap"?
  "Your entered spending plan exceeds income or includes a savings target that may need adjustment. Keep essential and personally important costs visible while exploring choices.":
  reality.kind==="tight"?
  "The monthly plan and the timing of actual payments are different. Review cash and due dates before treating any planned amount as available.":
  reality.kind==="unknown"?
  "Some cost categories or timing details aren't reviewed yet. Dabberna won't assume which expenses are flexible or that money is available.":
  "Your entered monthly plan is a useful starting point, not a verified bank balance or permission to spend. Look ahead before new commitments.";
 const storyAr=!knownFinances?
  "ابدأ باللي بتعرفه. مش لازم تذكر دخلك أو تحط هدف ادخار أو تكمل كل البيانات حتى تستكشف وتخطط لحياة العيلة.":
  reality.kind==="essentials-gap"?
  "حسب الأرقام المدخلة، الأساسيات أعلى من الدخل. ترتيب المصروف وحده ما بيحل المشكلة؛ راجع الخيارات الواقعية بدون لوم.":
  reality.kind==="plan-gap"?
  "مصاريف الخطة المدخلة أو هدف الادخار أعلى من الدخل. خلّي الأساسيات واللي مهم لعيلتك واضحين وإنت بتقارن الخيارات.":
  reality.kind==="tight"?
  "توازن خطة الشهر مختلف عن توقيت الدفعات الفعلية. راجع السيولة والمواعيد قبل اعتبار أي مبلغ متاحاً.":
  reality.kind==="unknown"?
  "بعض المصاريف أو المواعيد بعدها غير مصنفة. دبّرنا ما رح تفترض شو ممكن يتغيّر أو إن المال متاح.":
  "خطة الشهر المدخلة بداية مفيدة، مش رصيد بنك مؤكد أو موافقة للصرف. راجع اللي جاي قبل أي التزام.";
 let next:MoneyJourneyAction;
 if(knownFinances&&(reality.kind==="essentials-gap"||reality.kind==="plan-gap"||reality.kind==="tight"||reality.forecastCashRisk)){
  next={titleEn:"Review the financial pressure first",titleAr:"راجع الضغط المالي أولاً",
   detailEn:"Check essential commitments, payment dates and what could realistically change; no automatic cuts or payments.",
   detailAr:"راجع الأساسيات ومواعيد الدفعات وما يمكن تغييره واقعياً؛ بدون تخفيضات أو دفعات تلقائية.",route:"/money"};
 }else if(knownFinances&&reality.kind==="unknown"){
  next={titleEn:"Clarify one important money detail",titleAr:"وضّح تفصيلاً مالياً واحداً",
   detailEn:"Review the unclassified costs or missing information before accepting new commitments.",
   detailAr:"راجع المصاريف غير المصنفة أو المعلومات الناقصة قبل أي التزام جديد.",route:"/money"};
 }else if(first){
  next={titleEn:"Prepare for what's approaching",titleAr:"حضّر للي جاي",
   detailEn:first.title+" · "+first.date+". Check its timing and costs in your own records; this is not verified with a provider.",
   detailAr:first.title+" · "+first.date+". راجع المواعيد والتكاليف المدخلة؛ المعلومات ليست مؤكدة من الجهة.",route:routeFor(first.kind)};
 }else if(!knownFinances){
  next={titleEn:"Start with one thing you know",titleAr:"ابدأ بشغلة واحدة بتعرفها",
   detailEn:"Add an essential cost or an upcoming bill whenever you're ready. You can skip income and continue exploring.",
   detailAr:"أضف مصروفاً أساسياً أو فاتورة قادمة وقت تكون جاهز. فيك تتجاوز إدخال الدخل وتكمل.",route:"/money"};
 }else if(preferences.moneyJourneyFocus==="live"){
  next={titleEn:"Explore something meaningful together",titleAr:"استكشف تجربة حلوة للعيلة",
   detailEn:"Find family options that match your preferences. Prices and availability require independent checks.",
   detailAr:"دور على خيارات تناسب تفضيلاتكم؛ الأسعار والتوفر بحاجة لتحقق مستقل.",route:"/explore/weekend"};
 }else{
  next={titleEn:"Consider your family's next decision",titleAr:"فكّر بالقرار الجاي للعيلة",
   detailEn:"Use your priorities, recorded commitments and realistic options to choose what matters next.",
   detailAr:"اعتمد على الأولويات والالتزامات والخيارات الواقعية لتختار الخطوة المناسبة.",route:"/advisor"};
 }
 const dimensions:MoneyJourneyDimension[]=[
  {id:"understand",labelEn:"Understand",labelAr:"افهم",detailEn:knownFinances?
   reviewedCategories+" spending categories have a declared importance; "+unclassifiedCategories+" remain unclassified. No bank figures are verified.":
   "Your real financial picture is still optional. Example amounts are never treated as your money.",
   detailAr:knownFinances?reviewedCategories+" فئات محددة الأهمية، و"+unclassifiedCategories+" بعدها غير مصنفة. لا توجد أرصدة بنكية مؤكدة.":
   "إدخال الأرقام الحقيقية اختياري؛ الأرقام التجريبية ليست مالك."},
  {id:"protect",labelEn:"Protect",labelAr:"احمِ",detailEn:knownFinances?
   (reality.essentialJod===null?"Essential spending is not fully classified yet.":"Essential spending is recorded as an estimate, not proof it is covered.")+
   (protectedCount?" You have specified some protected family priorities.":" You can choose priorities to protect if you wish."):
   "You can choose what matters to protect before completing any budget.",
   detailAr:knownFinances?"الاحتياجات الأساسية مسجّلة أو تحتاج تصنيفاً، لكن لا يعني ذلك أنها مدفوعة.":
   "فيك تختار شو بهمّ العيلة قبل ما تكمل الميزانية."},
  {id:"prepare",labelEn:"Prepare",labelAr:"تحضّر",detailEn:first?
   "Next recorded item: "+first.title+" · "+first.date+". Dates are parent-entered and may need confirmation.":
   "No upcoming item is recorded in the next 45 days. That does not mean nothing is due.",
   detailAr:first?"القادم حسب سجلاتك: "+first.title+" · "+first.date+". راجع التأكيد مع الجهة.":
   "ما في موعد مسجّل خلال ٤٥ يوم، بس مش بالضرورة يعني ما في التزامات."},
  {id:"live",labelEn:"Live & grow",labelAr:"عيش وتطوّر",detailEn:
   "Plan experiences and goals worth protecting, without assuming a budget surplus is cash or recommending unnecessary spending.",
   detailAr:"خطط للتجارب والأهداف المهمة بدون اعتبار فائض الميزانية نقداً أو تشجيع مصاريف غير ضرورية."}
 ];
 return {weekKey:moneyJourneyWeek(now),weekEnd:dateKey(shiftDays(new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7),12),6)),
  knownFinances,reality,storyEn,storyAr,statusEn,statusAr,next,dimensions,nextMilestones:milestones.slice(0,3),
  reviewedCategories,unclassifiedCategories,hasActualCash:!money.demo&&typeof money.cashOnHand==="number",
  childCount,protectedCount};
}
