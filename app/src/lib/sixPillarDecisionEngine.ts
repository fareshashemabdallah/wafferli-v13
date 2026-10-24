import {assessFinancialReality} from "./financialReality";
import {getMoneyOverview} from "./moneyOverview";
import {allFamilyMoments,dateKey,upcomingMoments,parseCalendarDate} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import {makeFamilyPlan,reviewPlanCost,type FamilyPlan,type PlanKind} from "./familyPlans";
import type {Member,MoneyState} from "./money";
import type {FamilyMoment} from "./familyCalendar";
import type {FamilyPreferences} from "./familyPreferences";

export type DecisionScenario="outing"|"activity"|"occasion"|"purchase";
export type DecisionApproach="compare"|"stage"|"affordable";
/** Keyword guidance is deterministic and intentionally limited; no AI is implied. */
export function scenarioFromQuestion(value:string):DecisionScenario|null{
 const text=value.toLocaleLowerCase().slice(0,250);
 if(!text.trim())return null;
 if(/birthday|anniversary|celebrat|gift|عيد ميلاد|مناسبة|هدية|هدايا/.test(text))return "occasion";
 if(/shop|buy|purchase|product|grocer|price|شراء|اشتري|مشتريات|منتج|بقالة|سعر/.test(text))return "purchase";
 if(/lesson|course|class|swim|football|sport|training|club|تدريب|دروس|سباحة|كرة قدم|نادي|رياضة/.test(text))return "activity";
 if(/weekend|outing|park|trip|play|family time|طلعة|ويكند|حديقة|مشوار|نزهة|رحلة/.test(text))return "outing";
 return null;
}
export type FamilyValue="education"|"development"|"family-time"|"health"|"traditions"|"security"|"experiences";
export const FAMILY_VALUES:readonly {id:FamilyValue;en:string;ar:string}[]=[
 {id:"education",en:"Education",ar:"التعليم"},
 {id:"development",en:"Children's development and sports",ar:"تطوّر الأولاد والرياضة"},
 {id:"family-time",en:"Time together",ar:"وقت العيلة"},
 {id:"health",en:"Health and wellbeing",ar:"الصحة والراحة"},
 {id:"traditions",en:"Family traditions",ar:"تقاليد العيلة"},
 {id:"security",en:"Financial security",ar:"الأمان المالي"},
 {id:"experiences",en:"Meaningful experiences",ar:"تجارب وذكريات"}
] as const;
export const DECISION_SCENARIOS:readonly {id:DecisionScenario;en:string;ar:string;planKind:PlanKind}[]=[
 {id:"outing",en:"Something to enjoy together",ar:"طلعة نستمتع فيها سوا",planKind:"outing"},
 {id:"activity",en:"A child's regular activity",ar:"نشاط منتظم لأحد الأولاد",planKind:"other"},
 {id:"occasion",en:"A birthday or family occasion",ar:"عيد ميلاد أو مناسبة",planKind:"occasion"},
 {id:"purchase",en:"An important family purchase",ar:"شراء مهم للعيلة",planKind:"purchase"}
] as const;
export type DecisionOption={id:DecisionApproach;titleEn:string;titleAr:string;
 detailEn:string;detailAr:string;actionEn:string;actionAr:string;route:"/money"|"/calendar"|"/plans"};
export type DecisionBrief={
 scenario:DecisionScenario;titleEn:string;titleAr:string;
 familyEn:string;familyAr:string;upcomingEn:string;upcomingAr:string;
 realityEn:string;realityAr:string;protectedEn:string;protectedAr:string;
 unknownsEn:string[];unknownsAr:string[];options:DecisionOption[];
 sourceEn:string;sourceAr:string;/** No external URLs or confidence of availability. */ verifiedProviders:false;
};
export type DecisionContext={money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 plans:readonly FamilyPlan[];preferences:FamilyPreferences;now?:Date;estimatedJod?:number};
const familyDate=(now:Date)=>dateKey(now);
const localizedValues=(ids:readonly FamilyValue[],ar:boolean)=>ids.map(id=>{
 const value=FAMILY_VALUES.find(x=>x.id===id);
 return value?(ar?value.ar:value.en):"";
}).filter(Boolean);
export function futureFamilyMilestones(context:DecisionContext){
 const now=context.now??new Date(),today=familyDate(now);
 const events=upcomingMoments(allFamilyMoments([...context.moments],realFamilyMembers(context.members)),now,46)
  .filter(x=>x.occursOn>=today).slice(0,3).map(x=>({title:x.title,date:x.occursOn,kind:"occasion" as const}));
 const plans=context.plans.filter(x=>x.status!=="completed"&&x.date&&x.date>=today&&x.date<=dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()+45,12)))
 .slice().sort((a,b)=>(a.date??"").localeCompare(b.date??"")).slice(0,3)
 .map(x=>({title:x.title,date:x.date!,kind:"plan" as const,planId:x.id}));
 const bills=context.money.demo?[]:getMoneyOverview(context.money,now,context.plans).forecast.events
  .filter(x=>x.kind==="bill"&&x.displayDate>=today)
  .slice(0,3).map(x=>({title:x.name,date:x.displayDate,kind:"bill" as const}));
 return [...events,...plans,...bills].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
}
export function decideFamilyNextSteps(scenario:DecisionScenario,ctx:DecisionContext):DecisionBrief{
 const now=ctx.now??new Date(),m=ctx.money;
 const real=realFamilyMembers(ctx.members);
 const childAges=real.filter(x=>x.role==="child"&&typeof x.ageYears==="number"&&Number.isInteger(x.ageYears)&&x.ageYears>=0&&x.ageYears<=18).map(x=>x.ageYears!);
 const allChildren=real.filter(x=>x.role==="child").length;
 const familyEn=childAges.length?
  "Saved ages: "+childAges.join(", ")+". "+(allChildren>childAges.length?"Some children's ages are unknown; don't assume they can attend.":"Confirm actual age rules and supervision for each child."):
  "No verified child ages saved; start with general options. Children's profiles are optional.";
 const familyAr=childAges.length?"الأعمار المسجّلة: "+childAges.join("، ")+". تأكد من الأعمار المناسبة والإشراف لكل طفل.":
  "ما في أعمار أطفال فعلية مسجّلة؛ ممكن تستكشف الخيارات العامة بدون ملف للأطفال.";
 const milestone=futureFamilyMilestones(ctx);
 const upcomingEn=milestone.length?"Recorded upcoming plans/dates: "+milestone.map(x=>x.date+" · "+x.title).join("; ")+". These are your records, not confirmed with providers.":
  "No dates or future commitments were found in your saved family plans/calendar; this does not mean none exist.";
 const upcomingAr=milestone.length?"القادم حسب سجلاتك: "+milestone.map(x=>x.date+" · "+x.title).join("؛ ")+". هذه بياناتك وليست تأكيداً من الجهة.":
  "ما لقينا مواعيد أو التزامات محفوظة؛ مش بالضرورة يعني ما في التزامات.";
 const reality=assessFinancialReality(m,ctx.plans,now);
 const estimate=ctx.estimatedJod;
 const hypothetical=estimate!==undefined?makeFamilyPlan({id:"decision-preview",title:"Proposed family decision",kind:scenario==="outing"?"outing":scenario==="occasion"?"occasion":scenario==="purchase"?"purchase":"other",budgetJod:estimate},now):null;
 const costReview=hypothetical?reviewPlanCost(hypothetical,m,now):null;
 const known=m.demo===false&&reality.knownIncomeJod!==null;
 const financeEn= !known?
  "Finances are missing or based on sample data. Compare options, but no affordability conclusion is possible.":
  reality.messageEn+" "+(costReview?"Cost review: "+costReview.reason:"No specific verified full-family cost was supplied.");
 const financeAr=!known?"البيانات المالية ناقصة أو تجريبية. فينا نقارن الخيارات لكن ما فينا نؤكد القدرة على الدفع.":
  reality.messageAr+(costReview?" مراجعة التكلفة: "+(costReview.status==="review"?"يجب مراجعة الالتزامات والسيولة قبل القرار.":costReview.status==="unknown"?"بيانات السيولة والفواتير غير مكتملة.":"الأرقام المسجلة تقديرية وليست ضماناً للدفع."):" لم يتم إدخال تكلفة مؤكدة كاملة للعيلة.");
 const mapping={children:"development",education:"education","family-time":"family-time",health:"health",travel:"experiences",buffer:"security"} as const;
 const priority=Array.from(new Set([...(ctx.preferences.protectedFamilyValues??[]),
  ...(m.protectedLifestyle??[]).map(id=>mapping[id])])) as FamilyValue[];
 const protectedCats=!m.demo?m.categories.filter(x=>x.priority==="protected").map(x=>x.name).slice(0,4):[];
 const protectedEn=(priority.length?"What matters to you: "+localizedValues(priority,false).join(", ")+". ":"")+
  (protectedCats.length?"Spending marked protected: "+protectedCats.join(", ")+". ":"")+
  "Never assume that protected commitments should be cut. Essential needs come first; only the parent can change priorities.";
 const protectedAr=(priority.length?"من أولويات عيلتك: "+localizedValues(priority,true).join("، ")+". ":"")+
  (protectedCats.length?"مصاريف اخترت تحميها: "+protectedCats.join("، ")+". ":"")+
  "ما منفترض خفض مصاريف مهمة؛ الأساسيات أولاً والقرار للأهل.";
 const financialPressure=!known||reality.kind==="unknown"||reality.kind==="essentials-gap"||reality.kind==="plan-gap"||reality.kind==="tight"||reality.forecastCashRisk||costReview?.status==="review";
 const titles={
  outing:["Find a family experience that works","ابحث عن طلعة مناسبة للعيلة"],
  activity:["Give your child a chance without rushing a commitment","نشاط للأولاد بدون تسرّع بالتزام"],
  occasion:["Prepare a meaningful family occasion","حضّر مناسبة بتعني لعيلتك"],
  purchase:["Choose a purchase with confidence","اختار شراء بناسب عيلتك"]
 } as const;
 const subjects={
  outing:["family-friendly places and activities","أماكن وأنشطة عائلية","Check places, supervision, schedules and full family cost.","قارن الأماكن والإشراف والمواعيد والتكلفة الكاملة."],
  activity:["age-appropriate programmes and instructors","برامج ومدرّبين مناسبين للعمر","Compare total joining and recurring fees, timetable and instructor conditions.","قارن رسوم التسجيل والاشتراك والمواعيد وشروط المدرّبين."],
  occasion:["celebration ideas, gifts and dates","أفكار المناسبة والهدايا والمواعيد","Compare celebration and gift options, and include preparation time.","قارن الخيارات وتكاليف الهدايا ووقت التحضير."],
  purchase:["products, quality and credible seller prices","المنتجات والجودة وأسعار المتاجر","Compare actual seller quotes, durability, extras and delivery.","قارن أسعار المتاجر وجودة المنتج والإضافات والتوصيل."]
 } as const;
 const subject=subjects[scenario],go:DecisionOption["route"]=scenario==="occasion"?"/calendar":"/plans";
 const options:DecisionOption[]=[
  {id:"compare",titleEn:"Compare suitable options",titleAr:"قارن خيارات مناسبة",
   detailEn:subject[2]+" Choose based on family preferences and real, independently checked facts—not an advertisement.",
   detailAr:subject[3]+" الاختيار حسب حاجة العيلة ومعلومات يتم التحقق منها، مش إعلان.",
   actionEn:"Explore and compare",actionAr:"استكشف وقارن",route:go},
  {id:"stage",titleEn:"Plan in stages",titleAr:"خطط على مراحل",
   detailEn:"Keep the family priority, but consider a later date, an introductory session, or smaller initial commitment. Review recorded upcoming dates before deciding.",
   detailAr:"احتفظ بأولوية العيلة وفكّر بموعد لاحق أو تجربة أولية أو التزام أصغر. راجع المواعيد القادمة أولاً.",
   actionEn:"Review family plans",actionAr:"راجع خطط العيلة",route:"/plans"},
  {id:"affordable",titleEn:"Explore lower-cost alternatives",titleAr:"استكشف بدائل أقل تكلفة",
   detailEn:"Look for potentially free or community options and compare the full family cost including travel. These options and prices are not yet verified.",
   detailAr:"دوّر على خيارات مجتمعية أو محتملة مجاناً وقارن التكلفة الكاملة مع المواصلات؛ التوفر والأسعار غير مؤكدة.",
   actionEn:"Look for alternatives",actionAr:"ابحث عن بدائل",route:go}
 ];
 const scores:Record<DecisionApproach,number>={compare:1,stage:0,affordable:0};
 if(financialPressure){scores.stage+=4;scores.affordable+=2;}
 if(reality.kind==="essentials-gap"||reality.kind==="plan-gap"){scores.stage+=7;scores.affordable+=4;}
 if(ctx.preferences.discoveryPriority==="quality")scores.compare+=4;
 if(ctx.preferences.discoveryPriority==="affordable"||ctx.preferences.freeActivitiesFirst)scores.affordable+=4;
 if(priority.includes("security"))scores.stage+=2;
 if(priority.includes("family-time")||priority.includes("development"))scores.compare+=1;
 if(ctx.preferences.decisionLearningEnabled){
  const feedback=ctx.preferences.decisionFeedback?.[scenario];
  for(const id of ["compare","stage","affordable"] as const)scores[id]+=Math.min(3,Math.max(-3,feedback?.[id]??0));
 }
 const arranged=options.slice().sort((a,b)=>scores[b.id]-scores[a.id]||options.indexOf(a)-options.indexOf(b));
 const unknownsEn=[subject[2],
  "Published prices, capacity, safeguarding and live availability must be verified with providers.",
  ...(financialPressure?["No safe-to-spend conclusion can be made from the available information."]:[])];
 const unknownsAr=[subject[3],"تأكد من الأسعار والإشراف والتوفر مباشرة من الجهات.",
  ...(financialPressure?["المعلومات لا تسمح بضمان قدرة العيلة على الصرف."]:[])];
 return {scenario,titleEn:titles[scenario][0],titleAr:titles[scenario][1],
 familyEn,familyAr,upcomingEn,upcomingAr,realityEn:financeEn,realityAr:financeAr,
 protectedEn,protectedAr,unknownsEn,unknownsAr,options:arranged,
 sourceEn:"Your browser-local family profiles, plans, optional priorities and entered finances; no provider catalogue verified.",
 sourceAr:"ملفات وخطط وتفضيلات العيلة والأرقام المدخلة على هذا الجهاز؛ لا يوجد تحقق من قاعدة مزوّدين.",
 verifiedProviders:false};
}
/** A share card is deliberately regenerated from fixed public-safe strings. Never include
 * a user's prompt, amount, child age/name, value selections, calendar date or financial data.
 */
export function publicDecisionInvitation(scenario:DecisionScenario,approach:DecisionApproach,arabic=false):string{
 const topic=DECISION_SCENARIOS.find(x=>x.id===scenario)!;
 const option=approach==="compare"?"comparing options":approach==="stage"?"considering timing": "looking for affordable alternatives";
 return arabic?
  "دبّرنا | عم نفكّر بـ"+topic.ar+". بدنا نقارن الخيارات والمواعيد والتكاليف مع بعض. شاركنا اقتراحاتك بشكل خاص—بدون مشاركة أي بيانات مالية أو شخصية.":
  "Dabberna | We're considering: "+topic.en+". We're "+option+". Share your ideas, suitable dates and publicly available information. No private family or financial details are included.";
}
export function planFromDecision(input:{scenario:DecisionScenario;approach:DecisionApproach;amount?:number;date?:string},id:string,now=new Date()):FamilyPlan|null{
 if(input.date&&!parseCalendarDate(input.date))return null;
 const topic=DECISION_SCENARIOS.find(x=>x.id===input.scenario)!;
 const mode=input.approach==="compare"?"Compare options":input.approach==="stage"?"Review timing":"Check affordable alternatives";
 return makeFamilyPlan({id,title:topic.en,
  kind:topic.planKind,...(input.amount!==undefined?{budgetJod:input.amount}:{}),
  ...(input.date?{date:input.date}:{}),
  note:"Decision idea: "+mode+". Parent must verify providers, actual costs, suitability and any booking."
 },now);
}
