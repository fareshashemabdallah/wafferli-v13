import {describe,expect,it} from "vitest";
import {prepareExpenseForShare,validSharedExpenseRow,formatSharedJod} from "./expenseSharing";
import {sampleMoney,type MoneyState,type Expense} from "./money";
const now=new Date(2026,9,15,12);
const base:Expense={
 id:"local-expense-7",date:"2026-10-10",categoryId:"food",amount:24.50,
 status:"paid",shared:true,note:"Confidential: medical visit",owner:"Child",
 sourcePlanId:"private-plan"
};
const state=():MoneyState=>({
 ...sampleMoney(),demo:false,
 categories:[{id:"food",name:"Groceries",type:"variable",planned:300}],
 expenses:[base],income:1800
});
describe("opt-in expense sharing privacy and accuracy",()=>{
 it("previews only four explicitly allowed minimal fields, no notes or member identity",()=>{
  const p=prepareExpenseForShare(state(),base,now);
  expect(p).toEqual({
   localExpenseId:"local-expense-7",occurredOn:"2026-10-10",
   category:"Groceries",amountFils:24500
  });
  expect(JSON.stringify(p)).not.toContain("medical visit");
  expect(JSON.stringify(p)).not.toContain("Child");
  expect(JSON.stringify(p)).not.toContain("sourcePlanId");
  expect(formatSharedJod(24500)).toBe("24.500 JOD");
 });
 it("never treats a local household flag as automatic consent",()=>{
  const s=state();
  expect(s.expenses[0]?.shared).toBe(true);
  expect(prepareExpenseForShare(s,base,now)?.localExpenseId).toBe(base.id);
  expect(s).not.toHaveProperty("householdId");
  expect(s.expenses[0]?.note).toBe("Confidential: medical visit");
 });
 it("refuses demo data, private, planned, future, invalid amounts and unrecognized categories",()=>{
  const s=state();
  expect(prepareExpenseForShare(sampleMoney(),base,now)).toBeNull();
  expect(prepareExpenseForShare(s,{...base,shared:false},now)).toBeNull();
  expect(prepareExpenseForShare(s,{...base,status:"planned"},now)).toBeNull();
  expect(prepareExpenseForShare(s,{...base,date:"2026-10-20"},now)).toBeNull();
  expect(prepareExpenseForShare(s,{...base,date:"2026-02-30"},now)).toBeNull();
  expect(prepareExpenseForShare(s,{...base,amount:NaN},now)).toBeNull();
  expect(prepareExpenseForShare(s,{...base,amount:1.234},now)).toBeNull();
  expect(prepareExpenseForShare(s,{...base,categoryId:"unknown"},now)).toBeNull();
 });
 it("uses correct three-decimal JOD fils while preserving ordinary two-decimal entry",()=>{
  expect(prepareExpenseForShare(state(),{...base,amount:0.01},now)?.amountFils).toBe(10);
  expect(prepareExpenseForShare(state(),{...base,amount:500},now)?.amountFils).toBe(500000);
 });
 it("validates trusted server response and denies a forged household record",()=>{
  const row={
   id:"6ca9e00a-bd8f-48bd-b7f6-8d01ca637bd7",
   household_id:"12e2c1b2-3418-4593-96bf-1aa2c0e1b22a",
   created_by:"35796b6a-8c32-4c8b-b905-14bf4c58feaa",
   source_fingerprint:"c".repeat(64),
   category:"School",amount_fils:12600,occurred_on:"2026-10-10",
   currency:"JOD",consented_at:"2026-10-15T10:15:00Z"
  };
  expect(validSharedExpenseRow(row)).toBe(true);
  expect(validSharedExpenseRow({...row,created_by:"not-uuid"})).toBe(false);
  expect(validSharedExpenseRow({...row,amount_fils:"12600"})).toBe(false);
  expect(validSharedExpenseRow({...row,currency:"USD"})).toBe(false);
  expect(validSharedExpenseRow({...row,source_fingerprint:"sensitive-local-id"})).toBe(false);
 });
});
