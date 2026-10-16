import {describe,expect,it} from "vitest";
import {basketExpenseId,recordBasketExpense} from "./basketRecording";
import {sampleMoney,type MoneyState} from "./money";

const cycleA="0123456789abcdef01234567",cycleB="1123456789abcdef01234567";
const basket=[{id:"fresh",name:"Groceries",qty:2,price:3.25,done:false}];
const real=():MoneyState=>({...sampleMoney(),demo:false,expenses:[]});

describe("shopping-basket expense recording",()=>{
 it("saves a real trip once, even when repeated after reload",()=>{
  const one=recordBasketExpense(real(),basket,cycleA,"groc","2026-10-16");
  expect(one.expenses).toHaveLength(1);
  expect(one.expenses[0]).toMatchObject({
   id:basketExpenseId(cycleA),date:"2026-10-16",amount:6.5,
   categoryId:"groc",shared:false,status:"paid"
  });
  expect(recordBasketExpense(one,basket,cycleA,"groc","2026-10-16")).toBe(one);
  const next=recordBasketExpense(one,basket,cycleB,"groc","2026-10-23");
  expect(next.expenses).toHaveLength(2);
  expect(next.expenses[0]?.date).toBe("2026-10-23");
 });
 it("does not turn demo finances or old sample products into real entries",()=>{
  const demo=sampleMoney();
  expect(recordBasketExpense(demo,basket,cycleA,"groc","2026-10-16")).toBe(demo);
  const m=real();
  expect(recordBasketExpense(m,[{...basket[0]!,name:"Milk (sample)"}],cycleA,"groc","2026-10-16")).toBe(m);
 });
 it("does not silently classify groceries as an unrelated category or accept invalid prices",()=>{
  const m=real();
  expect(recordBasketExpense(m,basket,cycleA,"rent-does-not-exist","2026-10-16")).toBe(m);
  expect(recordBasketExpense(m,basket,cycleA,"rent","not-a-date")).toBe(m);
  expect(recordBasketExpense(m,[{...basket[0]!,price:-1}],cycleA,"groc","2026-10-16")).toBe(m);
  expect(recordBasketExpense(m,[{...basket[0]!,qty:0}],cycleA,"groc","2026-10-16")).toBe(m);
  expect(recordBasketExpense(m,[],cycleA,"groc","2026-10-16")).toBe(m);
  expect(recordBasketExpense(m,basket,"", "groc","2026-10-16")).toBe(m);
 });
});
