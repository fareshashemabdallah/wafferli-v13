import {makeFamilyPlan,reviewPlanCost,setPlanChoice,type FamilyPlan} from "./familyPlans";
import type {MoneyState} from "./money";
import type {WeekendPlace,WeekendCity} from "./weekendPlaceSearch";
import {weekendCityName} from "./weekendPlaceSearch";

/** A choice is not a charge, a booking or a verified recommendation. The
 * existing FamilyPlan is the single source of truth across Today/Money/Family. */
export type FamilyDecisionReflection={
 enjoyed:"yes"|"mixed"|"no";
 value:"yes"|"mixed"|"no";
 note:string;
 updatedAt:string;
 visibility:"private";
};
export type FamilyDecisionContext={
 city?:string;
 placeId?:string;
 category?:string;
 placeSource?:"openstreetmap"|"manual";
 reflection?:FamilyDecisionReflection;
 publicSharedAt?:string;
};
export type DecisionPlan=FamilyPlan&{decisionContext?:FamilyDecisionContext};

export type OutingInput={
 id:string;
 place:WeekendPlace;
 city:WeekendCity;
 date?:string;
 budgetJod?:number;
};
export type OutingResult={plans:FamilyPlan[];plan:DecisionPlan;created:boolean};
const validBudget=(n:number|undefined)=>n===undefined||(Number.isFinite(n)&&n>=0&&n<=100000);
const validDate=(s:string|undefined)=>s===undefined||(/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T12:00:00")));
export function upsertOutingDecision(
 current:readonly FamilyPlan[],input:OutingInput,now=new Date()
):OutingResult|null{
 if(!input.place?.osmUrl?.startsWith("https://www.openstreetmap.org/")||
  !input.place.name.trim()||!validBudget(input.budgetJod)||!validDate(input.date))return null;
 const existing=current.find(p=>p.kind==="outing"&&p.status!=="completed"&&
  p.sourceRef===input.place.osmUrl&&(p.date??"")===(input.date??"")) as DecisionPlan|undefined;
 if(existing)return {plans:[...current],plan:existing,created:false};
 const base=makeFamilyPlan({id:input.id,title:input.place.name,kind:"outing",sourceRef:input.place.osmUrl,
  ...(input.date?{date:input.date}:{}),
  ...(input.budgetJod!==undefined?{budgetJod:input.budgetJod}:{})},now);
 if(!base)return null;
 const decided=setPlanChoice(base,{label:input.place.name,source:"outing",
  ...(input.budgetJod!==undefined?{estimatedJod:input.budgetJod}:{})},now);
 const plan:DecisionPlan={...decided,decisionContext:{
  placeId:input.place.id,placeSource:"openstreetmap",
  city:weekendCityName(input.city),category:input.place.category
 }};
 return {plans:[plan,...current],plan,created:true};
}
/** Save a private reflection within the existing plan. Sharing publicly is a
 * separate, deliberate authenticated action; this method never publishes. */
export function reflectOnOuting(
 plan:FamilyPlan,
 input:{enjoyed:"yes"|"mixed"|"no";value:"yes"|"mixed"|"no";note?:string},
 now=new Date()
):DecisionPlan|null{
 if(plan.kind!=="outing"||plan.status!=="completed"||
  !["yes","mixed","no"].includes(input.enjoyed)||!["yes","mixed","no"].includes(input.value))return null;
 const old=plan as DecisionPlan;
 return {...old,updatedAt:now.toISOString(),
  decisionContext:{...old.decisionContext,reflection:{
   enjoyed:input.enjoyed,value:input.value,
   note:(input.note??"").trim().slice(0,300),
   updatedAt:now.toISOString(),visibility:"private"
  }}};
}
export function decisionMoneyGuidance(
 plan:FamilyPlan,money:MoneyState,now=new Date()
):{state:"unavailable"|"review"|"provisional";en:string;ar:string}{
 if(plan.budgetJod===undefined&&plan.choice?.estimatedJod===undefined)
  return {state:"unavailable",en:"No estimated family cost yet. Nothing has been charged.",
   ar:"ما في تكلفة تقديرية بعد. ما تم خصم أي مبلغ."};
 const outcome=reviewPlanCost(plan,money,now);
 if(outcome.status==="review")
  return {state:"review",en:"Your recorded cash and upcoming commitments need review before deciding. This is not a bank confirmation.",
   ar:"السيولة والالتزامات المسجلة بحاجة لمراجعة قبل القرار. هذا مش تأكيد بنكي."};
 if(outcome.status==="provisional")
  return {state:"provisional",en:"Your recorded figures provisionally cover this estimate. Unrecorded everyday expenses may change the picture.",
   ar:"حسب معلوماتك المسجلة المبلغ مغطّى مبدئياً. المصاريف غير المسجلة ممكن تغيّر النتيجة."};
 return {state:"unavailable",en:"Insufficient verified household financial information for an affordability conclusion.",
  ar:"المعلومات المالية غير كافية للاستنتاج إن الطلعة مناسبة للميزانية."};
}
export function latestExperienceOpportunity(plans:readonly FamilyPlan[],today:string):DecisionPlan|null{
 return ([...plans] as DecisionPlan[]).filter(p=>p.kind==="outing"&&p.status==="completed"&&
  !p.decisionContext?.reflection&&p.completedAt?.slice(0,10)!==undefined&&
  (p.completedAt?.slice(0,10)??"")<=today)
  .sort((a,b)=>(b.completedAt??"").localeCompare(a.completedAt??""))[0]??null;
}
