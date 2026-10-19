import {describe,expect,it} from "vitest";
import {applyProgressiveMoneyFacts,canSaveProgressiveFacts,householdCountSource,familyAgeLabel} from "./progressiveFamilyInput";
import {sampleMoney,sampleMembers,type Member} from "./money";
import {emptyRealMoney} from "./moneyOverview";
import {computeMoney} from "./money";
import {emptyHouseholdPresence} from "./householdPresence";
import {assessFinancialReality} from "./financialReality";
import {makeFamilyPlan} from "./familyPlans";
import {evaluatePlan} from "./planDecision";
import {estimateHouseholdPresence} from "./householdPresence";
const now=new Date(2026,9,19,12);
describe("progressive one-fact input and one source of truth",()=>{
 it("accepts only essential spending without inventing income or unrelated category totals",()=>{
  const before=sampleMoney();
  const after=applyProgressiveMoneyFacts(before,{essential:650});
  expect(after.demo).toBe(false);
  expect(after.incomeKnown).toBeUndefined();
  expect(after.income).toBe(0);
  expect(after.categories).toEqual([{id:"household-essential",name:"Essential household costs (estimate)",
   type:"fixed",priority:"essential",planned:650,amountConfidence:"estimate"}]);
  expect(after.cashOnHand).toBeNull();
  expect(after.expenses).toEqual([]);
  expect(before.demo).toBe(true);
  expect(assessFinancialReality(after,[],now).knownIncomeJod).toBeNull();
 });
 it("adds a second known fact without repeating or replacing the first one",()=>{
  const first=applyProgressiveMoneyFacts(sampleMoney(),{essential:650});
  const second=applyProgressiveMoneyFacts(first,{other:200});
  expect(second.categories).toHaveLength(2);
  expect(second.categories[0]).toEqual(first.categories[0]);
  expect(second.incomeKnown).toBeUndefined();
  const income=applyProgressiveMoneyFacts(second,{income:1400,incomeConfidence:"estimate"});
  expect(income.incomeKnown).toBe(true);
  expect(income.incomeSources).toBeUndefined();
  expect(computeMoney(income,now)).toMatchObject({monthlyIncome:1400,planned:850});
 });
 it("keeps unknown income distinct from explicitly confirmed zero",()=>{
  const empty=emptyRealMoney();
  expect(applyProgressiveMoneyFacts(empty,{income:0})).toBe(empty);
  const zero=applyProgressiveMoneyFacts(empty,{income:0,zeroIncomeConfirmed:true});
  expect(zero.incomeKnown).toBe(true);
  expect(zero.income).toBe(0);
  expect(applyProgressiveMoneyFacts(empty,{})).toBe(empty);
  expect(canSaveProgressiveFacts(empty,{income:NaN})).toBe(false);
  expect(canSaveProgressiveFacts(empty,{essential:-1})).toBe(false);
 });
 it("never silently overrides named categories, real income sources, expenses or cash",()=>{
  const existing={...emptyRealMoney(),cashOnHand:120,expenses:[{
   id:"paid",date:"2026-10-18",categoryId:"groceries",amount:10,shared:true
  }],categories:[{id:"groceries",name:"Groceries",planned:200,type:"variable" as const}]};
  expect(applyProgressiveMoneyFacts(existing,{essential:1000})).toBe(existing);
  const savings=applyProgressiveMoneyFacts(existing,{savings:75});
  expect(savings.categories).toEqual(existing.categories);
  expect(savings.expenses).toEqual(existing.expenses);
  expect(savings.cashOnHand).toBe(120);
  const incomeSources={...existing,incomeSources:[{id:"job",name:"Job",amount:1500,
   frequency:"monthly" as const,nextDate:"2026-10-25",shared:true}]};
  expect(applyProgressiveMoneyFacts(incomeSources,{income:900})).toBe(incomeSources);
  const legacy={...emptyRealMoney(),income:1800};
  expect(applyProgressiveMoneyFacts(legacy,{income:900})).toBe(legacy);
 });
 it("never counts sample family members and allows anonymous counts only when specifically entered",()=>{
  expect(householdCountSource(sampleMembers(),emptyHouseholdPresence())).toEqual({
   source:"unknown",adults:null,children:null
  });
  const dad:Member={id:"father",name:"Father",role:"adult",prefs:"",ageGroup:"30–44"};
  expect(householdCountSource([...sampleMembers(),dad],emptyHouseholdPresence())).toEqual({
   source:"profiles",adults:1,children:0
  });
  expect(householdCountSource([dad],{...emptyHouseholdPresence(),adults:2,children:3})).toEqual({
   source:"anonymous",adults:2,children:3
  });
 });
 it("does not turn one known cost into imaginary spending room or a false plan approval",()=>{
  const partial=applyProgressiveMoneyFacts(sampleMoney(),{income:3000,essential:600});
  expect(partial.financialInputsPartial).toBe(true);
  expect(assessFinancialReality(partial,[],now).kind).toBe("unknown");
  const plan=makeFamilyPlan({id:"outing",title:"Family day",kind:"outing",budgetJod:100},now)!;
  expect(evaluatePlan(plan,partial,[],now).monthlyAssessment).toBe("missing");
  expect(evaluatePlan(plan,partial,[],now).suggestedCeiling).toBeNull();
  const reviewed={...partial,financialInputsPartial:false};
  expect(assessFinancialReality(reviewed,[],now).kind).toBe("room");
 });
 it("does not silently mix incomplete anonymous household counts with named profiles",()=>{
  const person:Member={id:"dad",name:"Dad",role:"adult",ageGroup:"30–44",prefs:""};
  const source={...emptyHouseholdPresence(),adults:2,children:null};
  expect(householdCountSource([person],source)).toEqual({source:"anonymous",adults:2,children:null});
  expect(estimateHouseholdPresence(source,[person],"2026-10").adults).toBe(2);
  expect(estimateHouseholdPresence(source,[person],"2026-10").children).toBeNull();
 });
 it("uses the specific age once, with a legacy band only as fallback",()=>{
  const p:Member={id:"c",name:"Child",role:"child",ageGroup:"6–12",prefs:"",ageYears:8};
  expect(familyAgeLabel(p)).toBe("8");
  expect(familyAgeLabel({...p,ageYears:undefined})).toBe("6–12");
 });
});
