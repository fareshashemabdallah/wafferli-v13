import {describe,it,expect} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {buildFamilyMoneyRhythm,annualPreparation,upsertSpendingPace,removeSpendingPace} from "./familyMoneyRhythm";
import type {MoneyState} from "./money";
const start="2026-10-20";
function money():MoneyState{
 return {...emptyRealMoney(),cashOnHand:520,cashReserve:140, cashUpdatedAt:start,
  incomeSources:[{id:"salary",name:"Salary",amount:2500,frequency:"monthly",nextDate:"2026-10-25",shared:false}],
  income:2500,incomeKnown:true,
  categories:[{id:"groc",name:"Groceries",type:"variable",planned:400,priority:"essential"},
   {id:"fuel",name:"Fuel",type:"variable",planned:180,priority:"essential"},
   {id:"housing",name:"Housing",type:"fixed",planned:800,priority:"essential"}],
  commitments:[{id:"rent",name:"Housing due",amount:800,frequency:"monthly",dueDate:"2026-11-01",categoryId:"housing"},
   {id:"insurance",name:"Car insurance",amount:600,frequency:"yearly",dueDate:"2026-11-15"}],
  expenses:[{id:"g1",date:"2026-10-18",categoryId:"groc",amount:145,status:"paid",shared:false}]
 };
}
describe("dated family money rhythm",()=>{
 it("uses existing actual cash, income dates and scheduled bills without moving any money",()=>{
  const s=money(),f=buildFamilyMoneyRhythm(s,[],start,30);
  expect(f.cashStart).toBe(520);
  expect(f.events.some(e=>e.kind==="income"&&e.date==="2026-10-25"&&e.amountJod===2500)).toBe(true);
  expect(f.events.some(e=>e.kind==="bill"&&e.date==="2026-11-01"&&e.amountJod===-800)).toBe(true);
  expect(f.events.some(e=>e.kind==="annual"&&e.date==="2026-11-15"&&e.amountJod===-600)).toBe(true);
  expect(f.cashEnd).toBeLessThan(1620);
  expect(f.events.some(e=>e.id.startsWith("envelope:groc:"))).toBe(true);
  expect(f.events.some(e=>e.id.startsWith("envelope:fuel:"))).toBe(true);
  expect(f.events.some(e=>e.id.startsWith("envelope:housing:"))).toBe(false);
  expect(s.expenses).toHaveLength(1);
  expect(s.cashOnHand).toBe(520);
 });
 it("removes expected salary from scenario without claiming receipt or changing saved income",()=>{
  const s=money();
  const withSalary=buildFamilyMoneyRhythm(s,[],start,30,true);
  const without=buildFamilyMoneyRhythm(s,[],start,30,false);
  expect(withSalary.cashEnd).not.toBeNull();
  expect(without.cashEnd).not.toBeNull();
  expect((withSalary.cashEnd??0)-(without.cashEnd??0)).toBe(2500);
  expect(without.firstReserveRiskDate).not.toBeNull();
  expect(s.incomeSources?.[0]?.receivedDates).toBeUndefined();
 });
 it("projects grocery cadence only when explicitly chosen, without adding a second expense or monthly plan",()=>{
  const s=money();
  const set=upsertSpendingPace(s,{categoryId:"groc",intervalDays:7,nextDate:"2026-10-22"})!;
  expect(set).not.toBe(s);
  expect(set.categories).toEqual(s.categories);
  expect(set.expenses).toEqual(s.expenses);
  expect(set.spendingPaces).toHaveLength(1);
  const outlook=buildFamilyMoneyRhythm(set,[],start,30);
  const paced=outlook.events.filter(e=>e.kind==="pace"&&e.categoryId==="groc");
  expect(outlook.events.filter(e=>e.id.startsWith("envelope:groc:"))).toHaveLength(0);
  expect(paced.length).toBeGreaterThan(0);
  expect(paced.every(e=>e.categoryId==="groc"&&e.amountJod<0)).toBe(true);
  // 145 JOD was already paid in October and is not a new forecast debit.
  const october=Number(paced.filter(e=>e.date.startsWith("2026-10")).reduce((a,e)=>a-e.amountJod,0).toFixed(2));
  expect(october).toBeLessThanOrEqual(255);
  expect(set.cashOnHand).toBe(520);
  expect(removeSpendingPace(set,"groc").spendingPaces).toEqual([]);
 });
 it("rejects a pace for a monthly category already represented by its own scheduled bill",()=>{
  const s=money();
  expect(upsertSpendingPace(s,{categoryId:"housing",intervalDays:7,nextDate:"2026-10-24"})).toBeNull();
  expect(upsertSpendingPace(s,{categoryId:"missing",intervalDays:7,nextDate:"2026-10-24"})).toBeNull();
  expect(upsertSpendingPace(s,{categoryId:"groc",intervalDays:7,nextDate:"2026-02-30"})).toBeNull();
  expect(upsertSpendingPace(s,{categoryId:"groc",intervalDays:9 as 7,nextDate:"2026-10-24"})).toBeNull();
  expect(s.spendingPaces).toBeUndefined();
 });
 it("does not treat sample financial figures or missing cash as a reliable cash projection",()=>{
  const s=money();
  expect(buildFamilyMoneyRhythm({...s,demo:true},[],start,30).cashStart).toBeNull();
  expect(buildFamilyMoneyRhythm({...s,cashOnHand:null},[],start,30).cashEnd).toBeNull();
  expect(buildFamilyMoneyRhythm({...s,incomeSources:[{...s.incomeSources![0]!,nextDate:""}]},[],start,30).missingDates).toBeGreaterThan(0);
 });
 it("annual preparation is divided by actual scheduled future paydays, not always 12 months",()=>{
  const s=money(),targets=annualPreparation(s,start);
  const insurance=targets.find(x=>x.id==="insurance")!;
  expect(insurance.amountJod).toBe(600);
  expect(insurance.paydays).toBe(1);
  expect(insurance.perPaydayJod).toBe(600);
  expect(s.commitments?.[1]?.paidDates).toBeUndefined();
  const noDates=annualPreparation({...s,incomeSources:[]},start);
  expect(noDates.find(x=>x.id==="insurance")?.perPaydayJod).toBeNull();
 });
 it("70/30/90-day horizons do not add duplicate annual dues in the same year",()=>{
  const s=money();
  const thirty=buildFamilyMoneyRhythm(s,[],start,30);
  const ninety=buildFamilyMoneyRhythm(s,[],start,90);
  expect(thirty.events.filter(x=>x.id==="bill:insurance:2026-11-15")).toHaveLength(1);
  expect(ninety.events.filter(x=>x.kind==="annual")).toHaveLength(1);
 });
 it("a recorded bill payment disappears from the forecast but remains in history once",()=>{
  const s=money();
  const paid={...s,commitments:s.commitments!.map(c=>c.id==="rent"?{...c,paidDates:["2026-11-01"]}:c),
   expenses:[...s.expenses,{id:"e1",date:"2026-11-01",categoryId:"housing",amount:800,billId:"rent",dueDate:"2026-11-01",status:"paid" as const,shared:false}]};
  const f=buildFamilyMoneyRhythm(paid,[],start,30);
  expect(f.events.some(e=>e.id==="bill:rent:2026-11-01")).toBe(false);
  expect(paid.expenses.filter(e=>e.billId==="rent")).toHaveLength(1);
 });
});
