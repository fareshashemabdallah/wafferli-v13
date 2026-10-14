import type {MomentOccurrence,MomentKind} from "./familyCalendar";
import type {OccasionPlan} from "./occasionAdvisor";

export type DecisionGoal="outing"|"gift"|"places"|"advice";
export type DecisionJourney={
  eventId:string; occasionTitle:string; occasionDate:string;
  kind:MomentKind; goal:DecisionGoal; comfortableLimitJod:number|null;
  createdAt:string;
};
export const activeDecisionKey="activeDecision";
export function startDecisionJourney(item:MomentOccurrence,plan:OccasionPlan,goal:DecisionGoal,now=new Date()):DecisionJourney {
 return {eventId:item.id,occasionTitle:item.title,occasionDate:item.occursOn,kind:item.kind,goal,
  comfortableLimitJod:plan.budgetJod!=null&&Number.isFinite(plan.budgetJod)&&plan.budgetJod>=0?plan.budgetJod:null,
  createdAt:now.toISOString()};
}
export function activeJourney(value:unknown,now=new Date()):DecisionJourney|null {
 if(!value||typeof value!=="object")return null;
 const a=value as Partial<DecisionJourney>;
 if(typeof a.eventId!=="string"||typeof a.occasionTitle!=="string"||
  typeof a.occasionDate!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(a.occasionDate)||
  !["outing","gift","places","advice"].includes(a.goal??"")||
  typeof a.createdAt!=="string")return null;
 const created=Date.parse(a.createdAt);
 if(!Number.isFinite(created)||created>now.getTime()+60000||now.getTime()-created>30*86400000)return null;
 const amount=a.comfortableLimitJod;
 return {...(a as DecisionJourney),comfortableLimitJod:typeof amount==="number"&&Number.isFinite(amount)&&amount>=0&&amount<=100000?amount:null};
}
export function neutralMapQuery(goal:DecisionGoal,city:string):string {
 const cleanCity=city.trim().slice(0,80)||"Amman";
 const term=goal==="outing"?"family activities and experiences":goal==="gift"?"gift shops and crafts":goal==="places"?"restaurants and experiences":"local services";
 return term+" "+cleanCity+" Jordan";
}
export function externalMapLink(goal:DecisionGoal,city:string):string {
 return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(neutralMapQuery(goal,city));
}
