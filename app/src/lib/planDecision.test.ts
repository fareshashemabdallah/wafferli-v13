import {describe,expect,it} from "vitest";
import {evaluatePlan} from "./planDecision";
import {makeFamilyPlan,setPlanChoice} from "./familyPlans";
import type {MoneyState} from "./money";
const now=new Date(2026,9,15,12);
const plan=()=>makeFamilyPlan({id:"a",title:"School shoes",kind:"purchase",date:"2026-10-20",budgetJod:120},now)!;
const finances=():MoneyState=>({
 demo:false,income:1000,savingsPct:20,savingsTargetAmount:200,
 categories:[
  {id:"housing",name:"Housing",planned:400,type:"fixed"},
  {id:"food",name:"Groceries",planned:200,type:"variable"},
  {id:"fun",name:"Leisure",planned:150,type:"variable"}
 ],budgetItems:[{id:"leisure-line",categoryId:"fun",name:"Leisure outings",amountJod:150,frequency:"monthly",spendingRole:"flexible",behaviour:"variable",priority:"flexible",enabled:true}],expenses:[],cashOnHand:1000,cashReserve:100,
 commitments:[{id:"bill",name:"Rent",amount:300,frequency:"once",dueDate:"2026-10-20",categoryId:"housing"}]
});
describe("actionable Plan financial comparisons",()=>{
 it("shows monthly allocation and cash check independently, not double deducting bills",()=>{
  const result=evaluatePlan(plan(),finances(),[],now);
  expect(result).toMatchObject({cost:120,month:"2026-10",unallocated:50,monthlyGap:-70,
    monthlyAssessment:"shortfall",cashRemaining:600,cashGap:480,cashAssessment:"fits",suggestedCeiling:50});
  expect(result.monthlyFlexible[0]).toMatchObject({name:"Leisure · Leisure outings",room:150});
 });
 it("compares a priced option rather than the earlier ceiling and flags a higher option",()=>{
  const chosen=setPlanChoice(plan(),{label:"Shop B",source:"comparison",estimatedJod:145},now);
  const r=evaluatePlan(chosen,finances(),[],now);
  expect(r.cost).toBe(145);
  expect(r.choiceExceedsLimit).toBe(25);
  expect(r.monthlyGap).toBe(-95);
 });
 it("does not use example data or absent spending categories for affordability",()=>{
  expect(evaluatePlan(plan(),{...finances(),demo:true},[],now).monthlyAssessment).toBe("missing");
  expect(evaluatePlan(plan(),{...finances(),categories:[]},[],now).monthlyAssessment).toBe("missing");
  expect(evaluatePlan(plan(),{...finances(),cashOnHand:null},[],now).cashAssessment).toBe("missing");
  expect(evaluatePlan(plan(),{...finances(),commitments:[]},[],now).cashAssessment).toBe("missing");
 });
 it("does not claim current cash is enough for distant future plans",()=>{
  const p={...plan(),date:"2027-02-15"};
  const r=evaluatePlan(p,finances(),[],now);
  expect(r.cashAssessment).toBe("future");
  expect(r.month).toBe("2027-02");
 });
 it("warns of shortfalls rather than reporting zero available",()=>{
  const r=evaluatePlan(plan(),{...finances(),cashOnHand:200},[],now);
  expect(r.cashRemaining).toBe(-200);
  expect(r.cashAssessment).not.toBe("fits");
 });
 it("requires a cost and identifies other planned purchases in the same month",()=>{
  const p=makeFamilyPlan({id:"x",title:"Another outing",kind:"outing",date:"2026-10-21"},now)!;
  const r=evaluatePlan(p,finances(),[p,plan()],now);
  expect(r.cost).toBeNull();
  expect(r.missing).toContain("plan-cost");
  expect(r.otherPlans).toBe(1);
 });
});
