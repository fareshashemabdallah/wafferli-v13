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
 it("preserves existing real spending categories and saves only missing income",()=>{
  const s:MoneyState={...emptyRealMoney(),categories:[{id:"food",name:"Food",planned:250,type:"variable"}]};
  expect(needsStarterBudget(s)).toBe(true);
  expect(applyStarterBudget(s,{income:1000,spending:500,savings:100})).toBe(s);
  const result=applyStarterBudget(s,{income:1000,spending:250,savings:100});
  expect(result.categories).toEqual(s.categories);
  expect(computeMoney(result,when).monthlyIncome).toBe(1000);
  expect(computeMoney(result,when).savingsTarget).toBe(100);
 });
 it("preserves real dated bills and entered cash while filling missing monthly budgets",()=>{
  const bill={id:"a",name:"Rent",amount:500,frequency:"monthly" as const,dueDate:"2026-10-30"};
  const old={...emptyRealMoney(),cashOnHand:800,cashReserve:150,commitments:[bill]};
  expect(needsStarterBudget(old)).toBe(true);
  const result=applyStarterBudget(old,{income:1200,spending:750,savings:100});
  expect(result.commitments).toEqual([bill]);
  expect(result.cashOnHand).toBe(800);
  expect(result.cashReserve).toBe(150);
  expect(computeMoney(result,when).planned).toBe(750);
  expect(old.categories).toEqual([]);
 });
 it("does not overwrite previous real expenses or dated income sources",()=>{
  const expense={id:"e",date:"2026-10-01",categoryId:"misc",amount:200,shared:true};
  const old:MoneyState={...emptyRealMoney(),expenses:[expense],incomeSources:[{
   id:"income",name:"Salary",amount:1400,frequency:"monthly",nextDate:"2026-10-25",shared:true
  }]};
  const result=applyStarterBudget(old,{income:1400,spending:900,savings:150});
  expect(result.incomeSources).toEqual(old.incomeSources);
  expect(result.expenses).toEqual([expense]);
  expect(result.categories).toHaveLength(1);
  expect(result.savingsTargetAmount).toBe(150);
 });
 it("rejects missing or invalid money figures and does not mutate existing state",()=>{
  const blank=emptyRealMoney();
  expect(applyStarterBudget(blank,{income:0,spending:400,savings:50})).toBe(blank);
  expect(applyStarterBudget(blank,{income:1200,spending:-2,savings:50})).toBe(blank);
  expect(applyStarterBudget(blank,{income:1200,spending:400,savings:Infinity})).toBe(blank);
 });
 it("keeps an existing savings target and cash untouched when a parent skips optional savings",()=>{
  const old={...emptyRealMoney(),savingsPct:10,savingsTargetAmount:180,cashOnHand:75};
  const next=applyStarterBudget(old,{income:1500,spending:900,essential:700,other:200});
  expect(next.savingsTargetAmount).toBe(180);
  expect(next.savingsPct).toBe(10);
  expect(next.cashOnHand).toBe(75);
  expect(next.categories.map(c=>c.priority)).toEqual(["essential","flexible"]);
  expect(computeMoney(next,when).savingsTarget).toBe(180);
 });
 it("does not force a savings answer during first real household setup",()=>{
  const next=applyStarterBudget(emptyRealMoney(),{income:0,zeroIncomeConfirmed:true,
   spending:250,essential:250,other:0});
  expect(next.incomeKnown).toBe(true);
  expect(computeMoney(next,when).savingsTarget).toBe(0);
 });
});
