import {describe,expect,it} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {buildMonthlyMoneyReport} from "./monthlyMoneyReport";
import type {MoneyState} from "./money";
import type {FamilyPlan} from "./familyPlans";

const now=new Date(2026,9,25,12);
function base():MoneyState{
 const state=emptyRealMoney();
 delete state.incomeSources;
 return {...state,incomeKnown:true,income:1000,
  categories:[
   {id:"housing",name:"Home",type:"fixed",planned:150,priority:"essential"},
   {id:"play",name:"Family fun",type:"variable",planned:100,priority:"protected"}],
  budgetItems:[{id:"rent-part",categoryId:"housing",name:"Monthly utilities",enabled:true,
   amountJod:50,frequency:"monthly",behaviour:"fixed",priority:"essential",spendingRole:"committed"}],
  commitments:[{id:"electric",name:"Electricity",amount:50,frequency:"monthly",
   dueDate:"2026-10-12",categoryId:"housing",budgetItemId:"rent-part"}],
  expenses:[
   {id:"paid-electric",date:"2026-10-13",categoryId:"housing",amount:20,shared:false,
    status:"paid",billId:"electric",budgetItemId:"rent-part",dueDate:"2026-10-12"},
   {id:"spent-play",date:"2026-10-14",categoryId:"play",amount:5,shared:false,status:"paid"},
   {id:"planned-play",date:"2026-10-22",categoryId:"play",amount:80,shared:false,status:"planned"}],
  cashOnHand:250,cashUpdatedAt:"2026-10-25",cashReserve:35
 };
}
describe("Monthly Money report — read-only canonical projection",()=>{
 it("keeps budget envelopes and item rows separate from paid totals and due amounts",()=>{
  const state=base();
  const before=JSON.stringify(state);
  const r=buildMonthlyMoneyReport(state,"2026-10",now);
  expect(r.categoryPlanTotal).toBe(250);
  expect(r.actualPaidTotal).toBe(25);
  expect(r.variance).toBe(225);
  expect(r.categoryRows.find(x=>x.id==="housing")?.planned).toBe(150);
  expect(r.categoryRows.find(x=>x.id==="housing")?.lines[0]?.planned).toBe(50);
  expect(r.categoryRows.find(x=>x.id==="housing")?.unitemized[0]?.planned).toBe(100);
  expect(r.paidExpenses).toHaveLength(2);
  expect(r.plannedExpenses).toHaveLength(1);
  expect(r.dues).toHaveLength(1);
  expect(r.dues[0]).toMatchObject({scheduled:50,recordedPaid:20,remaining:30,state:"partly paid"});
  expect(r.totalDue).toBe(50);
  expect(r.outstandingDue).toBe(30);
  expect(JSON.stringify(state)).toBe(before);
 });
 it("uses only the requested month for transaction totals and month-specific budgets",()=>{
  const state=base();
  state.categoryMonthlyPlans={"2026-09":{play:70}};
  state.expenses.push({id:"older",date:"2026-09-05",categoryId:"play",amount:12,shared:false});
  const r=buildMonthlyMoneyReport(state,"2026-09",now);
  expect(r.categoryPlanTotal).toBe(220);
  expect(r.actualPaidTotal).toBe(12);
  expect(r.cash.forecast).toBeNull();
  expect(r.cash.balance).toBe(250); // explicitly today's cash, not reconstructed historical cash
 });
 it("labels manually marked paid bills without inventing a recorded payment",()=>{
  const state=base();
  state.expenses=[];
  state.commitments![0]!.paidDates=["2026-10-12"];
  const r=buildMonthlyMoneyReport(state,"2026-10",now);
  expect(r.actualPaidTotal).toBe(0);
  expect(r.totalRecordedDuePayments).toBe(0);
  expect(r.outstandingDue).toBe(0);
  expect(r.dues[0]!.state).toMatch(/marked paid/);
  expect(r.warnings.some(w=>w.includes("marked paid"))).toBe(true);
 });
 it("retains uncategorized and deleted-category payment history",()=>{
  const state=base();
  state.retiredCategoryNames={old:"Former class"};
  state.expenses.push({id:"old-expense",date:"2026-10-15",categoryId:"old",amount:10,shared:false});
  const r=buildMonthlyMoneyReport(state,"2026-10",now);
  expect(r.actualPaidTotal).toBe(35);
  expect(r.categoryRows.find(c=>c.id==="unclassified-report-only")?.paid).toBe(10);
  expect(r.paidExpenses.find(e=>e.id==="old-expense")?.category).toBe("Former class");
 });
 it("shows income receipts only when confirmed, not when scheduled",()=>{
  const state=base();
  state.incomeSources=[{id:"salary",name:"Salary",amount:1000,frequency:"monthly",nextDate:"2026-10-05",
   shared:false,receivedDates:["2026-10-05"],receivedAmounts:{"2026-10-05":950}}];
  const r=buildMonthlyMoneyReport(state,"2026-10",now);
  expect(r.plannedIncome).toBe(1000);
  expect(r.confirmedIncome).toBe(950);
  expect(r.incomeRows[0]!.confirmedReceipts[0]!.estimated).toBe(false);
 });
 it("derives occasion commitments without duplicating paid family plan expenses",()=>{
  const state=base();
  const plan:FamilyPlan={id:"birthday-1",kind:"occasion",status:"decided",title:"Birthday",
   createdAt:"2026-10-01T12:00:00Z",updatedAt:"2026-10-01T12:00:00Z",
   occasionPreparation:{
    gift:{description:"Storybooks",amountJod:35,dueDate:"2026-10-30",certainty:"firm"},
    celebration:{amountJod:0,dueDate:"2026-10-30"},
    extras:{amountJod:0,dueDate:"2026-10-30"}
   }};
  const first=buildMonthlyMoneyReport(state,"2026-10",now,[plan]);
  expect(first.dues.find(d=>d.source==="occasion")?.remaining).toBe(35);
  expect(first.actualPaidTotal).toBe(25);
  state.expenses.push({id:"gift-paid",date:"2026-10-20",categoryId:"play",
   amount:32,shared:false,status:"paid",sourcePlanId:"birthday-1",sourceOccasionCost:"gift"});
  const second=buildMonthlyMoneyReport(state,"2026-10",now,[plan]);
  expect(second.dues.find(d=>d.source==="occasion")?.remaining).toBe(0);
  expect(second.dues.find(d=>d.source==="occasion")?.recordedPaid).toBe(32);
  expect(second.actualPaidTotal).toBe(57);
 });
 it("does not mistake unknown income or empty months for confirmed zero",()=>{
  const state=emptyRealMoney();
  const r=buildMonthlyMoneyReport(state,"2026-10",now);
  expect(r.plannedIncome).toBeNull();
  expect(r.confirmedIncome).toBeNull();
  expect(r.actualPaidTotal).toBe(0);
  expect(r.partial).toBe(true);
  expect(r.warnings.some(w=>w.includes("missing entries"))).toBe(true);
 });
 it("rejects malformed month values",()=>{
  expect(()=>buildMonthlyMoneyReport(base(),"2026-13",now)).toThrow("Invalid reporting month");
 });
});
