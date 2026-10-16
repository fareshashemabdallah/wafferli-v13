import type {MomentOccurrence} from "./familyCalendar";
import {makeFamilyPlan,setPlanChoice,type FamilyPlan} from "./familyPlans";
import {planKey,type OccasionPlan,type OccasionIdea} from "./occasionAdvisor";

/** One explicit parent-initiated transfer from a family date into Our Plans.
 * Safe on repeated taps; never creates payments, balances or expense records. */
export function upsertOccasionFamilyPlan(
 existing:readonly FamilyPlan[],
 event:MomentOccurrence,
 occasion:OccasionPlan,
 idea:OccasionIdea|undefined,
 newId:string,
 now=new Date(),
 language:"en"|"ar"="en"
):{plans:FamilyPlan[];activeId:string|null;changed:boolean;created:boolean}{
 const ref="occasion:"+planKey(event);
 const old=existing.find(p=>p.sourceRef===ref);
 if(old?.status==="completed")return {plans:[...existing],activeId:old.id,changed:false,created:false};
 const budget=occasion.budgetJod;
 const allowed=budget!==null&&Number.isFinite(budget)&&budget>=0&&budget<=100000?budget:undefined;
 if(!old){
  const made=makeFamilyPlan({id:newId,title:event.title,kind:"occasion",date:event.occursOn,
   ...(allowed!==undefined?{budgetJod:allowed}:{}),sourceRef:ref},now);
  if(!made)return {plans:[...existing],activeId:null,changed:false,created:false};
  const next=idea?setPlanChoice(made,{label:language==="ar"?idea.ar:idea.en,source:"occasion"},now):made;
  return {plans:[next,...existing],activeId:next.id,changed:true,created:true};
 }
 const nextBase:FamilyPlan={...old,date:event.occursOn,
  updatedAt:now.toISOString(),
  ...(allowed!==undefined?{budgetJod:allowed}:{})};
 // Do not remove an earlier budget or a recorded choice if this local planner
 // has no replacement. A completed plan must never be reopened.
 const next=idea?setPlanChoice(nextBase,{label:language==="ar"?idea.ar:idea.en,source:"occasion"},now):nextBase;
 if(old.date===next.date&&old.budgetJod===next.budgetJod&&
    old.choice?.label===next.choice?.label&&old.choice?.source===next.choice?.source)
  return {plans:[...existing],activeId:old.id,changed:false,created:false};
 return {plans:existing.map(p=>p.id===old.id?next:p),activeId:old.id,changed:true,created:false};
}
