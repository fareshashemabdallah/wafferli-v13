import {describe,expect,it} from "vitest";
import {applyStarterBudget,needsStarterBudget} from "./starterBudget";
import {emptyRealMoney} from "./moneyOverview";
import {computeMoney,sampleMoney,type MoneyState} from "./money";
import {makeFamilyPlan} from "./familyPlans";
import {evaluatePlan} from "./planDecision";
const when=new Date(2026,9,15,12);
describe("guided first-run Money setup for Plans",()=>{
 it("turns demo finances into honest monthly estimates without imaginary income deposits",()=>{
  const sample=sampleMoney();
  expect(needsStarterBudget(sample)).toBe(true);
  const real=applyStarterBudget(sample,{income:1500,spending:900,savings:200});
  expect(real.demo).toBe(false);
  expect(real.incomeSources).toBeUndefined();
  expect(real.commitments).toEqual([]);
  expect(real.cashOnHand).toBeNull();
  expect(real.categories).toMatchObject([{id:"household-starter",planned:900,type:"fixed"}]);
  expect(computeMoney(real,when)).toMatchObject({monthlyIncome:1500,planned:900,savingsTarget:200});
  expect(sample.demo).toBe(true);
  expect(sample.categories[0]?.name).toBe("Rent");
 });
 it("gives an actual Plan a meaningful provisional monthly comparison as soon as the three values are entered",()=>{
  const plan=makeFamilyPlan({id:"a",title:"Family outing",kind:"outing",budgetJod:500,date:"2026-11-15"},when)!;
  const money=applyStarterBudget(emptyRealMoney(),{income:1500,spending:900,savings:200});
  const r=evaluatePlan(plan,money,[plan],when);
  expect(r.unallocated).toBe(400);
  expect(r.monthlyGap).toBe(-100);
  expect(r.monthlyAssessment).toBe("shortfall");
  expect(r.cashAssessment).toBe("missing");
 });
 it("preserves entered manual cash when completing an otherwise blank budget",()=>{
  const s={...emptyRealMoney(),cashOnHand:850,cashReserve:100};
  expect(needsStarterBudget(s)).toBe(true);
  const result=applyStarterBudget(s,{income:2000,spending:800,savings:250});
  expect(result.cashOnHand).toBe(850);
  expect(result.cashReserve).toBe(100);
 });
 it("never overwrites existing real expenses, categories, or bills during quick setup",()=>{
  const s:MoneyState={...emptyRealMoney(),categories:[{id:"food",name:"Food",planned:250,type:"variable"}]};
  expect(needsStarterBudget(s)).toBe(false);
  expect(applyStarterBudget(s,{income:1000,spending:500,savings:100})).toBe(s);
  const withBills={...emptyRealMoney(),commitments:[{id:"a",name:"Rent",amount:500,frequency:"monthly" as const,dueDate:"2026-10-30"}]};
  expect(needsStarterBudget(withBills)).toBe(false);
  expect(applyStarterBudget(withBills,{income:1000,spending:500,savings:100})).toBe(withBills);
 });
 it("rejects missing or invalid money figures and does not mutate existing state",()=>{
  const blank=emptyRealMoney();
  expect(applyStarterBudget(blank,{income:0,spending:400,savings:50})).toBe(blank);
  expect(applyStarterBudget(blank,{income:1200,spending:-2,savings:50})).toBe(blank);
  expect(applyStarterBudget(blank,{income:1200,spending:400,savings:Infinity})).toBe(blank);
 });
});
