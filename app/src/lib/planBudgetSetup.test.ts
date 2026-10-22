import {describe,expect,it} from "vitest";
import {planBudgetSetupSteps,monthlyPlanReady,monthlyIncomeValue} from "./planBudgetSetup";
import {evaluatePlan} from "./planDecision";
import {emptyRealMoney} from "./moneyOverview";
import {makeFamilyPlan} from "./familyPlans";
import type {MoneyState} from "./money";
const now=new Date(2026,9,15,12);
const plan=()=>makeFamilyPlan({id:"shopping",title:"A purchase",kind:"purchase",budgetJod:300,date:"2026-10-20"},now)!;
const ready=():MoneyState=>({...emptyRealMoney(),income:2200,incomeKnown:true,savingsPct:0,
 categories:[{id:"groceries",name:"Groceries",type:"variable",planned:500}]});
describe("Plan → Money progress explains only genuinely missing facts",()=>{
 it("identifies exactly which saved records are missing, not a compulsory savings goal",()=>{
  expect(planBudgetSetupSteps(emptyRealMoney())).toEqual(["income","categories"]);
  expect(planBudgetSetupSteps({...ready(),financialInputsPartial:true})).toEqual(["review"]);
  expect(planBudgetSetupSteps(ready())).toEqual([]);
  expect(monthlyPlanReady(ready())).toBe(true);
  expect(evaluatePlan(plan(),ready(),[],now).monthlyAssessment).not.toBe("missing");
 });
 it("allows income=0 when explicitly entered, reporting a shortfall rather than demanding setup",()=>{
  const m={...ready(),income:0,incomeKnown:true};
  expect(monthlyPlanReady(m)).toBe(true);
  expect(monthlyIncomeValue(m)).toBe(0);
  expect(evaluatePlan(plan(),m,[],now).monthlyAssessment).toBe("shortfall");
 });
 it("does not require payday, savings target, actual cash or due bills to compare the monthly plan",()=>{
  const m=ready();
  expect(m.incomeSources).toBeUndefined();
  expect(m.savingsTargetAmount).toBeUndefined();
  expect(m.cashOnHand).toBeNull();
  expect(m.commitments).toEqual([]);
  expect(planBudgetSetupSteps(m)).toEqual([]);
  const result=evaluatePlan(plan(),m,[],now);
  expect(result.monthlyAssessment).toBe("fits");
  expect(result.cashAssessment).toBe("missing");
 });
 it("will not certify a partial budget or demo budget as ready",()=>{
  const m=ready();m.financialInputsPartial=true;
  expect(planBudgetSetupSteps(m)).toEqual(["review"]);
  expect(evaluatePlan(plan(),m,[],now).monthlyAssessment).toBe("missing");
  expect(planBudgetSetupSteps({...m,demo:true})).toEqual(["demo"]);
 });
 it("accepts an existing income schedule as known when the legacy incomeKnown field is absent",()=>{
  const {incomeKnown:_previous,...rest}=ready();
  const m:MoneyState={...rest,income:0,
   incomeSources:[{id:"salary",name:"Salary",amount:2200,nextDate:"",frequency:"monthly" as const,shared:false}]};
  expect(planBudgetSetupSteps(m)).toEqual([]);
  expect(monthlyIncomeValue(m)).toBe(2200);
 });
});
