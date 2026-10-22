import {describe,it,expect} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {saveFamilyCategory} from "./familyCategoryCards";
import {displayItemRole,spendingBreakdown} from "./spendingGroups";
import {evaluatePlan} from "./planDecision";
import {makeFamilyPlan} from "./familyPlans";
import type {MoneyState} from "./money";
const month="2026-10";
const car=():MoneyState=>({
 ...emptyRealMoney(),incomeKnown:true,income:5000,
 categories:[{id:"car",name:"Car",type:"variable",planned:700,
  visualGroup:"custom",visualIcon:"fuel"}],
 budgetItems:[
  {id:"loan",categoryId:"car",name:"Instalment",enabled:true,amountJod:350,frequency:"monthly",
   spendingRole:"committed",behaviour:"fixed",priority:"essential"},
  {id:"petrol",categoryId:"car",name:"Fuel",enabled:true,amountJod:250,frequency:"monthly",
   spendingRole:"necessary",behaviour:"variable",priority:"essential"},
  {id:"maint",categoryId:"car",name:"Maintenance",enabled:true,amountJod:1200,frequency:"yearly",
   spendingRole:"necessary",behaviour:"variable",priority:"essential"}
 ],
 commitments:[{id:"car-bill",name:"Car instalment",amount:350,categoryId:"car",
  budgetItemId:"loan",frequency:"monthly",dueDate:"2026-10-25"}],
 expenses:[
  {id:"partial",categoryId:"car",date:"2026-10-18",amount:100,
   billId:"car-bill",dueDate:"2026-10-25",shared:false,status:"paid"},
  {id:"petrol-paid",categoryId:"car",budgetItemId:"petrol",
   date:"2026-10-18",amount:90,shared:false,status:"paid"}
 ]
});
describe("Line-level classification is the only canonical Money classification",()=>{
 it("Car exists once but its three expense lines go into two groups, without double counting",()=>{
  const view=spendingBreakdown(car(),month);
  expect(view.groups.map(g=>g.planned)).toEqual([350,350,0]);
  expect(view.groups.map(g=>g.paid)).toEqual([100,90,0]);
  expect(view.groups[0]?.lines.map(l=>l.name)).toEqual(["Instalment"]);
  expect(view.groups[1]?.lines.map(l=>l.name)).toEqual(["Fuel","Maintenance"]);
  expect(view.totalPlanned).toBe(700);
  expect(view.totalPaid).toBe(190);
  expect(view.unassigned).toEqual([]);
  expect(view.due).toMatchObject([{billId:"car-bill",remaining:250,paid:100,due:350}]);
 });
 it("Unsplit category budget remains visible and never treated as a debt or locked into a group",()=>{
  const s=car();
  s.categories[0]!.planned=900;
  const view=spendingBreakdown(s,month);
  expect(view.unassigned).toMatchObject([{categoryId:"car",planned:200,paid:0}]);
  expect(view.groups.reduce((n,g)=>n+g.planned,0)+view.unassigned.reduce((n,g)=>n+g.planned,0))
   .toBe(view.totalPlanned);
  s.commitments=[];
  expect(spendingBreakdown(s,month).due).toEqual([]);
 });
 it("expense without an item, as well as an orphaned item, stays unassigned instead of guessed",()=>{
  const s=car();
  s.expenses.push({id:"wash",categoryId:"car",date:"2026-10-19",amount:35,shared:false,status:"paid"});
  s.expenses.push({id:"old",categoryId:"car",budgetItemId:"removed",date:"2026-10-20",amount:11,shared:false,status:"paid"});
  const view=spendingBreakdown(s,month);
  expect(view.unassigned).toMatchObject([{categoryId:"car",planned:0,paid:46}]);
  expect(view.totalPaid).toBe(236);
 });
 it("legacy lines receive reviewable suggestions but are never turned into obligations",()=>{
  const old={id:"t",categoryId:"car",name:"Car instalment",enabled:true,amountJod:200,
   frequency:"monthly" as const,behaviour:"fixed" as const,priority:"essential" as const};
  expect(displayItemRole(old)).toEqual({role:"committed",suggested:true});
  expect(displayItemRole({...old,name:"Fuel"})).toEqual({role:"necessary",suggested:true});
  expect(displayItemRole({...old,name:"Gift",priority:"flexible"})).toEqual({role:"flexible",suggested:true});
 });
 it("save of an old category strips redundant category role metadata while keeping original bills",()=>{
  const s=car();
  s.categories[0]={...s.categories[0]!,spendingRole:"committed",expectedCadence:"monthly"} as typeof s.categories[number];
  const saved=saveFamilyCategory(s,{id:"car",name:"Car",planned:700,type:"variable",
   visualGroup:"custom",visualIcon:"fuel"},"unused");
  expect(saved.ok).toBe(true);
  if(!saved.ok)return;
  expect(saved.state.categories[0]).not.toHaveProperty("spendingRole");
  expect(saved.state.categories[0]).not.toHaveProperty("expectedCadence");
  expect(saved.state.expenses).toEqual(s.expenses);
  expect(saved.state.commitments).toEqual(s.commitments);
 });
 it("the planner suggests only flexible lines and respects protected family priorities",()=>{
  const s=car();
  s.categories[0]!.planned=800;
  s.budgetItems!.push({id:"wash",categoryId:"car",name:"Car wash",enabled:true,amountJod:100,
   frequency:"monthly",spendingRole:"flexible",behaviour:"variable",priority:"flexible"});
  const plan=makeFamilyPlan({id:"trip",title:"Family trip",kind:"outing",date:"2026-10-28",budgetJod:100},new Date(2026,9,20))!;
  expect(evaluatePlan(plan,s,[],new Date(2026,9,22)).monthlyFlexible.map(x=>x.name)).toEqual(["Car · Car wash"]);
  s.budgetItems!.find(i=>i.id==="wash")!.priority="protected";
  expect(evaluatePlan(plan,s,[],new Date(2026,9,22)).monthlyFlexible).toEqual([]);
 });
});
