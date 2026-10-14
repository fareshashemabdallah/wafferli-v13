import {describe,expect,it} from "vitest";
import {birthdayAge,daysUntil,eventBudgetGuidance,ideaCategory,leadAdvice,occasionIdeas,planKey,planningMilestones,upcomingPlanEvents} from "./occasionAdvisor";
import {sampleMoney,type Member} from "./money";
import type {FamilyMoment,MomentOccurrence} from "./familyCalendar";
const child:Member={id:"c",name:"Kid",role:"child",ageGroup:"6–12",prefs:"Art",birthday:"2019-11-04"};
const birthday:MomentOccurrence={id:"member-birthday:c",title:"Kid's birthday",date:"2019-11-04",kind:"birthday",annual:true,occursOn:"2026-11-04"};
const anniversary:FamilyMoment={id:"a",title:"Anniversary",date:"2017-11-05",kind:"anniversary",annual:true};
describe("Occasion assistant",()=>{
 it("detects the next occasion and per-year planning key without duplicating years",()=>{
  expect(upcomingPlanEvents([anniversary],[child],new Date(2026,9,14,12),40).map(x=>x.kind)).toEqual(["birthday","anniversary"]);
  expect(planKey(birthday)).toBe("member-birthday:c@2026");
  expect(planKey({...birthday,occursOn:"2027-11-04"})).not.toBe(planKey(birthday));
  expect(daysUntil("2026-11-04",new Date(2026,9,14,23))).toBe(21);
 });
 it("tailors creative ideas to a child and wedding anniversary",()=>{
  expect(ideaCategory(birthday,[child])).toBe("kids-birthday");
  expect(birthdayAge(birthday,[child])).toBe(7);
  expect(occasionIdeas(birthday,[child]).some(i=>i.id==="maker")).toBe(true);
  expect(occasionIdeas({...birthday,kind:"anniversary"},[child]).length).toBe(3);
  const wedding:MomentOccurrence={...anniversary,occursOn:"2026-11-05"};
  expect(occasionIdeas(wedding,[child]).some(i=>i.id==="story-date")).toBe(true);
 });
 it("prioritizes preparation before purchase rather than urgent spending",()=>{
  expect(leadAdvice(65,false)).toContain("time");
  expect(planningMilestones(5).find(m=>m.id==="reserve")?.due).toBe(true);
 });
 it("does not infer affordability from demo figures or missing cash",()=>{
  const sample=sampleMoney();
  expect(eventBudgetGuidance({budgetJod:65},sample,new Date(2026,9,14)).status).toBe("demo");
  expect(eventBudgetGuidance({budgetJod:65},{...sample,demo:false,cashOnHand:null},new Date(2026,9,14)).status).toBe("unknown");
  expect(eventBudgetGuidance(undefined,sample,new Date(2026,9,14)).status).toBe("unset");
 });
 it("conservatively flags a plan over available cash when real input is supplied",()=>{
  const m={...sampleMoney(),demo:false,cashOnHand:15,cashReserve:10,income:0,incomeSources:[],commitments:[]};
  expect(eventBudgetGuidance({budgetJod:50},m,new Date(2026,9,14)).status).toBe("review");
 });
});
