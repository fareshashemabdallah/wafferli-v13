import {describe,it,expect} from "vitest";
import {upsertOutingDecision,reflectOnOuting,decisionMoneyGuidance,latestExperienceOpportunity} from "./familyDecisionEngine";
import {markPlanComplete,type FamilyPlan} from "./familyPlans";
import {sampleMoney} from "./money";
import type {WeekendPlace} from "./weekendPlaceSearch";
const date=new Date("2026-10-21T12:00:00.000Z");
const place:WeekendPlace={id:"node/218",name:"Family Garden",category:"park",
 lat:31.95,lon:35.91,osmUrl:"https://www.openstreetmap.org/node/218"};
const input={id:"decision-1",place,city:"amman" as const,date:"2026-10-24",budgetJod:30};
describe("shared family decision architecture",()=>{
 it("creates a chosen outing without duplicating any Money expenses",()=>{
  const result=upsertOutingDecision([],input,date)!;
  expect(result.plan).toMatchObject({id:"decision-1",kind:"outing",status:"decided",
   budgetJod:30,date:"2026-10-24",sourceRef:place.osmUrl});
  expect(result.plan.decisionContext?.placeId).toBe(place.id);
  expect(result.plan.expenseId).toBeUndefined();
  expect(upsertOutingDecision(result.plans,{...input,id:"another"},date)).toMatchObject({
   created:false,plan:{id:"decision-1"}
  });
  expect(result.plans).toHaveLength(1);
 });
 it("preserves distinct dates and rejects invalid estimates",()=>{
  const one=upsertOutingDecision([],input,date)!;
  expect(upsertOutingDecision(one.plans,{...input,id:"two",date:"2026-11-01"},date)?.plans).toHaveLength(2);
  expect(upsertOutingDecision([], {...input,budgetJod:-1},date)).toBeNull();
  expect(upsertOutingDecision([], {...input,date:"2026-25-40"},date)).toBeNull();
 });
 it("does not publish a reflection or require a paid expense",()=>{
  const existing=upsertOutingDecision([],input,date)!.plan;
  expect(reflectOnOuting(existing,{enjoyed:"yes",value:"yes"},date)).toBeNull();
  const done=markPlanComplete(existing,27,date);
  const note=reflectOnOuting(done,{enjoyed:"mixed",value:"no",note:" Crowded but fun "},date)!;
  expect(note.decisionContext?.reflection).toMatchObject({enjoyed:"mixed",value:"no",note:"Crowded but fun",visibility:"private"});
  expect(note.expenseId).toBeUndefined();
  expect(latestExperienceOpportunity([note],"2026-10-21")).toBeNull();
  expect(latestExperienceOpportunity([done],"2026-10-21")?.id).toBe(existing.id);
 });
 it("declines to claim affordability from demo figures",()=>{
  const p=upsertOutingDecision([],input,date)!.plan;
  const result=decisionMoneyGuidance(p,sampleMoney(),date);
  expect(result.state).toBe("unavailable");
  expect(result.en).toMatch(/Insufficient/);
  const withoutEstimate={...p};delete withoutEstimate.budgetJod;delete withoutEstimate.choice;
  expect(decisionMoneyGuidance(withoutEstimate,sampleMoney(),date).state).toBe("unavailable");
 });
 it("never changes a preexisting plan while saving a new choice",()=>{
  const old:FamilyPlan={id:"legacy",title:"Existing gift",kind:"occasion",status:"planning",createdAt:date.toISOString(),updatedAt:date.toISOString()};
  const result=upsertOutingDecision([old],input,date)!;
  expect(result.plans[1]).toEqual(old);
 });
});
