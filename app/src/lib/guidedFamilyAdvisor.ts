import {getMoneyOverview} from "./moneyOverview";
import {nextConnectedFamilyAction,personalOutingAdvice} from "./connectedFamilyGuidance";
import {explicitJodAmount,explainSpecificSpending} from "./specificSpendingAdvice";
import {realFamilyMembers} from "./familySetup";
import {allFamilyMoments,upcomingMoments} from "./familyCalendar";
import {dateKey} from "./familyCalendar";
import type {FamilyMoment} from "./familyCalendar";
import type {MoneyState,Member} from "./money";
import type {FamilyPlan} from "./familyPlans";
import type {FamilyPreferences} from "./familyPreferences";
import {taskSummary,type FamilyTask} from "./familyTasks";
import {nextWishlistReminder} from "./wishlistAttention";
import {summarizeWishlistPrice,type WishlistItem} from "./familyWishlist";
import type {ServiceEntry} from "./serviceShortlist";
import type {OutingOption} from "./childAwareOutingCompare";

export type AdvisorIntent="priorities"|"safety"|"bills"|"savings"|"family"|"shopping"|"plans"|"tasks"|"gifts"|"outings"|"services"|"unsupported";
export type GuidedAnswer={
 intent:AdvisorIntent;
 titleEn:string;titleAr:string;
 textEn:string;textAr:string;
 sourceEn:string;sourceAr:string;
 route:"/money"|"/calendar"|"/plans"|"/explore/smartbuy"|"/explore/together"|"/space"|"/occasions"|"/explore/services";
 actionEn:string;actionAr:string;
};
export type AdvisorContext={
 money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 plans:readonly FamilyPlan[];preferences:FamilyPreferences;now?:Date;
 tasks?:readonly FamilyTask[];wishlist?:readonly WishlistItem[];
 services?:readonly ServiceEntry[];outings?:readonly OutingOption[];
};
export const guidedPrompts=[
 {id:"safety" as const,en:"Is our spending safe?",ar:"هل وضع مصروف العائلة آمن؟"},
 {id:"bills" as const,en:"What bills need attention?",ar:"شو الفواتير اللي لازم ننتبه إلها؟"},
 {id:"savings" as const,en:"How are our savings goals?",ar:"كيف ماشيين بأهداف الادخار؟"},
 {id:"family" as const,en:"What's coming up for the children?",ar:"شو في مناسبات للأطفال قريباً؟"},
 {id:"priorities" as const,en:"What matters most for our family this week?",ar:"شو أهم خطوة للعيلة هالأسبوع؟"},
 {id:"shopping" as const,en:"How can we buy more wisely?",ar:"كيف نشتري بذكاء؟"},
 {id:"tasks" as const,en:"What family tasks are due?",ar:"شو مهام العائلة المستحقة؟"},
 {id:"gifts" as const,en:"Are any gifts coming up?",ar:"عنا هدايا لازم نجهزها؟"},
 {id:"outings" as const,en:"What outings suit our family?",ar:"شو الطلعات المناسبة للعائلة؟"},
 {id:"services" as const,en:"How can we compare family services?",ar:"كيف نقارن خدمات العائلة؟"}
];
const hit=(q:string,words:RegExp)=>words.test(q);
export function detectAdvisorIntent(question:string):AdvisorIntent{
 const q=question.toLocaleLowerCase().trim().slice(0,400);
 if(!q)return "unsupported";
 // Parents often describe a real-life event AND ask whether its cost is safe.
 // Treat explicit affordability as a Money question, not a location or
 // occasion suggestion; no bank-verified verdict is ever produced.
 if(hit(q,/afford|can we pay|can i pay|within (our |my )?budget|fit (our |my )?budget|budget for|نقدر ندفع|فينا ندفع|بنقدر ندفع|بتسمح الميزانية|مناسب للميزانية|ميزانية.*(طلعة|هدية|نزهة)|can we spend/i))return "safety";
 if(hit(q,/priority|priorities|what matters|most important|what should we do next|focus on this week|next best action|شو أهم|شو الأهم|أولوية|اولويه|أولويات|اولويات/i))return "priorities";
 if(hit(q,/task|chore|responsibilit|to.?do|مهمات|مهام|مهمة|واجبات|مسؤوليات/i))return "tasks";
 if(hit(q,/bill|due|overdue|invoice|payment date|فواتير|فاتورة|مستحق|دفعات|دفع/i))return "bills";
 if(hit(q,/sav(?:e|ed|ing|ings)|goal|هدف|ادخار|توفير|نوفر/i))return "savings";
 if(hit(q,/gift|present|هدايا|هدية|هدية|هديه/i))return "gifts";
 if(hit(q,/doctor|pediatrician|clinic|provider|service|dentist|physician|طبيب|دكتور|مستشفى|عيادة|خدمات|خدمة/i))return "services";
 if(hit(q,/outing|weekend|playground|park|excursion|نزهة|طلعة|حديقة|منتزه|مشوار/i))return "outings";
 if(hit(q,/birthday|child|children|school|occasion|anniversary|عيد|طفل|اطفال|أطفال|مدرسة|مدرسي|مناسب/i))return "family";
 if(hit(q,/shopping|buy|price|purchase|gift|store|discount|شراء|اشتري|نشتري|هدية|سعر|تسوق|خصم|مشتريات/i))return "shopping";
 if(hit(q,/plan|outing|trip|weekend|activity|نزهة|طلعة|رحلة|خطة|خطط|عطلة|نشاط/i))return "plans";
 if(hit(q,/safe|afford|balance|cash|budget|spend|income|money|مالي|ميزانية|رصيد|مصروف|نقدر|آمن|امان|أمان|دخل/i))return "safety";
 return "unsupported";
}
const answer=(intent:AdvisorIntent,titleEn:string,titleAr:string,textEn:string,textAr:string,
 sourceEn:string,sourceAr:string,route:GuidedAnswer["route"],actionEn:string,actionAr:string):GuidedAnswer=>
 ({intent,titleEn,titleAr,textEn,textAr,sourceEn,sourceAr,route,actionEn,actionAr});
/** Deterministic on-device Q&A. No network, no generative AI, no data transfer.
 * Source is always a specific local module or a clear missing-data disclosure.
 */
export function answerFamilyQuestion(question:string,ctx:AdvisorContext):GuidedAnswer{
 const intent=guidedPrompts.find(p=>question===p.en||question===p.ar)?.id??detectAdvisorIntent(question);
 const now=ctx.now??new Date(),day=dateKey(now);
 const m=ctx.money;
 const overview=getMoneyOverview(m,now);
 if(intent==="priorities"){
  const next=nextConnectedFamilyAction(ctx);
  return answer(intent,next.titleEn,next.titleAr,next.detailEn,next.detailAr,
   next.sourceEn,next.sourceAr,next.route,next.actionEn,next.actionAr);
 }
 if(intent==="safety"){
  const jod=explicitJodAmount(question);
  if(jod!==null){
   const assessment=explainSpecificSpending(m,jod,now);
   return answer(intent,assessment.titleEn,assessment.titleAr,
    assessment.detailEn,assessment.detailAr,assessment.sourceEn,assessment.sourceAr,
    "/money","Review Money assumptions","راجع أرقام المالية");
  }
  if(m.demo||!overview.cashSet||!overview.hasBillSchedule||overview.dateProblems>0){
   return answer(intent,"We need real figures first","لازم نكمل المعلومات الفعلية",
    "The pilot cannot assess household spending safety without a current cash balance, a reviewed schedule of unpaid bills and valid dates. Sample numbers are not your bank balance.",
    "ما فينا نقيم أمان المصروف من دون رصيد فعلي محدّث وفواتير غير مدفوعة بتواريخ صحيحة. الأرقام التجريبية مش رصيدك البنكي.",
    "Money: cash balance, bills and readiness","المالية: الرصيد والفواتير وجاهزية البيانات","/money","Complete Money","أكمل المالية");
  }
  if(overview.forecast.overdueCount>0||
     (overview.forecast.minimumBalance!==null&&overview.forecast.minimumBalance<0)||
     (overview.cashAfterBills!==null&&overview.cashAfterBills<0)){
   return answer(intent,"Possible cash shortfall: review before spending","احتمال نقص بالسيولة: راجع قبل المصروف",
    "Your recorded cash, reserve and dated commitments indicate a possible shortfall or overdue payment. Check real balances and due dates before committing. Unrecorded everyday spending is not included.",
    "الرصيد والاحتياطي والالتزامات المسجّلة تشير لاحتمال عجز أو دفعة متأخرة. راجع الأرقام ومواعيدها قبل أي التزام. المصاريف اليومية غير المسجّلة مش محسوبة.",
    "Money: 30-day cash-flow forecast","المالية: توقع التدفق النقدي لـ٣٠ يوم","/money","Review cash flow","راجع التدفق النقدي");
  }
  return answer(intent,"Your recorded bills appear covered — with limits","الفواتير المسجلة تبدو مغطّاة — مع تحفظات",
   "The figures you entered do not currently show a shortfall on the dated 30-day forecast. That does NOT establish a safe-to-spend balance: unlisted costs, income delays and actual bank balances have not been verified.",
   "الأرقام المدخلة لا تُظهر عجزاً في توقع ٣٠ يوم، لكن هذا مش ضمان لوجود مبلغ آمن للإنفاق؛ المصاريف غير المسجلة وتأخر الدخل والرصيد الحقيقي غير مؤكدة.",
   "Money: user-entered cash-flow forecast","المالية: توقع مبني على بياناتك","/money","Review assumptions","راجع الافتراضات");
 }
 if(intent==="bills"){
  if(m.demo||!overview.hasBillSchedule||overview.dateProblems>0)
   return answer(intent,"Review unpaid bills and dates","راجع الفواتير غير المدفوعة وتواريخها",
    "The current bill schedule is absent, contains invalid dates, or is only sample data. Record upcoming bills before relying on a due-date summary.",
    "جدول الفواتير ناقص أو فيه تواريخ غير صحيحة أو بيانات تجريبية. سجّل الفواتير القادمة قبل الاعتماد على الملخص.",
    "Money: scheduled commitments","المالية: الالتزامات المسجّلة","/money","Add/check bills","أضف أو راجع الفواتير");
  const bills=overview.forecast.events.filter(e=>e.kind==="bill").slice(0,100);
  const overdue=bills.filter(e=>e.overdue),soon=bills.filter(e=>!e.overdue&&e.displayDate<=
    dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()+7,12)));
  return answer(intent,"Your recorded bill schedule","جدول الفواتير المسجّل",
   (overdue.length?overdue.length+" overdue or unconfirmed instalment(s). ":"")+
    soon.length+" upcoming within seven days. "+(soon[0]?"Next: "+soon[0].name+" ("+soon[0].displayDate+"). ":"")+
    "Dates are from your own records; the provider has not verified payment status.",
   (overdue.length?overdue.length+" دفعة متأخرة أو غير مؤكدة. ":"")+
    soon.length+" خلال سبعة أيام. "+(soon[0]?"القادمة: "+soon[0].name+" ("+soon[0].displayDate+"). ":"")+
    "هذه مواعيد أدخلتها بنفسك وليست إثباتاً من الجهة المعنية.",
   "Money: due dates and paid entries","المالية: مواعيد الدفع والإدخالات","/money","Open bills","افتح الفواتير");
 }
 if(intent==="savings"){
  if(m.demo)return answer(intent,"Add your own savings figures","أدخل أرقام ادخار عائلتك",
   "Sample figures cannot show your savings progress. Set a real target first.",
   "الأرقام التجريبية ما بتبيّن تقدّمك. أدخل هدف ادخار فعلي أولاً.",
   "Money: savings goals","المالية: أهداف الادخار","/money","Set a goal","حدد هدفاً");
  const goals=m.savingsGoals??[];
  if(!goals.length)return answer(intent,"Give savings a clear purpose","حدّد غاية للادخار",
   "No named savings goal is recorded yet. Choose an emergency, education or family experience goal; the app does not move money.",
   "ما في هدف ادخار محدد. اختَر هدفاً للطوارئ أو التعليم أو نشاط عائلي؛ التطبيق ما بيحوّل أموال.",
   "Money: savings goals","المالية: أهداف الادخار","/money","Create a goal","أضف هدفاً");
  const incomplete=goals.filter(g=>g.savedJod<g.targetJod);
  const assigned=goals.reduce((sum,g)=>sum+Math.max(0,g.monthlyJod),0);
  return answer(intent,"Your savings plan needs periodic review","ادخارك بحاجة لمراجعة دورية",
   goals.length+" recorded goal(s); "+incomplete.length+" have not reached their stated targets. Monthly allocations total "+
    assigned.toFixed(2)+" JOD, compared with the main monthly savings target of "+
    overview.month.savingsTarget.toFixed(2)+" JOD. These are manually recorded plans, not verified bank balances.",
   goals.length+" هدف مسجّل، و"+incomplete.length+" لم يصلوا لهدفهم بعد. التخصيص الشهري "+
    assigned.toFixed(2)+" د.أ مقابل هدف شهري عام "+overview.month.savingsTarget.toFixed(2)+
    " د.أ. هذه خطط مدخلة يدوياً وليست أرصدة بنكية مؤكدة.",
   "Money: named goals and monthly allocation","المالية: الأهداف والتخصيص الشهري","/money","Review goals","راجع الأهداف");
 }
 if(intent==="family"){
  const actual=realFamilyMembers(ctx.members);
  const occurrences=upcomingMoments(allFamilyMoments([...ctx.moments],actual),now,46);
  const next=occurrences[0];
  if(!next)return answer(intent,"Nothing coming up in your saved calendar","ما في مناسبة قريبة بالتقويم المحفوظ",
   "No birthday or calendar event is recorded for the next 45 days. Check that real family profiles and their dates are set up; sample profiles are ignored.",
   "ما في مناسبة مسجّلة خلال ٤٥ يوم. تأكد أنك أدخلت ملفات العائلة الفعلية وتواريخها، لأننا نتجاهل الملفات التجريبية.",
   "Family calendar and real member profiles","تقويم العائلة والملفات الفعلية","/calendar","Review calendar","راجع التقويم");
  return answer(intent,"Plan an upcoming family moment","حضّر لمناسبة عائلية قريبة",
   "Your next recorded event is "+next.title+" on "+next.occursOn+
    ". Set a comfortable budget, then compare ideas and availability separately; this is not a reservation.",
   "المناسبة المسجّلة القادمة هي "+next.title+" بتاريخ "+next.occursOn+
    ". حدد ميزانية مناسبة وقارن الخيارات والتوفر بشكل مستقل. ما في حجز تلقائي.",
   "Family calendar and real member profiles","تقويم العائلة والملفات الفعلية","/calendar","Plan the occasion","خطط للمناسبة");
 }
 if(intent==="plans"){
  const candidates=ctx.plans.filter(p=>p.status!=="completed")
    .sort((a,b)=>(a.date??"9999-12-31").localeCompare(b.date??"9999-12-31"));
  const p=candidates[0];
  if(!p)return answer(intent,"Start with one meaningful family plan","ابدأ بخطة واحدة بتهم العائلة",
   "There is no open plan recorded. You can create a family outing, purchase or occasion plan and review costs before spending.",
   "ما في خطة مفتوحة. يمكنك إنشاء خطة طلعة أو شراء أو مناسبة ومراجعة التكلفة قبل الصرف.",
   "Plans: saved local plan records","الخطط: المعلومات المحفوظة","/plans","Create a plan","أنشئ خطة");
  return answer(intent,"Review your next unfinished plan","راجع خطتك القادمة",
   p.title+(p.date?" · "+p.date:"")+
    ". "+(p.choice?"A choice has been recorded; confirm final real-world details.":"No final choice has been recorded yet.")+
    " Planning does not count as payment or booking.",
   p.title+(p.date?" · "+p.date:"")+
    ". "+(p.choice?"تم تسجيل اختيار؛ تأكد من التفاصيل الفعلية.":"لم يتم تسجيل اختيار نهائي بعد.")+
    " التخطيط لا يعني الدفع أو الحجز.",
   "Plans: saved local status and dates","الخطط: الحالة والتواريخ المسجلة","/plans","Review the plan","راجع الخطة");
 }
 if(intent==="tasks"){
  const summary=taskSummary(ctx.tasks??[],now);
  if(!summary.open)return answer(intent,"No open household tasks on this device","ما في مهام مفتوحة مسجّلة",
   "Add responsibilities with due dates in My Family. Tasks stay local and no assignment is sent to another parent.",
   "أضف المهام ومواعيدها في عائلتي. تبقى على جهازك ولا تُرسل لوالد آخر.",
   "My Family: parent-entered tasks","عائلتي: المهام التي أدخلتها","/space","Add a task","أضف مهمة");
  const next=summary.next[0];
  return answer(intent,"Your household responsibilities","مسؤوليات البيت",
   summary.overdue+" overdue, "+summary.dueSoon+" due within seven days. "+
   (next?"First to review: "+next.title+" ("+next.dueDate+"). ":"")+
   "These are locally recorded responsibilities, not confirmed messages to another family member.",
   summary.overdue+" متأخرة و"+summary.dueSoon+" خلال سبعة أيام. "+
   (next?"الأولى للمراجعة: "+next.title+" ("+next.dueDate+"). ":"")+
   "هذه مهام محلية وليست رسائل تم تسليمها لأحد.",
   "My Family: local task dates and status","عائلتي: تواريخ وحالة المهام","/space","Review tasks","راجع المهام");
 }
 if(intent==="gifts"){
  const wishlist=(ctx.wishlist??[]).filter(x=>x.kind==="gift"&&x.status==="considering");
  if(!wishlist.length)return answer(intent,"Start a thoughtful gift list","أنشئ قائمة هدايا للعائلة",
   "No unpurchased gift is recorded yet. Save a gift idea and target date, then check prices yourself.",
   "ما في هدايا مخططة مسجلة. احفظ فكرة وموعدها، وقارن الأسعار بنفسك.",
   "Gifts: saved private wishlist","الهدايا: القائمة الخاصة","/occasions","Open gifts","افتح الهدايا");
  const next=nextWishlistReminder(wishlist,now);
  const gift=next?.item??[...wishlist].sort((a,b)=>(a.targetDate??"9999").localeCompare(b.targetDate??"9999"))[0]!;
  const latest=summarizeWishlistPrice(gift).latest;
  return answer(intent,"Review an upcoming gift before spending","راجع الهدية قبل الشراء",
   gift.name+(gift.targetDate?" · needed by "+gift.targetDate:" · no deadline recorded")+
   ". "+(latest?"Your last recorded price is "+latest.amountJod.toFixed(2)+" JOD; verify it again with the retailer.":"You have not entered a checked price.")+
   " Marking a gift purchased does not create a payment.",
   gift.name+(gift.targetDate?" · مطلوبة قبل "+gift.targetDate:" · بلا موعد مسجل")+
   ". "+(latest?"آخر سعر سجلته "+latest.amountJod.toFixed(2)+" د.أ؛ تأكد منه مع المحل.":"لم تدخل سعراً بعد.")+
   " اعتبار الهدية مشتراة لا ينشئ عملية دفع.",
   "Gifts: private wishlist and user-checked prices","الهدايا: قائمة خاصة وأسعار أدخلتها","/occasions","Review gift ideas","راجع أفكار الهدايا");
 }
 if(intent==="outings"){
  const guidance=personalOutingAdvice(ctx);
  return answer(intent,guidance.titleEn,guidance.titleAr,guidance.detailEn,
   guidance.detailAr,guidance.sourceEn,guidance.sourceAr,guidance.route,
   guidance.actionEn,guidance.actionAr);
 }
 if(intent==="services"){
  const saved=ctx.services??[];
  if(!saved.length)return answer(intent,"Compare providers with independent evidence","قارن الخدمات بأدلة واضحة",
   "No provider is on your private list. Search independently, check official credentials and service terms, then record source links and costs. Dabberna cannot verify providers or diagnose conditions.",
   "ما في مزود خدمة محفوظ. ابحث وتأكد من التراخيص والشروط من مصادر رسمية ثم سجل الروابط والأسعار. دبّرنا لا يتحقق من الجهات ولا يشخّص الأمراض.",
   "Family Services: private comparison checklist","خدمات العائلة: قائمة مقارنة خاصة","/explore/services","Review service options","راجع خيارات الخدمات");
  const incomplete=saved.filter(x=>x.category==="doctor"&&!x.credentialsConfirmedByParent).length;
  return answer(intent,"Review your own provider comparisons","راجع مقارنات الخدمات الخاصة",
   saved.length+" providers saved in your private list. "+
   (incomplete?incomplete+" clinician entries still lack your credentials check. ":"")+
   "These are personal notes, not verified provider reviews, licensing records or availability.",
   saved.length+" مزودي خدمات محفوظين في قائمتك. "+
   (incomplete?incomplete+" سجلات لأطباء تحتاج لتدقيق المؤهلات من جانبك. ":"")+
   "هذه ملاحظات شخصية وليست مراجعات موثقة أو تأكيداً على الترخيص أو التوفر.",
   "Family Services: entered provider notes","خدمات العائلة: ملاحظاتك المسجلة","/explore/services","Review providers","راجع الجهات");
 }
 if(intent==="shopping")
  return answer(intent,"Compare the complete cost, not just the sticker","قارن التكلفة الكاملة مش السعر وحده",
   "Enter at least two actual offers including delivery or travel and review durability and suitability. Prices are manually entered, not verified live feeds; don't call the lowest entry a confirmed saving.",
   "أدخل عرضين فعليين على الأقل مع التوصيل أو النقل وراجع المتانة والملاءمة. الأسعار مدخلة يدوياً وليست أسعاراً مباشرة مؤكدة؛ الأرخص ليس وفراً مضموناً.",
   "Compare & Choose: entered prices and quality","قارن واختر: أسعار وتقييمات مدخلة يدوياً","/explore/smartbuy","Compare choices","قارن الخيارات");
 return answer("unsupported","Here are the questions I can answer safely","هذه الأسئلة التي يمكنني الإجابة عليها",
  "I can review cash risks, bills, tasks, gifts, local service notes, outings and shopping. I cannot verify providers, diagnose conditions, access bank accounts or hold a free-form AI conversation in this pilot.",
  "بقدر أساعدك بمراجعة الرصيد والفواتير والادخار والمناسبات والخطط والشراء. ما بقدر أتحقق من الحسابات البنكية أو أشخّص مشاكل صحية أو أقدّم محادثة ذكاء اصطناعي حرّة بهالنسخة.",
  "Device-only guided rules · no external AI","إرشادات محلية فقط دون ذكاء اصطناعي خارجي","/plans","See your plans","افتح الخطط");
}
