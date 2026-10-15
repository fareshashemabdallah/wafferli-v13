import {describe,expect,it} from "vitest";
import {buildFamilyDecisionBrief} from "./familyDecisionBrief";
import {sampleMoney,sampleMembers,type MoneyState} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";
import {makeFamilyPlan} from "./familyPlans";
import {makeFamilyTask} from "./familyTasks";
const now=new Date(2026,9,15,12);
const money:MoneyState={...sampleMoney(),demo:false,income:2000,
 cashOnHand:200,cashReserve:100,cashUpdatedAt:"2026-10-15",
 commitments:[{id:"rent",name:"Rent",amount:180,frequency:"once",dueDate:"2026-10-19"}],
 incomeSources:[{id:"salary",name:"Salary",amount:2000,frequency:"monthly",nextDate:"2026-10-30",shared:true}]
};
const plan=makeFamilyPlan({id:"plan-1",title:"School shopping",kind:"purchase",
 date:"2026-10-19",budgetJod:300},now)!;
const task=makeFamilyTask({id:"task-1",title:"Pack school bags",dueDate:"2026-10-18",
 priority:"high",planId:plan.id},now)!;
const args=(changes:Record<string,unknown>={})=>({money,plans:[plan],tasks:[task],
 members:sampleMembers(),moments:[],preferences:defaultFamilyPreferences,now,...changes});
describe("family decisions orchestrator",()=>{
 it("connects a near-term purchase, dated task and financial risk",()=>{
  const a=buildFamilyDecisionBrief(args());
  expect(a.steps[0]?.id).toBe("cash-review");
  expect(a.steps.some(s=>s.id==="tasks")).toBe(true);
  expect(a.steps.some(s=>s.id==="plan")).toBe(true);
  expect(a.titleEn).toContain("Protect");
  expect(a.steps.length).toBeLessThanOrEqual(3);
 });
 it("never assumes demo money can verify affordability",()=>{
  const x=buildFamilyDecisionBrief(args({money:sampleMoney()}));
  expect(x.steps.some(s=>s.id==="cash-review")).toBe(false);
  expect(x.notesEn).toContain("No live AI");
 });
 it("avoids child profile mock birthdays and handles empty real data",()=>{
  const a=buildFamilyDecisionBrief(args({plans:[],tasks:[]}));
  expect(a.steps.some(s=>s.id==="occasion")).toBe(false);
  expect(a.steps.some(s=>s.id==="outing")).toBe(true);
  expect(a.contextEn).toContain("chose to record");
 });
 it("respects finance and lifestyle preferences individually",()=>{
  const x=buildFamilyDecisionBrief(args({preferences:{...defaultFamilyPreferences,financeTips:false}}));
  expect(x.steps.some(s=>s.id==="cash-review")).toBe(false);
  const noLife=buildFamilyDecisionBrief(args({preferences:{...defaultFamilyPreferences,lifestyle:false}}));
  expect(noLife.steps.some(s=>s.id==="tasks"||s.id==="occasion")).toBe(false);
 });
 it("does not alter Money, Plan or Task records",()=>{
  const input=args(),snapshot=JSON.stringify(input);
  buildFamilyDecisionBrief(input);
  expect(JSON.stringify(input)).toBe(snapshot);
 });
});
