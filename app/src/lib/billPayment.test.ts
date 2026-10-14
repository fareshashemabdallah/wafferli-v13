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
 it("rejects future dates and deductions greater than recorded cash",()=>{
  expect(recordBillPayment(initial(),"rent","2026-10-14","2026-10-13","x","already").expenses).toEqual([]);
  const low={...initial(),cashOnHand:100};
  expect(recordBillPayment(low,"rent","2026-10-14","2026-10-14","x","deduct")).toBe(low);
 });
});
