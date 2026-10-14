import {describe,expect,it} from "vitest";
import {buildForecast,type Commitment,type IncomeSource} from "./cashflow";
import {computeMoney,type MoneyState} from "./money";
import {emptyRealMoney,getMoneyOverview} from "./moneyOverview";
const date=new Date(2026,9,14,12);
const plain=():MoneyState=>({
 demo:false,income:0,savingsPct:10,categories:[
  {id:"rent",name:"Rent",type:"fixed",planned:400},
  {id:"food",name:"Food",type:"variable",planned:200}
 ],expenses:[],incomeSources:[],commitments:[],cashOnHand:null,cashReserve:0
});
describe("aligned Money overview",()=>{
 it("keeps monthly plans and dated unpaid bills as different measures",()=>{
  const s=plain();
  s.incomeSources=[{id:"pay",name:"Salary",amount:1200,frequency:"monthly",nextDate:"2026-10-25",shared:true}];
  s.commitments=[{id:"rentbill",name:"Rent",amount:400,frequency:"once",dueDate:"2026-10-20",categoryId:"rent"}];
  s.cashOnHand=600;s.cashReserve=100;
  const result=getMoneyOverview(s,date);
  expect(result.month.monthlyIncome).toBe(1200);
  expect(result.month.planned).toBe(600);
  expect(result.forecast.expectedIncome).toBe(1200);
  expect(result.forecast.upcomingBills).toBe(400);
  expect(result.billOnlyRemainder).toBe(100);
  expect(result.uncategorizedBills).toBe(0);
  expect(result.month.remaining).toBe(1080);
  expect(result.billOnlyRemainder).not.toBe(result.month.remaining);
 });
 it("recalculates after a bill is recorded paid and expense logged, without automatically inferring bank cash",()=>{
  const s=plain();
  const bill:Commitment={id:"rentbill",name:"Rent",amount:400,frequency:"once",dueDate:"2026-10-13",categoryId:"rent"};
  s.commitments=[bill];s.cashOnHand=600;s.cashReserve=100;
  const before=getMoneyOverview(s,date);
  expect(before.forecast.overdueCount).toBe(1);
  s.commitments=[{...bill,paidDates:["2026-10-13"]}];
  s.expenses=[{id:"e1",categoryId:"rent",date:"2026-10-14",amount:400,shared:true,billId:bill.id,dueDate:"2026-10-13"}];
  const after=getMoneyOverview(s,date);
  expect(after.forecast.upcomingBills).toBe(0);
  expect(after.forecast.overdueCount).toBe(0);
  expect(after.month.spent).toBe(400);
  expect(after.billExpensesThisMonth).toBe(400);
  expect(after.paidBillsThisMonth).toBe(1);
  expect(after.billOnlyRemainder).toBe(500);
  // User must either deduct the payment from their entered cash or state it's already reflected.
  s.cashOnHand=200;
  expect(getMoneyOverview(s,date).billOnlyRemainder).toBe(100);
 });
 it("exposes a negative cash shortfall instead of presenting it as zero available cash",()=>{
  const s=plain();s.cashOnHand=100;s.cashReserve=50;
  s.commitments=[{id:"rent",name:"Rent",amount:400,frequency:"once",dueDate:"2026-10-20"}];
  const result=getMoneyOverview(s,date);
  expect(result.billOnlyRemainder).toBe(0);
  expect(result.cashAfterBills).toBe(-350);
  expect(result.forecast.minimumBalance).toBe(-300);
 });
 it("does not call absent scheduled bills zero commitments",()=>{
  const s=plain();s.cashOnHand=500;
  const r=getMoneyOverview(s,date);
  expect(r.hasBillSchedule).toBe(false);
  expect(r.billOnlyRemainder).toBe(500);
 });
 it("honors the local month and counts uncategorized bill-linked spending",()=>{
  const s=plain();s.cashOnHand=300;
  s.expenses=[{id:"x",categoryId:"uncategorized",amount:44,shared:true,date:"2026-10-14",billId:"a",dueDate:"2026-10-10"}];
  expect(getMoneyOverview(s,date).month.spent).toBe(44);
  expect(getMoneyOverview(s,date).billExpensesThisMonth).toBe(44);
  expect(computeMoney(s,new Date(2026,10,1,12)).spent).toBe(0);
 });
 it("starts a genuinely blank real plan without mutating anyone's original data",()=>{
  const original=plain();
  const fresh=emptyRealMoney();
  expect(fresh.demo).toBe(false);
  expect(fresh.cashOnHand).toBeNull();
  expect(fresh.categories).toEqual([]);
  expect(fresh.commitments).toEqual([]);
  expect(original.categories.length).toBe(2);
 });
 it("keeps expected salary separate from entered cash",()=>{
  const salary:IncomeSource={id:"salary",name:"Pay",amount:1200,frequency:"monthly",nextDate:"2026-10-25",shared:true};
  const forecast=buildForecast({incomes:[salary],commitments:[],openingBalance:300,reserve:100,today:"2026-10-14",days:30});
  expect(forecast.expectedIncome).toBe(1200);
  expect(forecast.safeToSpend).toBe(200);
 });
});
