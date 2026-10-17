import {describe,expect,it} from "vitest";
import type {FamilyPlan} from "./familyPlans";
import {emptyRealMoney,getMoneyOverview} from "./moneyOverview";
import type {MoneyState} from "./money";
import {familyFinancialCommitments,familyFinancialSummary,familyForecastCommitments,recordFamilyCommitmentPayment} from "./familyFinancialCommitments";
const now=new Date(2026,9,17,12);
const mk=(gift=120,celebration=200):FamilyPlan=>({
 id:"occasion123",title:"Sophia's birthday",kind:"occasion",status:"planning",
 sourceRef:"occasion:member-birthday:sophia@2027",date:"2027-02-17",
 createdAt:now.toISOString(),updatedAt:now.toISOString(),occasionPreparation:{
  gift:{description:"Science kit",amountJod:gift,dueDate:"2026-11-20"},
  celebration:{amountJod:celebration,dueDate:"2027-02-03"},
  extras:{amountJod:30,dueDate:"2027-01-15"}
 }
});
const money=():MoneyState=>({
 ...emptyRealMoney(),income:1200,cashOnHand:900,cashReserve:100,
 categories:[{id:"leisure",name:"Celebrations",planned:200,type:"variable"}],
 commitments:[{id:"rent",name:"Rent",amount:300,dueDate:"2026-10-25",frequency:"once"}]
});
describe("calendar-derived family financial commitments in Our Money",()=>{
 it("reads one original occasion plan, displaying each estimated payment date exactly once",()=>{
  const rows=familyFinancialCommitments([mk()],money());
  expect(rows).toHaveLength(3);
  expect(rows.map(x=>[x.kind,x.amountJod,x.dueDate])).toEqual([
   ["gift",120,"2026-11-20"],["extras",30,"2027-01-15"],["celebration",200,"2027-02-03"]
  ]);
  expect(familyFinancialSummary([mk()],money(),now)).toMatchObject({
   plannedTotalJod:350,upcomingTotalJod:350,paidTotalJod:0,monthlyPreparationJod:107.5,
   nextDeadline:"2026-11-20"
  });
  expect(familyForecastCommitments([mk()],money())).toHaveLength(3);
 });
 it("automatically reflects edits, component removal and cancellation without mutating Money",()=>{
  const state=money();
  const before=JSON.stringify(state);
  expect(familyFinancialSummary([mk()],state,now).upcomingTotalJod).toBe(350);
  expect(familyFinancialSummary([mk(150,200)],state,now).upcomingTotalJod).toBe(380);
  expect(familyFinancialSummary([mk(0,200)],state,now).upcomingTotalJod).toBe(230);
  expect(familyFinancialSummary([],state,now).upcomingTotalJod).toBe(0);
  expect(JSON.stringify(state)).toBe(before);
  expect(state.savingsGoals).toBeUndefined();
 });
 it("considers future family cost as a dated commitment in the 90-day cash forecast, not actual expenditure",()=>{
  const state=money(),plan=mk();
  const shortPlan:FamilyPlan={...plan,occasionPreparation:{...plan.occasionPreparation!,
   gift:{description:"Science kit",amountJod:120,dueDate:"2026-10-28"}}};
  const baseline=getMoneyOverview(state,now);
  const withFamily=getMoneyOverview(state,now,[shortPlan]);
  expect(withFamily.forecast.upcomingBills).toBe(baseline.forecast.upcomingBills+120+30);
  expect(withFamily.forecast.events.filter(e=>e.kind==="bill"&&e.sourceId.startsWith("family-occasion:"))).toHaveLength(2);
  expect(withFamily.cashAfterBills).toBe(baseline.cashAfterBills!-150);
  expect(withFamily.month.spent).toBe(0);
  expect(state.expenses).toHaveLength(0);
 });
 it("paid confirmation is explicit, leaves savings and cash unchanged, and suppresses the single planned commitment",()=>{
  const state=money();
  const plan=mk();
  const gift=familyFinancialCommitments([plan],state).find(x=>x.kind==="gift")!;
  const paid=recordFamilyCommitmentPayment(state,gift,125,"leisure",now)!;
  expect(paid.expenses).toHaveLength(1);
  expect(paid.expenses[0]).toMatchObject({status:"paid",amount:125,plannedAmount:120,
   sourcePlanId:plan.id,sourceOccasionCost:"gift",categoryId:"leisure"});
  expect(paid.cashOnHand).toBe(900);
  expect(paid.savingsGoals).toBeUndefined();
  expect(familyFinancialSummary([plan],paid,now)).toMatchObject({
   upcomingTotalJod:230,paidTotalJod:125,monthlyPreparationJod:47.5
  });
  expect(familyForecastCommitments([plan],paid).map(x=>x.id)).not.toContain(gift.id);
  expect(recordFamilyCommitmentPayment(paid,gift,125,"leisure",now)).toBeNull();
  expect(getMoneyOverview(paid,now,[plan]).month.spent).toBe(125);
  const reversed={...paid,expenses:[]};
  expect(familyFinancialSummary([plan],reversed,now).upcomingTotalJod).toBe(350);
 });
 it("requires actual finances, a valid expense category and positive actual amount before payment",()=>{
  const state=money(),entry=familyFinancialCommitments([mk()],state)[0]!;
  expect(recordFamilyCommitmentPayment({...state,demo:true},entry,100,"leisure",now)).toBeNull();
  expect(recordFamilyCommitmentPayment(state,entry,0,"leisure",now)).toBeNull();
  expect(recordFamilyCommitmentPayment(state,entry,100,"rent",now)).toBeNull();
  expect(recordFamilyCommitmentPayment(state,entry,100.001,"leisure",now)).toBeNull();
  expect(state.expenses).toHaveLength(0);
 });
 it("does not produce fake scheduled commitments against sample income and cash balances",()=>{
  const state={...money(),demo:true};
  expect(familyFinancialCommitments([mk()],state)).toHaveLength(3);
  expect(familyForecastCommitments([mk()],state)).toHaveLength(0);
 });
});
