import {describe,expect,it} from "vitest";
import {recordBillPayment,reverseBillPayment} from "./billPayment";
import type {MoneyState} from "./money";
const initial=():MoneyState=>({
  demo:false,income:1000,savingsPct:10,categories:[{id:"housing",name:"Housing",planned:400,type:"fixed"}],
  expenses:[],commitments:[{id:"rent",name:"Rent",amount:400,categoryId:"housing",dueDate:"2026-10-14",frequency:"monthly"}],
  cashOnHand:750,cashReserve:100
});
describe("bill payments reconcile with expenses and cash",()=>{
 it("logs one categorized expense and deducts bank cash only when user explicitly chooses",()=>{
  const s=recordBillPayment(initial(),"rent","2026-10-14","2026-10-14","expense1","deduct");
  expect(s.cashOnHand).toBe(350);
  expect(s.expenses).toHaveLength(1);
  expect(s.expenses[0]).toMatchObject({categoryId:"housing",amount:400,billId:"rent",cashDeducted:true});
  expect(s.commitments?.[0]?.paidDates).toEqual(["2026-10-14"]);
  expect(recordBillPayment(s,"rent","2026-10-14","2026-10-14","other","deduct")).toBe(s);
 });
 it("uses a linked expense even if the paid marker is missing after a restore",()=>{
  const paid=recordBillPayment(initial(),"rent","2026-10-14","2026-10-14","expense1","deduct");
  const missingMarker={...paid,commitments:(paid.commitments??[]).map(b=>({...b,paidDates:[]}))};
  expect(recordBillPayment(missingMarker,"rent","2026-10-14","2026-10-14","another","deduct")).toBe(missingMarker);
  expect(missingMarker.cashOnHand).toBe(350);
  expect(missingMarker.expenses).toHaveLength(1);
  const repeatedId={...initial(),expenses:[{id:"expense1",date:"2026-10-10",categoryId:"housing",amount:7,shared:false}]};
  expect(recordBillPayment(repeatedId,"rent","2026-10-14","2026-10-14","expense1","deduct")).toBe(repeatedId);
 });
 it("refuses to discard two legacy linked expenses when reversing one payment",()=>{
  const first=recordBillPayment(initial(),"rent","2026-10-14","2026-10-14","expense1","deduct");
  const inconsistent={...first,expenses:[{...first.expenses[0]!,id:"legacy-copy"},...first.expenses]};
  expect(reverseBillPayment(inconsistent,"rent","2026-10-14",true,"2026-10-14")).toBe(inconsistent);
  expect(inconsistent.cashOnHand).toBe(350);
  expect(inconsistent.expenses).toHaveLength(2);
  const untouched=initial();
  expect(reverseBillPayment(untouched,"rent","2026-10-14",true,"2026-10-14")).toBe(untouched);
 });
 it("doesn't deduct twice if current bank balance already includes the payment",()=>{
  const s=recordBillPayment(initial(),"rent","2026-10-14","2026-10-14","expense1","already");
  expect(s.cashOnHand).toBe(750);
  expect(s.expenses[0]?.cashDeducted).toBe(false);
  const restored=reverseBillPayment(s,"rent","2026-10-14",true,"2026-10-14");
  expect(restored.cashOnHand).toBe(750);
  expect(restored.expenses).toHaveLength(0);
 });
 it("reverses the cash adjustment only on a deliberate user action",()=>{
  const paid=recordBillPayment(initial(),"rent","2026-10-14","2026-10-14","expense1","deduct");
  const unchanged=reverseBillPayment(paid,"rent","2026-10-14",false,"2026-10-14");
  expect(unchanged.cashOnHand).toBe(350);
  const restored=reverseBillPayment(paid,"rent","2026-10-14",true,"2026-10-14");
  expect(restored.cashOnHand).toBe(750);
  expect(restored.commitments?.[0]?.paidDates).toEqual([]);
  expect(restored.expenses).toHaveLength(0);
 });
 it("accepts confirmed early payments and rejects deductions greater than entered cash",()=>{
  const early=recordBillPayment(initial(),"rent","2026-10-14","2026-10-13","x","already",375);
  expect(early.expenses[0]).toMatchObject({amount:375,plannedAmount:400});
  const low={...initial(),cashOnHand:100};
  expect(recordBillPayment(low,"rent","2026-10-14","2026-10-14","x","deduct")).toBe(low);
 });
});
