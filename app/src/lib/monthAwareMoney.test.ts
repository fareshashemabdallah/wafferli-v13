import {describe,expect,it} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {computeMoney,type MoneyState} from "./money";
import {buildFamilyMoneyRhythm} from "./familyMoneyRhythm";
import {confirmedMonthPlan,confirmedAdjustmentsInWindow,effectiveCategoryAllowance,
 withConfirmedMonthPlan,withoutConfirmedMonthPlan} from "./monthAwareMoney";
import {buildTodayActionPolicy} from "./todayActionPolicy";
import {defaultFamilyPreferences} from "./familyPreferences";

function household():MoneyState{
 return {...emptyRealMoney(),cashOnHand:180,cashReserve:140,cashUpdatedAt:"2026-10-20",
  incomeKnown:true,income:1000,
  incomeSources:[{id:"salary",name:"Salary",amount:1000,frequency:"monthly",nextDate:"2026-10-25",shared:false}],
  categories:[{id:"food",name:"Groceries",type:"variable",planned:200,priority:"essential"},
   {id:"utilities",name:"Electricity",type:"fixed",planned:80,priority:"essential"}],
  commitments:[{id:"bill1",name:"School",amount:20,frequency:"once",dueDate:"2026-10-26"}],
  spendingPaces:[{categoryId:"food",intervalDays:7,nextDate:"2026-10-22"}],
  expenses:[{id:"past1",date:"2026-10-18",categoryId:"food",amount:40,status:"paid",shared:false}]
 };
}
describe("one family Money system with month-aware allowances",()=>{
 it("defaults to original category budget until a parent explicitly approves a specific calendar month",()=>{
  const original=household();
  expect(effectiveCategoryAllowance(original,"food","2026-10")).toBe(200);
  expect(confirmedMonthPlan(original,"food","2026-10")).toBeNull();
  const approved=withConfirmedMonthPlan(original,"food","2026-11",360)!;
  expect(confirmedMonthPlan(approved,"food","2026-11")).toBe(360);
  expect(effectiveCategoryAllowance(approved,"food","2026-11")).toBe(360);
  expect(effectiveCategoryAllowance(approved,"food","2026-10")).toBe(200);
  expect(effectiveCategoryAllowance(approved,"food","2026-12")).toBe(200);
  expect(approved.categories).toEqual(original.categories);
  expect(approved.commitments).toEqual(original.commitments);
  expect(approved.expenses).toEqual(original.expenses);
  expect(approved.cashOnHand).toBe(180);
  expect(withoutConfirmedMonthPlan(approved,"food","2026-11")).toEqual(original);
 });
 it("rejects invented demo changes, unknown categories, impossible months and imprecise money",()=>{
  const base=household();
  expect(withConfirmedMonthPlan({...base,demo:true},"food","2026-11",360)).toBeNull();
  expect(withConfirmedMonthPlan(base,"absent","2026-11",360)).toBeNull();
  expect(withConfirmedMonthPlan(base,"food","2026-13",360)).toBeNull();
  expect(withConfirmedMonthPlan(base,"food","2026-02",360.123)).toBeNull();
  expect(withConfirmedMonthPlan(base,"food","2026-11",-1)).toBeNull();
  expect(confirmedAdjustmentsInWindow(base,"2026-10-20","2026-12-20")).toEqual([]);
 });
 it("changes the correct Money month, preserving a separate one-time reallocation",()=>{
  const initial=household();
  const edited=withConfirmedMonthPlan(initial,"food","2026-11",360)!;
  const withDelta={...edited,monthlyAdjustments:{"2026-11":{savingsDelta:0,categoryDeltas:{food:20}}}};
  expect(computeMoney(withDelta,new Date(2026,10,15)).plannedBy("food")).toBe(380);
  expect(computeMoney(withDelta,new Date(2026,9,15)).plannedBy("food")).toBe(200);
  expect(computeMoney(withDelta,new Date(2026,10,15)).spent).toBe(0);
 });
 it("forecasts paced categories with the relevant month's parent-confirmed allowance, without any extra bill",()=>{
  const base=household();
  const adjusted=withConfirmedMonthPlan(base,"food","2026-11",500)!;
  const old=buildFamilyMoneyRhythm(base,[],"2026-10-20",90);
  const changed=buildFamilyMoneyRhythm(adjusted,[],"2026-10-20",90);
  const sum=(events:typeof old.events,month:string)=>Number(events.filter(e=>e.kind==="pace"&&e.date.startsWith(month))
   .reduce((a,e)=>a-e.amountJod,0).toFixed(2));
  expect(sum(changed.events,"2026-10")).toBe(sum(old.events,"2026-10"));
  expect(sum(changed.events,"2026-11")).toBeGreaterThan(sum(old.events,"2026-11"));
  expect(sum(changed.events,"2026-12")).toBe(sum(old.events,"2026-12"));
  expect(changed.futureBillsJod).toBe(old.futureBillsJod);
  expect(adjusted.expenses).toHaveLength(1);
  expect(adjusted.commitments).toHaveLength(1);
  expect(adjusted.cashOnHand).toBe(180);
 });
 it("keeps the same per-interval projected cost across 7, 30 and 90-day horizons",()=>{
  const state=withConfirmedMonthPlan(household(),"food","2026-10",650)!;
  const a=buildFamilyMoneyRhythm(state,[],"2026-10-20",7);
  const b=buildFamilyMoneyRhythm(state,[],"2026-10-20",30);
  const c=buildFamilyMoneyRhythm(state,[],"2026-10-20",90);
  const amount=(v:typeof a)=>v.events.find(x=>x.id==="pace:food:2026-10-22")?.amountJod;
  expect(amount(a)).toBeDefined();
  expect(amount(a)).toBe(amount(b));
  expect(amount(b)).toBe(amount(c));
  expect(a.events.filter(x=>x.kind==="pace").length).toBeLessThan(b.events.filter(x=>x.kind==="pace").length);
 });
 it("does not double count a scheduled utilities bill when month-adjusted",()=>{
  const base=household();
  const state={...withConfirmedMonthPlan(base,"utilities","2026-11",160)!,
   commitments:[...base.commitments!,{id:"electricity",name:"Electricity",amount:160,
     frequency:"monthly" as const,dueDate:"2026-11-05",categoryId:"utilities"}],
   spendingPaces:[...base.spendingPaces!,{categoryId:"utilities",intervalDays:7 as const,nextDate:"2026-11-05"}]};
  const forecast=buildFamilyMoneyRhythm(state,[],"2026-10-20",90);
  expect(forecast.events.filter(e=>e.kind==="pace"&&e.categoryId==="utilities")).toHaveLength(0);
  expect(forecast.events.filter(e=>e.kind==="bill"&&e.label==="Electricity").length).toBeGreaterThan(0);
 });
 it("Today surfaces one review only for near, recorded cash pressure plus parent-confirmed paced month",()=>{
  const money=withConfirmedMonthPlan(household(),"food","2026-10",650)!;
  const now=new Date(2026,9,20,12);
  const input={money,plans:[],members:[],moments:[],preferences:{...defaultFamilyPreferences},now};
  const brief=buildTodayActionPolicy(input);
  expect(brief.action?.route).toBe("/money");
  expect(brief.action?.kind).toBe("financial");
  expect(brief.action?.id).toBe("timing:2026-10-22");
  expect(brief.cashVerified).toBe(false);
  expect(buildTodayActionPolicy({...input,money:withoutConfirmedMonthPlan(money,"food","2026-10")}).action?.id)
   .not.toBe("timing:2026-10-22");
  expect(buildTodayActionPolicy({...input,money:{...money,cashOnHand:null}}).action?.id)
   .not.toBe("timing:2026-10-22");
  expect(buildTodayActionPolicy({...input,preferences:{...defaultFamilyPreferences,financeTips:false}}).action?.id)
   .not.toBe("timing:2026-10-22");
 });
});
