import {describe,expect,it} from "vitest";
import {sampleMoney,type MoneyState} from "./money";
import {applyStarterBudget} from "./starterBudget";
import {spendingBreakdown,canSplitStarter,splitStarterBudget} from "./spendingBreakdown";
const now=new Date(2026,9,16,12);
const ym="2026-10";
const real=():MoneyState=>({...sampleMoney(),demo:false,income:2000,
 categories:[
  {id:"rent",name:"Rent",type:"fixed",planned:650},
  {id:"water",name:"Utilities",type:"fixed",planned:100},
  {id:"food",name:"Groceries",type:"variable",planned:250},
  {id:"fuel",name:"Transport",type:"variable",planned:150},
  {id:"school",name:"School",type:"periodic",planned:100}
 ],
 expenses:[
  {id:"e1",date:ym+"-05",categoryId:"rent",amount:650,shared:true,status:"paid"},
  {id:"e2",date:ym+"-08",categoryId:"food",amount:80,shared:true,status:"paid"},
  {id:"e3",date:ym+"-10",categoryId:"food",amount:40,shared:true,status:"paid"},
  {id:"e4",date:ym+"-24",categoryId:"fuel",amount:200,shared:true,status:"planned"},
  {id:"old",date:"2026-09-01",categoryId:"food",amount:35,shared:true,status:"paid"}
 ],
 savingsTargetAmount:300
});
describe("parent-visible fixed and variable household costs",()=>{
 it("shows each fixed, variable and periodic category with entered spend, not only one figure",()=>{
  const v=spendingBreakdown(real(),now);
  expect(v.groups.find(g=>g.kind==="fixed")).toMatchObject({
   plannedJod:750,recordedJod:650,remainingJod:100,
   lines:[{id:"rent",plannedJod:650,recordedJod:650},{id:"water",plannedJod:100,recordedJod:0}]
  });
  expect(v.groups.find(g=>g.kind==="variable")).toMatchObject({
   plannedJod:400,recordedJod:120,remainingJod:280
  });
  expect(v.groups.find(g=>g.kind==="periodic")).toMatchObject({
   plannedJod:100,recordedJod:0,remainingJod:100
  });
  expect(v).toMatchObject({plannedJod:1250,recordedJod:770,remainingJod:480});
  expect(v.starterOnly).toBe(false);
 });
 it("keeps month-specific budget changes in the category breakdown",()=>{
  const state={...real(),monthlyAdjustments:{[ym]:{
   savingsDelta:0,categoryDeltas:{food:30,rent:-10}
  }}};
  const view=spendingBreakdown(state,now);
  expect(view.groups.find(g=>g.kind==="fixed")?.plannedJod).toBe(740);
  expect(view.groups.find(g=>g.kind==="variable")?.plannedJod).toBe(430);
  expect(view.plannedJod).toBe(1270);
 });
 it("shows overspending and non-category logged purchases rather than hiding them",()=>{
  const state={...real(),expenses:[
   ...real().expenses,
   {id:"big",date:ym+"-11",categoryId:"fuel",amount:210,shared:false,status:"paid" as const},
   {id:"unknown",date:ym+"-12",categoryId:"legacy-deleted",amount:25,shared:false,status:"paid" as const}
  ]};
  const view=spendingBreakdown(state,now);
  expect(view.groups.find(g=>g.kind==="variable")?.remainingJod).toBe(70);
  expect(view.groups.find(g=>g.kind==="unallocated")?.recordedJod).toBe(25);
  expect(view.uncategorizedRecordedJod).toBe(25);
  expect(view.recordedJod).toBe(1005);
 });
 it("does not pretend a single combined starter number represents known fixed costs",()=>{
  const starter=applyStarterBudget(sampleMoney(),{income:1500,spending:1100,savings:200});
  const view=spendingBreakdown(starter,now);
  expect(view.starterOnly).toBe(true);
  expect(view.groups.find(g=>g.kind==="unallocated")?.plannedJod).toBe(1100);
  expect(view.groups.find(g=>g.kind==="fixed")?.plannedJod).toBe(0);
  expect(view.groups.find(g=>g.kind==="variable")?.plannedJod).toBe(0);
  expect(canSplitStarter(starter)).toBe(true);
 });
 it("splits the parent's EXISTING estimate exactly once without changing incomes, history or savings",()=>{
  const start=applyStarterBudget(sampleMoney(),{income:1500,spending:1100,savings:200});
  const original=JSON.stringify(start);
  const split=splitStarterBudget(start,{fixed:650,variable:350,periodic:100});
  expect(split).not.toBe(start);
  expect(split.categories).toEqual([
   {id:"starter-fixed",name:"Fixed monthly costs",type:"fixed",planned:650},
   {id:"starter-variable",name:"Variable everyday costs",type:"variable",planned:350},
   {id:"starter-periodic",name:"Occasional costs",type:"periodic",planned:100}
  ]);
  expect(split.income).toBe(1500);
  expect(split.savingsTargetAmount).toBe(200);
  expect(split.expenses).toEqual([]);
  expect(spendingBreakdown(split,now).plannedJod).toBe(1100);
  expect(canSplitStarter(split)).toBe(false);
  expect(JSON.stringify(start)).toBe(original);
 });
 it("rejects invented totals, demo data, existing starter transactions or linked commitments",()=>{
  const starter=applyStarterBudget(sampleMoney(),{income:1500,spending:1100,savings:200});
  expect(splitStarterBudget(starter,{fixed:500,variable:500,periodic:0})).toBe(starter);
  expect(splitStarterBudget(starter,{fixed:-1,variable:1101,periodic:0})).toBe(starter);
  expect(splitStarterBudget(starter,{fixed:550.001,variable:549.999,periodic:0})).toBe(starter);
  expect(splitStarterBudget(sampleMoney(),{fixed:500,variable:500,periodic:0})).not.toHaveProperty("categories.0.id","starter-fixed");
  const paid={...starter,expenses:[{id:"x",date:ym+"-12",categoryId:"household-starter",amount:12,shared:true}]};
  expect(canSplitStarter(paid)).toBe(false);
  expect(splitStarterBudget(paid,{fixed:600,variable:500,periodic:0})).toBe(paid);
  const linked={...starter,commitments:[{id:"bill",name:"Rent",amount:600,frequency:"once" as const,
   dueDate:ym+"-20",categoryId:"household-starter"}]};
  expect(canSplitStarter(linked)).toBe(false);
 });
});
