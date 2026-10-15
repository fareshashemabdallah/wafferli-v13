import {describe,expect,it} from "vitest";
import {applyAlignmentSuggestion,applyVarianceAllocation,budgetAlignment,varianceOf,reverseVarianceAllocation,allocationOptions} from "./financeAlignment";
import {computeMoney,type MoneyState} from "./money";
import {recordBillPayment} from "./billPayment";
const fixture=():MoneyState=>({
 demo:false,income:1000,savingsPct:10,savingsTargetAmount:100,
 categories:[{id:"rent",name:"Rent",type:"fixed",planned:400},{id:"food",name:"Groceries",type:"variable",planned:300},{id:"fun",name:"Leisure",type:"variable",planned:200}],
 expenses:[],cashOnHand:1000,cashReserve:100,
 commitments:[{id:"bill",name:"Rent",amount:400,frequency:"once",dueDate:"2026-10-20",categoryId:"rent"}]
});
describe("Existing Money flows: alignment & confirmed actuals",()=>{
 it("shows budget balance and only commits recommended changes after approval",()=>{
  const state=fixture();expect(budgetAlignment(state)).toMatchObject({status:"balanced",gap:0});
  const amended={...state,savingsTargetAmount:180};
  expect(budgetAlignment(amended).gap).toBe(-80);
  const approved=applyAlignmentSuggestion(amended,{kind:"variable",categoryId:"fun"});
  expect(approved.categories.find(c=>c.id==="fun")?.planned).toBe(120);
  expect(budgetAlignment(approved).status).toBe("balanced");
  expect(amended.categories.find(c=>c.id==="fun")?.planned).toBe(200);
  const noExcess=applyAlignmentSuggestion(amended,{kind:"variable",categoryId:"bad"});
  expect(noExcess).toBe(amended);
 });
 it("covers an overpaid fixed bill from the variable category without changing future bill amount",()=>{
  const paid=recordBillPayment(fixture(),"bill","2026-10-20","2026-10-15","e1","deduct",460);
  expect(paid.expenses[0]).toMatchObject({amount:460,plannedAmount:400,status:"paid",cashDeducted:true});
  expect(paid.cashOnHand).toBe(540);
  expect(varianceOf(paid.expenses[0]!)).toBe(60);
  expect(paid.commitments?.[0]?.amount).toBe(400);
  const approved=applyVarianceAllocation(paid,"e1",{kind:"variable",categoryId:"fun"},"2026-10-15");
  expect(approved.categories.find(c=>c.id==="rent")?.planned).toBe(460);
  expect(approved.categories.find(c=>c.id==="fun")?.planned).toBe(140);
  expect(budgetAlignment(approved).status).toBe("balanced");
  expect(applyVarianceAllocation(approved,"e1",{kind:"variable",categoryId:"fun"},"2026-10-15")).toBe(approved);
  const reversed=reverseVarianceAllocation(approved,"e1");
  expect(reversed.categories.find(c=>c.id==="rent")?.planned).toBe(400);
  expect(reversed.categories.find(c=>c.id==="fun")?.planned).toBe(200);
 });
 it("funds overpayment from an explicitly approved savings-target adjustment",()=>{
  const paid=recordBillPayment(fixture(),"bill","2026-10-20","2026-10-15","e2","already",440);
  const approved=applyVarianceAllocation(paid,"e2",{kind:"savings"},"2026-10-15");
  expect(approved.savingsTargetAmount).toBe(60);
  expect(approved.categories.find(c=>c.id==="rent")?.planned).toBe(440);
  expect(budgetAlignment(approved).status).toBe("balanced");
  expect(reverseVarianceAllocation(approved,"e2").savingsTargetAmount).toBe(100);
 });
 it("redirects an underspend to savings or variable categories without editing actual payment",()=>{
  const paid=recordBillPayment(fixture(),"bill","2026-10-20","2026-10-15","e3","already",350);
  const toSavings=applyVarianceAllocation(paid,"e3",{kind:"savings"},"2026-10-15");
  expect(toSavings.savingsTargetAmount).toBe(150);
  expect(toSavings.categories.find(c=>c.id==="rent")?.planned).toBe(350);
  expect(toSavings.expenses[0]?.amount).toBe(350);
  const toVariable=applyVarianceAllocation(paid,"e3",{kind:"variable",categoryId:"food"},"2026-10-15");
  expect(toVariable.categories.find(c=>c.id==="food")?.planned).toBe(350);
  expect(budgetAlignment(toVariable).status).toBe("balanced");
 });
 it("plans an expense without counting it as actually spent until payment confirmed",()=>{
  const state=fixture();
  state.expenses=[{id:"p",categoryId:"food",date:"2026-10-15",amount:50,plannedAmount:50,status:"planned",shared:true}];
  expect(computeMoney(state,new Date(2026,9,15,12)).spent).toBe(0);
  state.expenses[0]={...state.expenses[0]!,amount:65,status:"paid"};
  expect(computeMoney(state,new Date(2026,9,15,12)).spent).toBe(65);
  expect(varianceOf(state.expenses[0]!)).toBe(15);
 });
 it("never reallocates demo data or money from a variable budget already spent",()=>{
  const paid=recordBillPayment(fixture(),"bill","2026-10-20","2026-10-15","e4","already",460);
  paid.expenses.push({id:"g",date:"2026-10-15",categoryId:"fun",amount:190,shared:true});
  expect(allocationOptions(paid,60,"rent").some(x=>x.categoryId==="fun")).toBe(false);
  expect(applyVarianceAllocation({...paid,demo:true},"e4",{kind:"savings"},"2026-10-15").savingsTargetAmount).toBe(100);
 });
});
