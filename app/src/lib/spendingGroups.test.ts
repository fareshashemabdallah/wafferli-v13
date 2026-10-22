import {describe,it,expect} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {saveFamilyCategory,cleanOldCategoryRoles} from "./familyCategoryCards";
import {addCategoryItem} from "./unifiedCategoryLedger";
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
  expect(view.unassigned).toMatchObject([{categoryId:"car",planned:200,paid:0,kind:"cushion"}]);
  expect(view.groups.reduce((n,g)=>n+g.planned,0)+view.unassigned.reduce((n,g)=>n+g.planned,0))
   .toBe(view.totalPlanned);
  s.commitments=[];
  expect(spendingBreakdown(s,month).due).toEqual([]);
 });
 it("classifies a single category with no subcategories, with payments recorded once",()=>{
  const s=car();
  s.budgetItems=[];
  s.commitments=[];
  s.categories[0]={...s.categories[0]!,remainderRole:"necessary"};
  s.expenses=[{id:"fuel-expense",date:"2026-10-18",categoryId:"car",amount:180,shared:false,status:"paid"}];
  const view=spendingBreakdown(s,month);
  expect(view.groups.map(g=>g.planned)).toEqual([0,700,0]);
  expect(view.groups.map(g=>g.paid)).toEqual([0,180,0]);
  expect(view.groups[1]?.lines).toMatchObject([{
   categoryId:"car",isRemainder:true,planned:700,paid:180,needsReview:false
  }]);
  expect(view.unassigned).toEqual([]);
  expect(view.totalPlanned).toBe(700);
  expect(view.totalPaid).toBe(180);
  expect(view.due).toEqual([]);
 });
 it("an itemized category ignores a stale parent role and keeps the difference as a neutral cushion",()=>{
  const s=car();
  s.categories[0]={...s.categories[0]!,remainderRole:"flexible"};
  const view=spendingBreakdown(s,month);
  expect(view.groups.map(g=>g.planned)).toEqual([350,350,0]);
  expect(view.unassigned).toEqual([]);
  s.categories[0]!.planned=900;
  const part=spendingBreakdown(s,month);
  expect(part.groups.map(g=>g.planned)).toEqual([350,350,0]);
  expect(part.unassigned).toMatchObject([{categoryId:"car",planned:200,kind:"cushion"}]);
  expect(part.groups.reduce((n,g)=>n+g.planned,0)+part.unassigned.reduce((n,x)=>n+x.planned,0)).toBe(part.totalPlanned);
  expect(part.groups[0]?.paid).toBe(100);
  expect(part.groups[1]?.paid).toBe(90);
 });
 it("saving or clearing a direct category classification preserves all payments and subitems",()=>{
  const original=car();
  const first=saveFamilyCategory(original,{
   id:"car",name:"Car",planned:700,type:"variable",visualGroup:"custom",
   visualIcon:"fuel",remainderRole:"committed"
  },"unused");
  expect(first.ok).toBe(true);
  if(!first.ok)return;
  expect(first.state.categories[0]?.remainderRole).toBeUndefined();
  expect(first.state.budgetItems).toEqual(original.budgetItems);
  expect(first.state.commitments).toEqual(original.commitments);
  expect(first.state.expenses).toEqual(original.expenses);
  const cleared=saveFamilyCategory(first.state,{
   id:"car",name:"Car",planned:700,type:"variable",visualGroup:"custom",
   visualIcon:"fuel"
  },"unused");
  expect(cleared.ok).toBe(true);
  if(!cleared.ok)return;
  expect(cleared.state.categories[0]?.remainderRole).toBeUndefined();
  expect(cleared.state.budgetItems).toEqual(original.budgetItems);
  expect(cleared.state.expenses).toEqual(original.expenses);
 });
 it("monthly overrides preserve the signed reconciliation even if a direct role is set",()=>{
  const s=car();
  s.categories[0]={...s.categories[0]!,remainderRole:"committed"};
  s.categoryMonthlyPlans={"2026-10":{car:600}};
  const view=spendingBreakdown(s,month);
  expect(view.groups.reduce((n,g)=>n+g.planned,0)).toBe(700);
  expect(view.unassigned).toMatchObject([{categoryId:"car",planned:-100}]);
  expect(view.totalPlanned).toBe(600);
  expect(view.due[0]?.remaining).toBe(250);
 });
 it("Utilities five categorized lines total 405 JOD and leave a 95 JOD cushion, not an unclassified expense",()=>{
  const s=car();s.expenses=[];s.commitments=[];
  s.categories=[{id:"util",name:"Utilities",type:"variable",planned:500,remainderRole:"necessary"}];
  s.budgetItems=[
   {id:"water",categoryId:"util",name:"Water",enabled:true,amountJod:150,frequency:"monthly",behaviour:"variable",priority:"essential",spendingRole:"necessary"},
   {id:"elec",categoryId:"util",name:"Electricity",enabled:true,amountJod:150,frequency:"monthly",behaviour:"variable",priority:"essential",spendingRole:"necessary"},
   {id:"internet",categoryId:"util",name:"Internet",enabled:true,amountJod:35,frequency:"monthly",behaviour:"fixed",priority:"essential",spendingRole:"committed"},
   {id:"building",categoryId:"util",name:"Building",enabled:true,amountJod:50,frequency:"monthly",behaviour:"fixed",priority:"essential",spendingRole:"committed"},
   {id:"phone",categoryId:"util",name:"Phone",enabled:true,amountJod:20,frequency:"monthly",behaviour:"fixed",priority:"essential",spendingRole:"committed"}
  ];
  const view=spendingBreakdown(s,month);
  expect(view.groups.map(g=>g.planned)).toEqual([105,300,0]);
  expect(view.groups.flatMap(g=>g.lines)).toHaveLength(5);
  expect(view.unassigned).toEqual([{categoryId:"util",name:"Utilities",planned:95,paid:0,kind:"cushion"}]);
  expect(view.totalPlanned).toBe(500);
  expect(view.totalPaid).toBe(0);
  expect(view.due).toEqual([]);
  const clean=cleanOldCategoryRoles(s);
  expect(clean.categories[0]?.remainderRole).toBeUndefined();
  expect(clean.budgetItems).toEqual(s.budgetItems);
 });
 it("adding a first expense line retires the old direct category classification without changing its amount",()=>{
  const s=car();s.budgetItems=[];s.categories[0]={...s.categories[0]!,remainderRole:"committed"};
  const added=addCategoryItem(s,{id:"fuel",categoryId:"car",name:"Fuel",enabled:true,amountJod:250,
   frequency:"monthly",behaviour:"variable",priority:"essential",spendingRole:"necessary"});
  expect(added.categories[0]?.remainderRole).toBeUndefined();
  expect(added.categories[0]?.planned).toBe(700);
  expect(added.budgetItems).toHaveLength(1);
  expect(spendingBreakdown(added,month).unassigned).toMatchObject([{planned:450,kind:"cushion"}]);
 });
 it("a lower month-specific allowance reconciles grouped item amounts to the actual budget",()=>{
  const s=car();
  s.categoryMonthlyPlans={"2026-10":{car:600}};
  const view=spendingBreakdown(s,month);
  expect(view.totalPlanned).toBe(600);
  expect(view.unassigned[0]).toMatchObject({categoryId:"car",planned:-100});
  expect(view.groups.reduce((n,g)=>n+g.planned,0)+view.unassigned.reduce((n,l)=>n+l.planned,0)).toBe(600);
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
 it("one-time old category cleanup is idempotent and preserves every item, bill and payment",()=>{
  const s=car();
  s.categories[0]={...s.categories[0]!,spendingRole:"committed",expectedCadence:"monthly"} as typeof s.categories[number];
  const fixed=cleanOldCategoryRoles(s);
  expect(fixed).not.toBe(s);
  expect(fixed.categories[0]).not.toHaveProperty("spendingRole");
  expect(fixed.categories[0]).not.toHaveProperty("expectedCadence");
  expect(fixed.budgetItems).toEqual(s.budgetItems);
  expect(fixed.expenses).toEqual(s.expenses);
  expect(fixed.commitments).toEqual(s.commitments);
  expect(cleanOldCategoryRoles(fixed)).toBe(fixed);
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
