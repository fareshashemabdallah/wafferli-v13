import {
 allFamilyMoments,parseCalendarDate,type FamilyMoment,type MomentOccurrence
} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import type {FamilyPlan} from "./familyPlans";
import type {Member} from "./money";

/** Identity is stable across edits to an event's name or date.
 * The annual occurrence year belongs in the link, not in a second event.
 * This is a read-only projection: never write derived birthday/title/date
 * snapshots back to FamilyPlan, Money, Calendar or Family profiles. */
export const occasionSourceRef=(momentId:string,year:string)=>"occasion:"+momentId+"@"+year;
export function occasionLink(plan:FamilyPlan):{momentId:string;year:string}|null{
 if(plan.kind!=="occasion"||!plan.sourceRef?.startsWith("occasion:"))return null;
 const body=plan.sourceRef.slice("occasion:".length),separator=body.lastIndexOf("@");
 if(separator<1)return null;
 const momentId=body.slice(0,separator),year=body.slice(separator+1);
 if(!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>2200)return null;
 return {momentId,year};
}
export function canonicalFamilyMoments(
 authored:readonly FamilyMoment[],members:readonly Member[],arabic=false
):FamilyMoment[]{
 return allFamilyMoments([...authored],realFamilyMembers(members),arabic);
}
export function canonicalOccasionForPlan(
 plan:FamilyPlan,moments:readonly FamilyMoment[]
):MomentOccurrence|null{
 const ref=occasionLink(plan);
 if(!ref)return null;
 const event=moments.find(m=>m.id===ref.momentId);
 if(!event||!parseCalendarDate(event.date))return null;
 const date=event.annual?ref.year+event.date.slice(4):event.date;
 if(!parseCalendarDate(date)||event.annual&&date<event.date)return null;
 return {...event,occursOn:date};
}
/** The original plan owns choices, budget, gift costs, seller, and payment link.
 * The profile/Calendar event alone owns occasion name and date. */
export function canonicalPlanView(plan:FamilyPlan,moments:readonly FamilyMoment[]):FamilyPlan{
 const occurrence=canonicalOccasionForPlan(plan,moments);
 if(!occurrence)return plan;
 if(plan.title===occurrence.title&&plan.date===occurrence.occursOn)return plan;
 return {...plan,title:occurrence.title,date:occurrence.occursOn};
}
export function canonicalPlanViews(
 plans:readonly FamilyPlan[],authored:readonly FamilyMoment[],members:readonly Member[],arabic=false
):FamilyPlan[]{
 const moments=canonicalFamilyMoments(authored,members,arabic);
 return plans.map(plan=>canonicalPlanView(plan,moments));
}
/** A resolved occurrence is not reintroduced as an extra "moment" card when
 * its single linked plan is already shown in the home planning area. */
export function linkedOccasionKeys(plans:readonly FamilyPlan[]):Set<string>{
 return new Set(plans.map(p=>p.sourceRef).filter((x):x is string=>!!x&&x.startsWith("occasion:")));
}
export function isOccasionAlreadyPlanned(
 occurrence:MomentOccurrence,linked:Set<string>
):boolean{
 return linked.has(occasionSourceRef(occurrence.id,occurrence.occursOn.slice(0,4)));
}
