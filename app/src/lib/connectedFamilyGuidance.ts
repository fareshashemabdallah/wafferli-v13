import {allFamilyMoments,dateKey,upcomingMoments} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import {planKey} from "./occasionAdvisor";
import {compareOutingOptions,type OutingOption,type OutingConstraints} from "./childAwareOutingCompare";
import {assessImmediateSpending} from "./spendingScenario";
import type {Member,MoneyState} from "./money";
import type {FamilyMoment} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";
import type {WishlistItem} from "./familyWishlist";
import type {FamilyPreferences} from "./familyPreferences";

export type ConnectedContext={
 money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 plans:readonly FamilyPlan[];preferences:FamilyPreferences;wishlist?:readonly WishlistItem[];
 outings?:readonly OutingOption[];now?:Date
};
export type ConnectedAdvice={
 titleEn:string;titleAr:string;detailEn:string;detailAr:string;
 sourceEn:string;sourceAr:string;
 route:"/plans"|"/occasions"|"/explore/together"|"/explore/smartbuy"|"/space";
 actionEn:string;actionAr:string
};
const d=(now:Date)=>dateKey(now);
const inNext=(date:string,now:Date,days:number)=>{
 const from=d(now);
 const end=d(new Date(now.getFullYear(),now.getMonth(),now.getDate()+days,12));
 return date>=from&&date<=end;
};
/** A single cross-module next step. Only connects what the parent saved, and
 * excludes every domain that the parent disabled in preferences.
 * This is private, deterministic guidance—not a model call, price or booking.
 */
export function nextConnectedFamilyAction(ctx:ConnectedContext):ConnectedAdvice{
 const now=ctx.now??new Date(),prefs=ctx.preferences;
 if(!prefs.lifestyle&&!prefs.shoppingTips)
  return {
   titleEn:"Choose what you'd like help with",titleAr:"حدّد كيف بتحب نساعد عيلتك",
   detailEn:"Family-life and shopping suggestions are disabled in preferences. Enable only what you want, or ask a specific Money question. No family records were combined.",
   detailAr:"اقتراحات الحياة العائلية والشراء معطّلة بتفضيلاتك. فعّل فقط المجالات اللي بتريحك أو اسأل سؤالاً محدداً بالمالية. لم نربط معلومات العائلة.",
   sourceEn:"Your device-only family preferences",sourceAr:"تفضيلات العائلة على جهازك",
   route:"/space",actionEn:"Review preferences",actionAr:"راجع التفضيلات"
  };
 const plans=prefs.lifestyle?ctx.plans.filter(x=>x.status!=="completed"&&x.date&&inNext(x.date,now,30))
  .slice().sort((a,b)=>a.date!.localeCompare(b.date!)):[];
 const soonEvents=prefs.lifestyle?upcomingMoments(allFamilyMoments(
  [...ctx.moments],realFamilyMembers(ctx.members)),now,31):[];
 const earliestPlan=plans[0],earliestEvent=soonEvents[0];
 // Avoid presenting the event and its linked Plan as different household jobs.
 const eventHasPlan=earliestEvent&&earliestPlan?.sourceRef==="occasion:"+planKey(earliestEvent);
 const usePlan=!!earliestPlan&&(
  !earliestEvent||earliestPlan.date!<=earliestEvent.occursOn||!!eventHasPlan
 );
 if(usePlan&&earliestPlan){
  const cost=earliestPlan.choice?.estimatedJod??earliestPlan.budgetJod;
  const assessment=prefs.financeTips&&typeof cost==="number"&&cost>0?
   assessImmediateSpending(ctx.money,cost,now):null;
  const en=assessment?.outcome==="review"?
   " Your recorded bills/cash may be pressured; review Money before committing.":
   assessment?.outcome==="unknown"?
   " A safe cost assessment needs completed, current Money records.":
   assessment?.outcome==="provisional"?
   " Your recorded cash projection shows no modeled shortfall, but this is NOT verified affordability.":
   typeof cost==="number"?
   " The entered ceiling is a plan, not money already spent.":" Add a comfortable cost ceiling if needed.";
  const ar=assessment?.outcome==="review"?
   " قد يتأثر الرصيد المسجّل بهذا المبلغ؛ راجع المالية قبل أي التزام.":
   assessment?.outcome==="unknown"?
   " يلزم استكمال الأرقام الفعلية في المالية لتقييم المبلغ بحذر.":
   assessment?.outcome==="provisional"?
   " لا يظهر عجز بالتوقع المدخل، لكنه ليس تأكيداً للقدرة على الإنفاق.":
   typeof cost==="number"?
   " السقف المسجّل للخطة ليس مصروفاً فعلياً.":" يمكنك وضع سقف مريح للتكلفة.";
  const label=typeof cost==="number"?" · "+cost.toFixed(2)+" JOD":"";
  return {
   titleEn:"Continue the next family plan",titleAr:"كمّل الخطة العائلية القادمة",
   detailEn:earliestPlan.title+" · "+earliestPlan.date+label+"."+en+
    " Confirm real-world price and availability; planning does not create a purchase or reservation.",
   detailAr:earliestPlan.title+" · "+earliestPlan.date+label+"."+ar+
    " تأكد من السعر والتوفر الفعلي؛ التخطيط لا يعني شراء أو حجز.",
   sourceEn:"Your saved family plan"+(assessment?" + on-device Money scenario":""),
   sourceAr:"الخطة المحفوظة"+(assessment?" + محاكاة المالية على الجهاز":""),
   route:"/plans",actionEn:"Continue plan",actionAr:"كمّل الخطة"
  };
 }
 if(earliestEvent){
  const hasLinked=ctx.plans.some(p=>p.sourceRef==="occasion:"+planKey(earliestEvent));
  return {
   titleEn:"Prepare for your next family occasion",titleAr:"حضّر للمناسبة العائلية القادمة",
   detailEn:earliestEvent.title+" is recorded for "+earliestEvent.occursOn+
    ". "+(hasLinked?"An occasion plan already exists; review it rather than creating a second one.":
     "Choose one thoughtful idea and a comfortable budget in the occasion planner.")+
    " Prices, services and bookings are not verified.",
   detailAr:earliestEvent.title+" بتاريخ "+earliestEvent.occursOn+
    ". "+(hasLinked?"عندك خطة للمناسبة؛ راجعها بدل ما تعمل خطة ثانية.":
     "اختَر فكرة مناسبة وسقف ميزانية مريح ضمن تخطيط المناسبة.")+
    " الأسعار والخدمات والحجوزات غير مؤكدة.",
   sourceEn:"Family calendar + genuine family member dates",sourceAr:"تقويم العائلة وتواريخ أفراد العائلة الحقيقيين",
   route:"/occasions",actionEn:"Plan this occasion",actionAr:"حضّر للمناسبة"
  };
 }
 if(prefs.shoppingTips){
  const shopping=(ctx.wishlist??[]).filter(x=>x.status==="considering"&&x.targetDate&&
   inNext(x.targetDate,now,30)).slice().sort((a,b)=>a.targetDate!.localeCompare(b.targetDate!));
  const item=shopping[0];
  if(item){
   return {
    titleEn:"Prepare a recorded family purchase",titleAr:"حضّر مشتريات عائلية محفوظة",
    detailEn:item.name+" is planned for "+item.targetDate+
     (typeof item.budgetJod==="number"?" · your ceiling: "+item.budgetJod.toFixed(2)+" JOD.":".")+
     " Check actual prices and delivery with a seller; no order or payment has been made.",
    detailAr:item.name+" موعده "+item.targetDate+
     (typeof item.budgetJod==="number"?" · السقف اللي حددته: "+item.budgetJod.toFixed(2)+" د.أ.":".")+
     " تأكد من السعر والتوصيل مع البائع؛ لم يُنشأ طلب أو دفع.",
    sourceEn:"Private family wishlist",sourceAr:"قائمة مشتريات العائلة الخاصة",
    route:item.kind==="gift"?"/occasions":"/explore/smartbuy",
    actionEn:item.kind==="gift"?"Review gifts":"Compare options",
    actionAr:item.kind==="gift"?"راجع الهدايا":"قارن الخيارات"
   };
  }
 }
 if(!prefs.lifestyle)return {
  titleEn:"Your next shopping step",titleAr:"خطوتك القادمة للتسوق",
  detailEn:"No dated purchases need attention from your opted-in list this month. You can compare an item when you're ready; family-life suggestions remain turned off.",
  detailAr:"لا توجد مشتريات مؤرخة قريبة بقائمتك المفعّلة. فيك تقارن منتجاً لما تحتاجه؛ اقتراحات الحياة العائلية تظل معطّلة.",
  sourceEn:"Your shopping preferences and device-only wishlist",sourceAr:"تفضيلات التسوق والقائمة على جهازك",
  route:"/explore/smartbuy",actionEn:"Compare a purchase",actionAr:"قارن منتجاً"
 };
 return {
  titleEn:"Plan something simple together",titleAr:"خطّطوا لوقت حلو مع بعض",
  detailEn:"Nothing due soon appears in the family dates and plans you chose to record. Start with a comfortable limit and confirm whether children will join. No venue or cost is assumed.",
  detailAr:"ما في مواعيد قريبة بالتقويم والخطط اللي سجلتها. ابدأ بسقف مريح وحدّد إذا الأطفال رح يشاركوا. ما عم نفترض أي مكان أو سعر.",
  sourceEn:"Your opted-in family preferences, calendar and plans",sourceAr:"تفضيلات العائلة والتقويم والخطط اللي اخترتها",
  route:"/explore/together",actionEn:"Plan an outing",actionAr:"خطّط لطلعة"
 };
}

/** Reuse genuine child needs, a saved outing budget, and parent-checked places.
 * Does not infer actual weather, current venue policy or safe-to-spend cash.
 */
export function personalOutingAdvice(ctx:ConnectedContext):ConnectedAdvice{
 const prefs=ctx.preferences,now=ctx.now??new Date();
 if(!prefs.lifestyle)
  return {
   titleEn:"Family outing suggestions are turned off",titleAr:"اقتراحات الطلعات معطّلة",
   detailEn:"Family-life advice is disabled in your preferences. You can enable it before reusing saved family information.",
   detailAr:"إرشادات العائلة معطّلة بتفضيلاتك. فيك تفعّلها إذا حابب تستفيد من المعلومات المحفوظة.",
   sourceEn:"Your device-only preferences",sourceAr:"تفضيلاتك على الجهاز",
   route:"/space",actionEn:"Open preferences",actionAr:"افتح التفضيلات"
  };
 const childSetting=prefs.typicalChildrenAttendance??"ask";
 const children:OutingConstraints["children"]=childSetting==="yes"?"yes":childSetting==="no"?"no":"unsure";
 const people=realFamilyMembers(ctx.members);
 const ages=people.filter(p=>p.role==="child").map(p=>p.ageGroup).filter(Boolean);
 const planned=ctx.plans.filter(x=>x.kind==="outing"&&x.status!=="completed"&&x.date&&inNext(x.date,now,30))
  .slice().sort((a,b)=>a.date!.localeCompare(b.date!))[0];
 const budget=planned?.budgetJod??prefs.outingLimit;
 const constraint:OutingConstraints={
  children,ages,requireStroller:false,preferQuiet:false,weather:"unknown",
  budgetJod:Number.isFinite(budget)&&budget>0&&budget<=100000?budget:null,
  maxDistanceKm:Number.isFinite(prefs.distanceKm)&&prefs.distanceKm>0?prefs.distanceKm:null
 };
 const comparisons=compareOutingOptions(ctx.outings??[],constraint,now);
 const viable=comparisons.find(x=>x.suitability!=="not-suitable");
 const budgetEn=constraint.budgetJod!==null?constraint.budgetJod.toFixed(2)+" JOD":"not set";
 const budgetAr=constraint.budgetJod!==null?constraint.budgetJod.toFixed(2)+" د.أ":"غير محدد";
 const city=prefs.city.trim().slice(0,60);
 const baseEn=(planned?"Upcoming plan: "+planned.title+" ("+planned.date+"). ":"")+
  "Your entered outing ceiling is "+budgetEn+
  (city?"; city: "+city:"")+
  (children==="yes"?"; children usually join.":children==="no"?"; children usually do not join.":"; confirm whether children are attending.")+
  " Check children's ages, weather and real venue availability. ";
 const baseAr=(planned?"الخطة القادمة: "+planned.title+" ("+planned.date+"). ":"")+
  "السقف اللي سجلته للطلعة "+budgetAr+
  (city?"؛ المدينة: "+city:"")+
  (children==="yes"?"؛ الأطفال عادةً بيشاركوا.":children==="no"?"؛ الأطفال عادةً ما بيشاركوا.":"؛ حدّد إذا الأطفال رح يشاركوا.")+
  " تحقق من ملاءمة الأعمار والطقس وتوفر المكان. ";
 if(!comparisons.length)return {
  titleEn:"Let's choose an outing with your preferences",titleAr:"خلّينا نختار طلعة تناسب العيلة",
  detailEn:baseEn+"No venue is saved for comparison yet. Check a few real options yourself; no venues, prices or travel times are invented.",
  detailAr:baseAr+"ما عندك أماكن محفوظة للمقارنة بعد. قارن خيارات فعلية بنفسك؛ ما عم نفترض أماكن أو أسعار أو أوقات وصول.",
  sourceEn:"Your family preferences and saved outing plans",sourceAr:"تفضيلات العائلة والخطط المحفوظة",
  route:"/explore/together",actionEn:"Compare outings",actionAr:"قارن الطلعات"
 };
 if(!viable)return {
  titleEn:"Your saved places need another look",titleAr:"أماكنك المحفوظة بحاجة لمراجعة",
  detailEn:baseEn+"None of your saved places currently pass the checks in your own notes. Recheck child admission, age suitability, full cost and distance before choosing.",
  detailAr:baseAr+"ما في مكان محفوظ اجتاز الفحوصات بحسب ملاحظاتك. راجع دخول الأطفال والعمر والتكلفة والمسافة قبل الاختيار.",
  sourceEn:"Parent-entered venue comparisons, not independently verified",sourceAr:"مقارنة أماكن حسب إدخالاتك، بلا تحقق مستقل",
  route:"/explore/together",actionEn:"Review saved places",actionAr:"راجع الأماكن"
 };
 const cost=viable.option.totalEstimatedJod;
 const costText=typeof cost==="number"?" · last entered total "+cost.toFixed(2)+" JOD":" · full family cost not entered";
 const costAr=typeof cost==="number"?" · آخر تكلفة سجلتها "+cost.toFixed(2)+" د.أ":" · التكلفة الكاملة غير مسجلة";
 return {
  titleEn:"Review one of your saved outing options",titleAr:"راجع أحد خيارات الطلعات المحفوظة",
  detailEn:baseEn+viable.option.name+costText+". "+
   viable.reasonsEn.slice(0,2).join(" ")+" Your notes do not verify live prices, child admission, weather or availability. This is not a booking.",
  detailAr:baseAr+viable.option.name+costAr+". "+
   viable.reasonsAr.slice(0,2).join(" ")+" ملاحظاتك لا تؤكد الأسعار أو دخول الأطفال أو الطقس أو التوفر؛ هذا ليس حجزاً.",
  sourceEn:"Parent-entered outing shortlist + stated family preferences",sourceAr:"أماكن سجلتها بنفسك وتفضيلات العائلة",
  route:"/explore/together",actionEn:"Review this option",actionAr:"راجع هذا الخيار"
 };
}
