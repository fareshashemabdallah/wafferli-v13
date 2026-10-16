import {describe,expect,it} from "vitest";
import {upsertOccasionFamilyPlan} from "./occasionPlanBridge";
import {chooseOccasion,occasionIdeas,planKey,type OccasionPlan} from "./occasionAdvisor";
import {makeFamilyPlan,markPlanComplete,type FamilyPlan} from "./familyPlans";
import type {MomentOccurrence} from "./familyCalendar";
import type {Member} from "./money";
const now=new Date("2026-10-16T09:00:00.000Z");
const event:MomentOccurrence={
 id:"school-party",title:"School party",date:"2026-11-12",occursOn:"2026-11-12",
 kind:"school",annual:false
};
const people:Member[]=[];
const firstIdea=occasionIdeas(event,people)[0]!;
const initial:OccasionPlan={budgetJod:50,chosenIdea:firstIdea.id};
const run=(plans:readonly FamilyPlan[],oc:OccasionPlan=initial,idea=firstIdea)=>
 upsertOccasionFamilyPlan(plans,event,oc,idea,"new-plan-123",now);

describe("Calendar > Occasion > Our Plans: one connected family decision",()=>{
 it("opens the exact calendar-selected occasion without repeating title or date",()=>{
  const other:MomentOccurrence={...event,id:"other",title:"Another date",date:"2026-11-14",occursOn:"2026-11-14"};
  const list=[other,event];
  expect(chooseOccasion(list,"",planKey(event))).toBe(event);
  expect(chooseOccasion(list,planKey(other),planKey(event))).toBe(other);
  expect(chooseOccasion(list,"","deleted-old-event")).toBe(other);
  expect(chooseOccasion([],"","")).toBeUndefined();
 });
 it("creates exactly one plan with reused date, budget, idea and source identity",()=>{
  const a=run([]);
  expect(a.created).toBe(true);
  expect(a.activeId).toBe("new-plan-123");
  expect(a.plans).toHaveLength(1);
  expect(a.plans[0]).toMatchObject({
   id:"new-plan-123",kind:"occasion",date:event.occursOn,
   title:"School party",sourceRef:"occasion:"+planKey(event),
   budgetJod:50,status:"decided"
  });
  expect(a.plans[0]!.choice?.source).toBe("occasion");
  expect(a.plans[0]!.choice?.label).toBe(firstIdea.en);
  expect(a.plans[0]!.expenseId).toBeUndefined();
  expect(a.plans[0]!.actualJod).toBeUndefined();
  expect(run(a.plans).plans).toHaveLength(1);
 });
 it("explicitly updates the same saved plan without changing any payment or unrelated plan",()=>{
  const unrelated=makeFamilyPlan({id:"unrelated",title:"Family holiday",kind:"outing",date:"2026-12-01"},now)!;
  const created=run([unrelated]).plans;
  const changed=run(created,{budgetJod:75,chosenIdea:firstIdea.id});
  expect(changed.created).toBe(false);
  expect(changed.activeId).toBe("new-plan-123");
  expect(changed.plans).toHaveLength(2);
  expect(changed.plans.find(p=>p.id==="new-plan-123")?.budgetJod).toBe(75);
  expect(changed.plans.find(p=>p.id==="unrelated")).toEqual(unrelated);
  expect(changed.plans.every(p=>p.expenseId===undefined)).toBe(true);
 });
 it("never rewrites a completed plan or recorded real expenses",()=>{
  const created=run([]).plans[0]!;
  const finished=markPlanComplete(created,35,now);
  const completed=run([{...finished,expenseId:"family-plan-new-plan-123"}],{budgetJod:200});
  expect(completed.changed).toBe(false);
  expect(completed.plans[0]?.status).toBe("completed");
  expect(completed.plans[0]?.expenseId).toBe("family-plan-new-plan-123");
  expect(completed.plans[0]?.actualJod).toBe(35);
 });
 it("does not manufacture a budget when the occasion has none",()=>{
  const p=run([],{budgetJod:null,chosenIdea:firstIdea.id});
  expect(p.plans[0]?.budgetJod).toBeUndefined();
  expect(p.plans[0]?.choice?.estimatedJod).toBeUndefined();
 });
});
