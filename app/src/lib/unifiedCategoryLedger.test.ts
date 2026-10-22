import {describe,it,expect} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {buildForecast} from "./cashflow";
import {addCategoryItem,billOutstanding,billPaidTotal,recordCategoryPayment,undoCategoryPayment,
 saveCategoryDueDate,removeCategoryBill,disableCategoryItem} from "./unifiedCategoryLedger";
import type {MoneyState} from "./money";

const initial=():MoneyState=>({
 ...emptyRealMoney(),
 categories:[{id:"school",name:"Education",planned:500,type:"fixed"}],
 expenses:[],commitments:[],budgetItems:[],cashOnHand:1000
});
const withBill=()=>{
 const state=initial();
 return saveCategoryDueDate(state,{id:"tuition-bill",name:"Tuition",amount:400,
  categoryId:"school",frequency:"once",dueDate:"2026-11-05"});
};
describe("single-page category payment ledger",()=>{
 it("records two instalments once; forecasts only the unpaid balance",()=>{
  let state=withBill();
  expect(billOutstanding(state,"tuition-bill","2026-11-05")).toBe(400);
  state=recordCategoryPayment(state,{id:"first",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",amount:150,date:"2026-10-22"});
  state=recordCategoryPayment(state,{id:"second",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",amount:100,date:"2026-10-24"});
  expect(state.expenses).toHaveLength(2);
  expect(billPaidTotal(state,"tuition-bill","2026-11-05")).toBe(250);
  expect(billOutstanding(state,"tuition-bill","2026-11-05")).toBe(150);
  expect(state.commitments?.[0]?.paidDates).toBeUndefined();
  const forecast=buildForecast({incomes:[],commitments:state.commitments??[],
   billPayments:state.expenses,openingBalance:1000,reserve:0,today:"2026-10-22",days:30});
  expect(forecast.upcomingBills).toBe(150);
  expect(state.cashOnHand).toBe(1000);
  expect(recordCategoryPayment(state,{id:"duplicate",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",amount:160,date:"2026-10-25"})).toBe(state);
  expect(recordCategoryPayment(state,{id:"first",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",amount:10,date:"2026-10-25"})).toBe(state);
 });
 it("full settlement creates one paid date and undo restores only the corresponding balance",()=>{
  let state=withBill();
  state=recordCategoryPayment(state,{id:"a",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",date:"2026-10-22",amount:150});
  state=recordCategoryPayment(state,{id:"b",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",date:"2026-10-23",amount:250});
  expect(state.commitments?.[0]?.paidDates).toEqual(["2026-11-05"]);
  expect(billOutstanding(state,"tuition-bill","2026-11-05")).toBe(0);
  state=undoCategoryPayment(state,"b");
  expect(state.commitments?.[0]?.paidDates).toEqual([]);
  expect(state.expenses.map(x=>x.id)).toEqual(["a"]);
  expect(billOutstanding(state,"tuition-bill","2026-11-05")).toBe(250);
  expect(state.cashOnHand).toBe(1000);
 });
 it("subcategories are a breakdown, not an additional category allocation",()=>{
  let state=initial();
  const item={id:"transport",categoryId:"school",name:"Transport",enabled:true,
   amountJod:100,frequency:"monthly" as const,behaviour:"variable" as const,priority:"essential" as const};
  state=addCategoryItem(state,item);
  expect(state.budgetItems).toHaveLength(1);
  expect(state.categories[0]?.planned).toBe(500);
  expect(addCategoryItem(state,{...item,id:"too-high",amountJod:401})).toBe(state);
  state=recordCategoryPayment(state,{id:"trip",categoryId:"school",budgetItemId:"transport",
   date:"2026-10-22",amount:20});
  expect(state.expenses[0]?.budgetItemId).toBe("transport");
  state=disableCategoryItem(state,"transport");
  expect(state.budgetItems?.[0]?.enabled).toBe(false);
  expect(state.expenses).toHaveLength(1);
 });
 it("removing unpaid bills preserves old payment histories when present",()=>{
  let state=withBill();
  expect(removeCategoryBill(state,"tuition-bill").commitments).toHaveLength(0);
  state=recordCategoryPayment(state,{id:"paid",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",date:"2026-10-22",amount:100});
  const archived=removeCategoryBill(state,"tuition-bill");
  expect(archived.commitments?.[0]?.endDate).toBe("2026-11-04");
  expect(archived.expenses).toHaveLength(1);
 });
 it("does not allow invalid dates, phantom categories or an already-marked payment",()=>{
  const state=withBill();
  expect(recordCategoryPayment(state,{id:"bad",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-10-05",date:"2026-10-22",amount:50})).toBe(state);
  expect(recordCategoryPayment(state,{id:"bad",categoryId:"unknown",date:"2026-10-22",amount:50})).toBe(state);
  expect(recordCategoryPayment(state,{id:"bad",categoryId:"school",date:"2026-02-30",amount:50})).toBe(state);
  const settled={...state,commitments:(state.commitments??[]).map(c=>({...c,paidDates:["2026-11-05"]}))};
  expect(recordCategoryPayment(settled,{id:"bad",categoryId:"school",billId:"tuition-bill",
   dueDate:"2026-11-05",date:"2026-10-22",amount:50})).toBe(settled);
 });
});
