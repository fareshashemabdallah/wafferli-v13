import {describe,expect,it} from "vitest";
import {recordConfirmedExpense} from "./confirmedExpense";
import {emptyRealMoney,getMoneyOverview} from "./moneyOverview";
import {recordBasketExpense} from "./basketRecording";
import {recordBillPayment} from "./billPayment";
import {recordFamilyCommitmentPayment,familyFinancialCommitments,familyFinancialSummary} from "./familyFinancialCommitments";
import {upsertOccasionFamilyPlan} from "./occasionPlanBridge";
import {memberBirthdayMoments,occurrencesForDate} from "./familyCalendar";
import type {Member,MoneyState} from "./money";
import type {FamilyPlan} from "./familyPlans";

const day=new Date(2026,9,20,12);
const state=():MoneyState=>({...emptyRealMoney(),income:1500,cashOnHand:500,cashReserve:100});
const gift=():FamilyPlan=>({id:"birthday-plan",kind:"occasion",title:"Sophia birthday",
 status:"planning",createdAt:day.toISOString(),updatedAt:day.toISOString(),
 date:"2026-11-12",sourceRef:"occasion:member-birthday:sophia@2026",
 occasionPreparation:{gift:{description:"Art kit",amountJod:45,dueDate:"2026-10-25",certainty:"firm"},
 celebration:{amountJod:0,dueDate:"2026-11-12"},extras:{amountJod:0,dueDate:"2026-11-12"}}});
describe("one confirmed expense ledger across family journeys",()=>{
 it("rejects unconfirmed, invalid, duplicate or unauthorised cash movement",()=>{
  const base=state();
  const input={id:"paid1",date:"2026-10-20",amount:25,sourcePlanId:"trip1"};
  expect(recordConfirmedExpense({...base,demo:true},input,"untracked").expenses).toHaveLength(0);
  expect(recordConfirmedExpense(base,{...input,date:"2026-02-30"},"untracked")).toBe(base);
  expect(recordConfirmedExpense(base,{...input,amount:25.001},"untracked")).toBe(base);
  expect(recordConfirmedExpense(base,{...input,categoryId:"fictional"},"untracked")).toBe(base);
  expect(recordConfirmedExpense(base,{...input,amount:999},"deduct")).toBe(base);
  const paid=recordConfirmedExpense(base,input,"deduct");
  expect(paid.cashOnHand).toBe(475);
  expect(paid.cashUpdatedAt).toBe("2026-10-20");
  expect(recordConfirmedExpense(paid,{...input,id:"paid2"},"untracked")).toBe(paid);
  expect(recordConfirmedExpense(paid,input,"deduct")).toBe(paid);
  const other=recordConfirmedExpense(paid,{id:"other1",date:"2026-10-20",amount:12,sourcePlanId:"trip2"},"untracked");
  expect(other.expenses).toHaveLength(2);
  expect(other.cashOnHand).toBe(475);
 });
 it("uses one standard ledger for bills, basket trips and ordinary expenses without a budget",()=>{
  const base={...state(),commitments:[{id:"school",name:"School",amount:100,
   dueDate:"2026-10-25",frequency:"once" as const}]};
  const bill=recordBillPayment(base,"school","2026-10-25","2026-10-20","bill-expense","already",100);
  expect(bill.expenses[0]?.categoryId).toBe("uncategorized");
  expect(bill.cashOnHand).toBe(500);
  const trip=recordBasketExpense(bill,[{id:"milk",name:"Milk",qty:2,price:3,done:true}],
   "0123456789abcdef01234567","uncategorized","2026-10-20");
  expect(trip.expenses).toHaveLength(2);
  expect(recordBasketExpense(trip,[{id:"milk",name:"Milk",qty:2,price:3,done:true}],
   "0123456789abcdef01234567","uncategorized","2026-10-20")).toBe(trip);
  expect(trip.categories).toEqual([]);
  expect(trip.financialInputsPartial).toBe(true);
  expect(trip.cashOnHand).toBe(500);
 });
 it("birthday profile to linked occasion plan to confirmed gift changes Money exactly once",()=>{
  const profile:Member={id:"sophia",name:"Sophia",role:"child",ageGroup:"",
   prefs:"",birthdayMonthDay:"11-12"};
  const event=occurrencesForDate(memberBirthdayMoments([profile]),"2026-11-12")[0]!;
  const first=upsertOccasionFamilyPlan([],event,{budgetJod:90},undefined,"birthday-plan",day);
  expect(first.created).toBe(true);
  expect(first.plans).toHaveLength(1);
  expect(upsertOccasionFamilyPlan(first.plans,event,{budgetJod:90},undefined,"another",day).created).toBe(false);
  const linked={...first.plans[0]!,occasionPreparation:gift().occasionPreparation!};
  const before=state();
  expect(familyFinancialSummary([linked],before,day).upcomingTotalJod).toBe(45);
  expect(getMoneyOverview(before,day,[linked]).month.spent).toBe(0);
  const giftEntry=familyFinancialCommitments([linked],before)[0]!;
  const paid=recordFamilyCommitmentPayment(before,giftEntry,42,"",day)!;
  expect(paid.expenses).toHaveLength(1);
  expect(paid.expenses[0]).toMatchObject({categoryId:"uncategorized",amount:42,
   sourcePlanId:"birthday-plan",sourceOccasionCost:"gift"});
  expect(recordFamilyCommitmentPayment(paid,giftEntry,42,"",day)).toBeNull();
  expect(familyFinancialSummary([linked],paid,day).upcomingTotalJod).toBe(0);
  expect(getMoneyOverview(paid,day,[linked]).month.spent).toBe(42);
  expect(before.expenses).toHaveLength(0);
  expect(paid.cashOnHand).toBe(500);
 });
});
