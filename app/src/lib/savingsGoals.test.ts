import {describe,expect,it} from "vitest";
import {createSavingsGoal,goalSummary,removeGoal,updateGoalSaved} from "./savingsGoals";
import {getFinancialReadiness} from "./financialReadiness";
import {emptyRealMoney,getMoneyOverview} from "./moneyOverview";
import {computeMoney,sampleMoney,type MoneyState} from "./money";
const now=new Date(2026,9,15,12);
const base=():MoneyState=>{
 const start=emptyRealMoney();delete start.incomeSources;
 return {...start,income:1800,savingsTargetAmount:300,categories:[
  {id:"housing",name:"Housing",type:"fixed",planned:750},
  {id:"food",name:"Food",type:"variable",planned:450}
 ],cashOnHand:900,cashReserve:150,cashUpdatedAt:"2026-10-14"};
};
describe("Named savings goals are not fake bank deposits",()=>{
 it("creates a goal and tracks reported savings without editing bank cash or expenses",()=>{
  const g=createSavingsGoal({id:"g1",name:"  School fees ",targetJod:1200,savedJod:200,monthlyJod:100},now)!;
  expect(g.name).toBe("School fees");
  const money:MoneyState={...base(),savingsGoals:[g]};
  const changed=updateGoalSaved(money,"g1",325,now);
  expect(changed.savingsGoals?.[0]?.savedJod).toBe(325);
  expect(changed.cashOnHand).toBe(900);
  expect(changed.expenses).toEqual([]);
  expect(computeMoney(changed,now).savingsTarget).toBe(300);
  expect(computeMoney(changed,now).planned).toBe(1200);
  expect(goalSummary(changed).plannedMonthly).toBe(100);
  expect(removeGoal(changed,"g1").savingsGoals).toEqual([]);
  expect(money.savingsGoals?.[0]?.savedJod).toBe(200);
 });
 it("rejects invalid goals and never mutates demo balances",()=>{
  expect(createSavingsGoal({id:"g",name:"",targetJod:100,savedJod:0,monthlyJod:10})).toBeNull();
  expect(createSavingsGoal({id:"g",name:"Holiday",targetJod:0,savedJod:0,monthlyJod:10})).toBeNull();
  expect(createSavingsGoal({id:"g",name:"Holiday",targetJod:100,savedJod:NaN,monthlyJod:10})).toBeNull();
  const sample=sampleMoney();
  expect(updateGoalSaved(sample,"g1",100)).toBe(sample);
  expect(removeGoal(sample,"g1")).toBe(sample);
 });
});
describe("Financial readiness safeguards",()=>{
 it("requires recorded budget, current cash and reviewed monthly bills",()=>{
  const state=base();const before=getFinancialReadiness(state,now);
  expect(before.level).toBe("details");
  expect(before.billsReviewed).toBe(false);
  expect(before.next).toBe("bills");
  const done={...state,noBillsConfirmedMonth:"2026-10"};
  expect(getMoneyOverview(done,now).hasBillSchedule).toBe(true);
  expect(getFinancialReadiness(done,now).level).toBe("ready");
  expect(getMoneyOverview(done,new Date(2026,10,2)).hasBillSchedule).toBe(false);
  expect(getFinancialReadiness(done,new Date(2026,10,2)).billsReviewed).toBe(false);
 });
 it("treats stale/unconfirmed cash as incomplete instead of ready",()=>{
  const s={...base(),noBillsConfirmedMonth:"2026-10",cashUpdatedAt:"2026-08-10"};
  expect(getFinancialReadiness(s,now).level).toBe("details");
  expect(getFinancialReadiness(s,now).next).toBe("cash-date");
  expect(getFinancialReadiness({...s,cashOnHand:null},now).next).toBe("cash");
  expect(getFinancialReadiness({...s,demo:true},now).level).toBe("sample");
 });
 it("flags an actual cash shortfall rather than declaring the data ready",()=>{
  const s={...base(),noBillsConfirmedMonth:"2026-10",cashOnHand:50,cashReserve:150};
  expect(getFinancialReadiness(s,now).level).toBe("caution");
  expect(getFinancialReadiness(s,now).next).toBe("risk");
 });
 it("does not need a fictitious scheduled bill to confirm none due",()=>{
  const s={...base(),noBillsConfirmedMonth:"2026-10"};
  expect(s.commitments).toEqual([]);
  expect(getMoneyOverview(s,now).cashAfterBills).toBe(750);
 });
});
