import {describe,expect,it} from "vitest";
import type {MoneyState} from "./money";
import {computeMoney} from "./money";
import {budgetAlignment,applyVarianceAllocation,applyAlignmentSuggestion} from "./financeAlignment";
import {monthCarryover,previousMonthKey,nextMonthKey} from "./monthlyCarryover";
import {smartVarianceGuidance} from "./smartBudgetGuidance";

const make=():MoneyState=>({
 demo:false,income:1000,savingsPct:10,savingsTargetAmount:100,
 categories:[
 {id:"housing",name:"Housing",type:"fixed",planned:400},
 {id:"food",name:"Food",type:"variable",planned:300},
 {id:"leisure",name:"Leisure",type:"variable",planned:200}
 ],expenses:[],cashOnHand:1000,cashReserve:100,commitments:[
 {id:"bill",name:"Electricity",amount:400,frequency:"monthly",dueDate:"2026-09-20",categoryId:"housing"}]
});
describe("Next-month carryover from confirmed payments",()=>{
 it("computes a credit for underspending and a debit for overpayments in exactly the following month",()=>{
  const s=make();s.expenses=[
    {id:"over",date:"2026-09-21",categoryId:"housing",amount:425,plannedAmount:400,status:"paid",billId:"bill",dueDate:"2026-09-20",shared:true},
    {id:"under",date:"2026-09-22",categoryId:"food",amount:60,plannedAmount:100,status:"paid",shared:true},
  ];
  const october=monthCarryover(s,"2026-10");
  expect(october).toMatchObject({credit:40,debit:25,net:15,from:"2026-09"});
  expect(computeMoney(s,new Date(2026,9,15)).carryover.net).toBe(15);
  expect(computeMoney(s,new Date(2026,9,15)).spendable).toBe(915);
  expect(computeMoney(s,new Date(2026,10,15)).carryover.net).toBe(0);
  expect(s.cashOnHand).toBe(1000);
 });
 it("does not include planned but unpaid items, unmatched historic receipts, or approved differences",()=>{
  const s=make();s.expenses=[
    {id:"unpaid",date:"2026-09-22",categoryId:"food",amount:100,plannedAmount:50,status:"planned",shared:true},
    {id:"no-base",date:"2026-09-20",categoryId:"food",amount:66,shared:true},
    {id:"covered",date:"2026-09-18",categoryId:"housing",amount:430,plannedAmount:400,status:"paid",shared:true,
     allocation:{kind:"variable",categoryId:"leisure",delta:30,approvedAt:"2026-09-18T12:00:00Z"}},
  ];
  expect(monthCarryover(s,"2026-10").net).toBe(0);
 });
 it("works across December to January and January to December",()=>{
  const s=make();s.expenses=[{id:"dec",date:"2026-12-30",categoryId:"housing",amount:470,plannedAmount:400,status:"paid",shared:true}];
  expect(previousMonthKey("2027-01")).toBe("2026-12");
  expect(nextMonthKey("2026-12")).toBe("2027-01");
  expect(monthCarryover(s,"2027-01").net).toBe(-70);
  expect(monthCarryover(s,"2027-02").net).toBe(0);
 });
 it("removes next-month carryover when a user approves a same-month reallocation",()=>{
  const s=make();s.expenses=[{id:"over",date:"2026-09-21",categoryId:"housing",amount:430,plannedAmount:400,status:"paid",shared:true}];
  expect(monthCarryover(s,"2026-10").net).toBe(-30);
  const balanced=applyVarianceAllocation(s,"over",{kind:"variable",categoryId:"leisure"},"2026-09-23T09:00:00Z");
  expect(balanced).not.toBe(s);
  expect(monthCarryover(balanced,"2026-10").net).toBe(0);
  expect(computeMoney(balanced,new Date(2026,9,15)).plannedBy("leisure")).toBe(200);
 });
 it("counts carryover in the next month's budget alignment gap, not in bank cash",()=>{
  const s=make();s.expenses=[{id:"over",date:"2026-09-20",categoryId:"housing",amount:430,plannedAmount:400,status:"paid",shared:true}];
  const result=budgetAlignment(s,new Date(2026,9,15));
  expect(result.carryover).toBe(-30);
  expect(result.gap).toBe(-30);
  expect(s.cashOnHand).toBe(1000);
  const approved=applyAlignmentSuggestion(s,{kind:"variable",categoryId:"leisure"},new Date(2026,9,15));
  expect(approved.categories.find(c=>c.id==="leisure")?.planned).toBe(200);
  expect(computeMoney(approved,new Date(2026,9,15)).plannedBy("leisure")).toBe(170);
  expect(computeMoney(approved,new Date(2026,10,15)).plannedBy("leisure")).toBe(200);
  expect(budgetAlignment(approved,new Date(2026,9,15)).gap).toBe(0);
 });
 it("ranks parent-declared flexible spending ahead of savings when a confirmed bill is overpaid",()=>{
  const s=make();
  s.categories=s.categories.map(c=>c.id==="leisure"?{...c,priority:"flexible" as const}:c);
  const bill={id:"e",date:"2026-10-15",categoryId:"housing",billId:"bill",plannedAmount:400,amount:435,status:"paid" as const,shared:true};
  s.expenses=[bill];
  const rec=smartVarianceGuidance(s,bill,new Date(2026,9,15));
  expect(rec.ranked[0]).toMatchObject({kind:"variable"});
  expect(rec.detailsEn).toContain("35.00");
 });
});
