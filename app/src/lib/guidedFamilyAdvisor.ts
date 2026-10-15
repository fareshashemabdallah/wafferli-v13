import {getMoneyOverview} from "./moneyOverview";
import {realFamilyMembers} from "./familySetup";
import {allFamilyMoments,upcomingMoments} from "./familyCalendar";
import {dateKey} from "./familyCalendar";
import type {FamilyMoment} from "./familyCalendar";
import type {MoneyState,Member} from "./money";
import type {FamilyPlan} from "./familyPlans";
import type {FamilyPreferences} from "./familyPreferences";

export type AdvisorIntent="safety"|"bills"|"savings"|"family"|"shopping"|"plans"|"unsupported";
export type GuidedAnswer={
 intent:AdvisorIntent;
 titleEn:string;titleAr:string;
 textEn:string;textAr:string;
 sourceEn:string;sourceAr:string;
 route:"/money"|"/calendar"|"/plans"|"/explore/smartbuy"|"/explore/together";
 actionEn:string;actionAr:string;
};
export type AdvisorContext={
 money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 plans:readonly FamilyPlan[];preferences:FamilyPreferences;now?:Date;
};
export const guidedPrompts=[
 {id:"safety" as const,en:"Is our spending safe?",ar:"هل وضع مصروف العائلة آمن؟"},
 {id:"bills" as const,en:"What bills need attention?",ar:"شو الفواتير اللي لازم ننتبه إلها؟"},
 {id:"savings" as const,en:"How are our savings goals?",ar:"كيف ماشيين بأهداف الادخار؟"},
 {id:"family" as const,en:"What's coming up for the children?",ar:"شو في مناسبات للأطفال قريباً؟"},
 {id:"plans" as const,en:"What should we plan next?",ar:"شو لازم نخطّط له؟"},
 {id:"shopping" as const,en:"How can we buy more wisely?",ar:"كيف نشتري بذكاء؟"}
];
const hit=(q:string,words:RegExp)=>words.test(q);
export function detectAdvisorIntent(question:string):AdvisorIntent{
 const q=question.toLocaleLowerCase().trim().slice(0,400);
 if(!q)return "unsupported";
 if(hit(q,/bill|due|overdue|invoice|payment date|فواتير|فاتورة|مستحق|دفعات|دفع/i))return "bills";
 if(hit(q,/saving|goal|هدف|ادخار|توفير|نوفر/i))return "savings";
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
 if(intent==="safety"){
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
 if(intent==="shopping")
  return answer(intent,"Compare the complete cost, not just the sticker","قارن التكلفة الكاملة مش السعر وحده",
   "Enter at least two actual offers including delivery or travel and review durability and suitability. Prices are manually entered, not verified live feeds; don't call the lowest entry a confirmed saving.",
   "أدخل عرضين فعليين على الأقل مع التوصيل أو النقل وراجع المتانة والملاءمة. الأسعار مدخلة يدوياً وليست أسعاراً مباشرة مؤكدة؛ الأرخص ليس وفراً مضموناً.",
   "Compare & Choose: entered prices and quality","قارن واختر: أسعار وتقييمات مدخلة يدوياً","/explore/smartbuy","Compare choices","قارن الخيارات");
 return answer("unsupported","Here are the questions I can answer safely","هذه الأسئلة التي يمكنني الإجابة عليها",
  "I can help review recorded cash risks, bills, savings, family occasions, plans and shopping decisions. I cannot search providers, diagnose conditions, verify bank balances or hold a free-form AI conversation in this pilot.",
  "بقدر أساعدك بمراجعة الرصيد والفواتير والادخار والمناسبات والخطط والشراء. ما بقدر أتحقق من الحسابات البنكية أو أشخّص مشاكل صحية أو أقدّم محادثة ذكاء اصطناعي حرّة بهالنسخة.",
  "Device-only guided rules · no external AI","إرشادات محلية فقط دون ذكاء اصطناعي خارجي","/plans","See your plans","افتح الخطط");
}
