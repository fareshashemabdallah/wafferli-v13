import {describe,expect,it} from "vitest";
import {spendingMixSummary} from "./spendingMixSummary";
import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";

const month="2026-10";
const example=():MoneyState=>({
 ...emptyRealMoney(),
 income:5000,incomeKnown:true,
 categories:[
  {id:"school",name:"School",type:"fixed",planned:2250},
  {id:"food",name:"Groceries",type:"variable",planned:1850},
  {id:"out",name:"Family outings",type:"variable",planned:600},
  {id:"car",name:"Car",type:"variable",planned:205}
 ],
 budgetItems:[
  {id:"school-fee",categoryId:"school",name:"School fee",amountJod:2250,enabled:true,
   frequency:"monthly",behaviour:"fixed",priority:"essential",spendingRole:"committed"},
  {id:"food-needs",categoryId:"food",name:"Food",amountJod:1850,enabled:true,
   frequency:"monthly",behaviour:"variable",priority:"essential",spendingRole:"necessary"},
  {id:"family-outing",categoryId:"out",name:"Outing",amountJod:600,enabled:true,
   frequency:"monthly",behaviour:"variable",priority:"protected",spendingRole:"flexible"},
  {id:"fuel",categoryId:"car",name:"Fuel",amountJod:0,enabled:true,
   frequency:"monthly",behaviour:"variable",priority:"essential",spendingRole:"necessary"}
 ]
});
describe("Read-only family spending-mix summary",()=>{
 it("reconciles the sample 4905 monthly plan across three roles and category cushions",()=>{
  const source=example();
  const result=spendingMixSummary(source,month);
  expect(result.totalPlanned).toBe(4905);
  expect(result.classified).toBe(4700);
  expect(result.committed).toBe(2250);
  expect(result.necessary).toBe(1850);
  expect(result.flexible).toBe(600);
  expect(result.cushion).toBe(205);
  expect(result.unclassified).toBe(0);
  expect(result.adjustment).toBe(0);
  expect(result.positiveBase).toBe(4905);
  expect(result.segments.map(s=>s.amount)).toEqual([2250,1850,600,205,0]);
  expect(result.reconciles).toBe(true);
  expect(result.protectedCount).toBe(1);
  expect(source.categories).toHaveLength(4);
  expect(source.budgetItems).toHaveLength(4);
 });
 it("preserves an unclassified category separately from an already-itemized cushion",()=>{
  const source=example();
  source.categories.push({id:"misc",name:"Other",type:"variable",planned:100});
  const result=spendingMixSummary(source,month);
  expect(result.unclassified).toBe(100);
  expect(result.cushion).toBe(205);
  expect(result.positiveBase).toBe(5005);
  expect(result.totalPlanned).toBe(5005);
  expect(result.reconciles).toBe(true);
 });
 it("does not turn a negative monthly override into a negative-width spending segment",()=>{
  const source=example();
  source.categoryMonthlyPlans={"2026-10":{school:2150}};
  const result=spendingMixSummary(source,month);
  expect(result.totalPlanned).toBe(4805);
  expect(result.positiveBase).toBe(4905);
  expect(result.adjustment).toBe(-100);
  expect(result.segments.every(s=>s.amount>=0)).toBe(true);
  expect(result.reconciles).toBe(true);
 });
 it("keeps an empty budget honest, with no invented values or cash availability",()=>{
  const source=emptyRealMoney();
  const result=spendingMixSummary(source,month);
  expect(result.totalPlanned).toBe(0);
  expect(result.positiveBase).toBe(0);
  expect(result.segments.every(s=>s.amount===0)).toBe(true);
  expect(result.reconciles).toBe(true);
 });
 it("does not count bill dues as a new budget and does not treat a cushion as debt",()=>{
  const source=example();
  source.commitments=[{id:"tuition",name:"School fee due",categoryId:"school",budgetItemId:"school-fee",amount:2250,
   frequency:"once",dueDate:"2026-10-28"}];
  const result=spendingMixSummary(source,month);
  expect(result.totalPlanned).toBe(4905);
  expect(result.cushion).toBe(205);
  expect(result.due[0]).toMatchObject({billId:"tuition",remaining:2250});
  expect(result.reconciles).toBe(true);
 });
});
