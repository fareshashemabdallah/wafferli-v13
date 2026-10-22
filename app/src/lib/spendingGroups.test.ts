import {describe,it,expect} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {saveFamilyCategory} from "./familyCategoryCards";
import {displaySpendingRole,spendingGroupSummaries} from "./spendingGroups";
import {evaluatePlan} from "./planDecision";
import {makeFamilyPlan} from "./familyPlans";
import type {MoneyState} from "./money";

const month="2026-10";
const state=():MoneyState=>({
 ...emptyRealMoney(),incomeKnown:true,income:5000,
 categories:[
  {id:"school",name:"School",type:"fixed",planned:800,spendingRole:"committed",expectedCadence:"monthly"},
  {id:"groc",name:"Groceries",type:"variable",planned:1200,spendingRole:"necessary",expectedCadence:"monthly"},
  {id:"out",name:"Family outings",type:"variable",planned:400,spendingRole:"flexible",expectedCadence:"monthly"}
 ],
 commitments:[{id:"school-bill",name:"School tuition",amount:800,categoryId:"school",frequency:"once",dueDate:"2026-10-25"}],
 expenses:[
  {id:"tuition-part",categoryId:"school",date:"2026-10-18",amount:300,billId:"school-bill",dueDate:"2026-10-25",shared:false,status:"paid"},
  {id:"groceries",categoryId:"groc",date:"2026-10-18",amount:450,shared:false,status:"paid"},
  {id:"outing",categoryId:"out",date:"2026-10-18",amount:80,shared:false,status:"paid"}
 ]
});
describe("one category, three independent spending behaviours",()=>{
 it("shows one canonical budget and payment amount per group; only actual bills are owed",()=>{
  const s=spendingGroupSummaries(state(),month);
  expect(s.map(x=>x.role)).toEqual(["committed","necessary","flexible"]);
  expect(s.map(x=>x.planned)).toEqual([800,1200,400]);
  expect(s.map(x=>x.paid)).toEqual([300,450,80]);
  expect(s.reduce((sum,x)=>sum+x.planned,0)).toBe(2400);
  expect(s.reduce((sum,x)=>sum+x.paid,0)).toBe(830);
  expect(s[0]).toMatchObject({billOutstanding:500,numberOfDatedBills:1});
  expect(s[1]).toMatchObject({billOutstanding:0,remainingAllowance:750});
  expect(s[2]).toMatchObject({billOutstanding:0,remainingAllowance:320});
 });
 it("does not invent a debt from the remainder of a committed category with no linked bill",()=>{
  const s=state();s.commitments=[];
  expect(spendingGroupSummaries(s,month)[0]).toMatchObject({
   numberOfDatedBills:0,billOutstanding:0,planned:800,paid:300
  });
 });
 it("older classifications are suggestions, not persisted or treated as contractual bills",()=>{
  const s=state();
  const legacy={id:"old",name:"School fees",type:"fixed" as const,planned:750};
  expect(displaySpendingRole(legacy)).toEqual({role:"committed",suggested:true});
  expect(displaySpendingRole({id:"g",name:"Car",type:"variable",planned:100})).toEqual({role:"necessary",suggested:true});
  expect(displaySpendingRole({id:"l",name:"Travel",type:"variable",planned:100})).toEqual({role:"flexible",suggested:true});
  const initial={...s,categories:[...s.categories,legacy]};
  const saved=saveFamilyCategory(initial,{id:"old",name:"School fees",planned:750,type:"fixed",
   visualGroup:"custom",visualIcon:"education",spendingRole:"flexible",expectedCadence:"yearly"},"unused");
  expect(saved.ok).toBe(true);
  if(!saved.ok)return;
  expect(saved.state.categories.find(c=>c.id==="old")).toMatchObject({spendingRole:"flexible",expectedCadence:"yearly",planned:750});
  expect(saved.state.commitments).toEqual(initial.commitments);
  expect(saved.state.expenses).toEqual(initial.expenses);
 });
 it("protects variable essentials in plan recommendations while allowing chosen flexible spending",()=>{
  const p=makeFamilyPlan({id:"trip",title:"Family trip",kind:"outing",date:"2026-10-28",budgetJod:100},new Date(2026,9,20))!;
  const plan=evaluatePlan(p,state(),[],new Date(2026,9,22));
  expect(plan.monthlyFlexible.map(x=>x.name)).toEqual(["Family outings"]);
  expect(plan.monthlyAssessment).not.toBe("missing");
 });
 it("separate frequency never creates an actual bill or changes monthly envelope",()=>{
  const s=state();
  const updated=saveFamilyCategory(s,{id:"groc",name:"Groceries",planned:1200,type:"variable",
   spendingRole:"necessary",expectedCadence:"yearly",visualGroup:"groceries",visualIcon:"groceries"},"unused");
  expect(updated.ok).toBe(true);
  if(!updated.ok)return;
  expect(spendingGroupSummaries(updated.state,month)[1]?.planned).toBe(1200);
  expect(updated.state.commitments).toEqual(s.commitments);
  expect(updated.state.expenses).toEqual(s.expenses);
 });
});
