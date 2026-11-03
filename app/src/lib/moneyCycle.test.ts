import {describe,expect,it} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {moneyCycleFor,moneyCycleForMonth,inMoneyCycle,cyclePaidTotal,moneyCycleBasis} from "./moneyCycle";
import {buildFamilyMoneyRhythm} from "./familyMoneyRhythm";
import {oneMoneyDashboard} from "./oneMoneyDashboard";
import {spendingMixSummary} from "./spendingMixSummary";
import {buildMonthlyMoneyReport} from "./monthlyMoneyReport";
import {computeMoney,type MoneyState} from "./money";

function family():MoneyState {
 return {...emptyRealMoney(),incomeKnown:true,
  incomeSources:[{id:"salary",name:"Monthly salary",amount:2500,frequency:"monthly",
    nextDate:"2026-10-25",shared:false,receivedDates:["2026-10-25"]}],
  categories:[{id:"living",name:"Living expenses",type:"variable",planned:800,remainderRole:"necessary"}],
  expenses:[
   {id:"before",date:"2026-10-24",amount:90,categoryId:"living",status:"paid",shared:false},
   {id:"oct",date:"2026-10-26",amount:110,categoryId:"living",status:"paid",shared:false},
   {id:"nov",date:"2026-11-01",amount:70,categoryId:"living",status:"paid",shared:false},
   {id:"last",date:"2026-11-24",amount:20,categoryId:"living",status:"paid",shared:false},
   {id:"next",date:"2026-11-25",amount:45,categoryId:"living",status:"paid",shared:false},
   {id:"future",date:"2026-11-02",amount:500,categoryId:"living",status:"planned",shared:false}
  ]};
}
describe("Money cycles anchored to salary payday",()=>{
 it("groups October 25 through November 24, rolling over on November 25",()=>{
  const state=family();
  expect(moneyCycleBasis(state)).toEqual({day:25,source:"income-payday"});
  expect(moneyCycleFor(state,"2026-11-01")).toMatchObject({
   start:"2026-10-25",end:"2026-11-24",endExclusive:"2026-11-25",key:"2026-10",day:25
  });
  expect(moneyCycleFor(state,"2026-11-24").key).toBe("2026-10");
  expect(moneyCycleFor(state,"2026-11-25").key).toBe("2026-11");
  expect(moneyCycleFor(state,"2026-10-24").key).toBe("2026-09");
  expect(moneyCycleForMonth(state,"2026-10").end).toBe("2026-11-24");
 });
 it("counts paid only, across calendar month boundaries, without duplicating or mutating entries",()=>{
  const state=family(),before=JSON.stringify(state),cycle=moneyCycleFor(state,"2026-11-01");
  expect(cyclePaidTotal(state,cycle)).toBe(200);
  expect(cyclePaidTotal(state,cycle,"living")).toBe(200);
  expect(inMoneyCycle("2026-10-24",cycle)).toBe(false);
  expect(inMoneyCycle("2026-10-25",cycle)).toBe(true);
  expect(inMoneyCycle("2026-11-24",cycle)).toBe(true);
  expect(inMoneyCycle("2026-11-25",cycle)).toBe(false);
  const summary=oneMoneyDashboard(state,buildFamilyMoneyRhythm(state,[],"2026-11-01"),"2026-11-01");
  expect(summary.paid).toBe(200);
  expect(summary.numberPaid).toBe(3);
  expect(summary.monthKey).toBe("2026-10");
  expect(summary.receivedIncome).toBe(2500);
  expect(summary.unpaidPlannedRecords).toBe(1);
  expect(spendingMixSummary(state,cycle.key,cycle).totalPaid).toBe(200);
  const report=buildMonthlyMoneyReport(state,"2026-10",new Date(2026,10,1,12));
  expect(report.periodStart).toBe("2026-10-25");
  expect(report.periodEnd).toBe("2026-11-24");
  expect(report.actualPaidTotal).toBe(200);
  expect(report.paidExpenses.map(e=>e.id)).toEqual(["oct","nov","last"]);
  expect(report.categoryRows.find(c=>c.id==="living")?.paid).toBe(200);
  expect(JSON.stringify(state)).toBe(before);
 });
 it("uses the same salary period for legacy spend totals, category breakdowns and projected days",()=>{
  const s=family();
  const before=JSON.stringify(s);
  const current=computeMoney(s,new Date(2026,10,1,12));
  expect(current.spent).toBe(200);
  expect(current.spentBy("living")).toBe(200);
  expect(current.daysLeft).toBe(23);
  expect(computeMoney(s,new Date(2026,9,24,12)).spent).toBe(90);
  expect(computeMoney(s,new Date(2026,10,25,12)).spent).toBe(45);
  expect(JSON.stringify(s)).toBe(before);
 });
 it("uses an explicitly chosen day instead of guessing when household wants one",()=>{
  const state={...family(),cycleStartDay:20};
  expect(moneyCycleFor(state,"2026-11-01")).toMatchObject({
   day:20,source:"explicit",start:"2026-10-20",end:"2026-11-19"
  });
 });
 it("keeps calendar months when no payday is known",()=>{
  const state=emptyRealMoney();
  expect(moneyCycleFor(state,"2026-11-01")).toMatchObject({
   day:1,source:"calendar",start:"2026-11-01",end:"2026-11-30"
  });
 });
});
