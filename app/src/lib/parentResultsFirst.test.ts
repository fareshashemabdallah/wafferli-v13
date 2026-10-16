import {describe,expect,it} from "vitest";
import {budgetPlainResult} from "./budgetPlainResult";
import type {Alignment} from "./financeAlignment";
import {compareManuallyEnteredPrices,type ManualPriceOption} from "./clearShoppingResult";
const budget=(gap:number,status:Alignment["status"]):Alignment=>
 ({income:1200,savings:200,categories:1000,carryover:0,gap,status});
const offer=(id:string,store:string,price:string,extra=""):ManualPriceOption=>
 ({id,store,price,extra});
describe("plain-language household answers",()=>{
 it("explains the monthly margin without calling it bank cash or safe spending money",()=>{
  const r=budgetPlainResult({...budget(150,"surplus"),categories:850});
  expect(r.titleEn).toContain("room left");
  expect(r.messageEn).toContain("150.00 JOD");
  expect(r.messageEn).toContain("NOT confirmed cash");
  expect(r.messageAr).toContain("غير مخصّص");
 });
 it("makes the deficit and its next adjustment explicit",()=>{
  const r=budgetPlainResult({...budget(-100,"deficit"),categories:1100});
  expect(r.messageEn).toContain("100.00 JOD");
  expect(r.titleEn).toContain("adjustment");
  expect(r.messageEn).toContain("Review a cost or goal");
 });
 it("does not turn a balanced or incomplete monthly plan into an affordability promise",()=>{
  expect(budgetPlainResult(budget(0,"balanced")).messageEn).toContain("Check actual bills and cash");
  expect(budgetPlainResult(budget(0,"incomplete")).messageEn).toContain("not an estimated bank balance");
 });
});
describe("one clear manual shopping conclusion",()=>{
 it("compares all-in prices, excluding fake savings and never buying anything",()=>{
  const r=compareManuallyEnteredPrices([
   offer("a","Store A","20","3"),offer("b","Store B","17","1")
  ]);
  expect(r.ready).toBe(true);
  expect(r.cheaper?.store).toBe("Store B");
  expect(r.cheapestTotalJod).toBe(18);
  expect(r.alternativeTotalJod).toBe(23);
  expect(r.differenceJod).toBe(5);
  expect(r.tied).toBe(false);
 });
 it("shows no answer with one valid price, two copies of one store, or invalid prices",()=>{
  expect(compareManuallyEnteredPrices([offer("a","Shop","10")]).ready).toBe(false);
  expect(compareManuallyEnteredPrices([
   offer("a","Same store","10"),offer("b"," same store ","5")
  ]).ready).toBe(false);
  expect(compareManuallyEnteredPrices([
   offer("a","Store A","5.123"),offer("b","Store B","-1")
  ]).ready).toBe(false);
  expect(compareManuallyEnteredPrices([
   offer("a","","5"),offer("b","Store B","9")
  ]).ready).toBe(false);
  expect(compareManuallyEnteredPrices([
   offer("a","Store A","9","-3"),offer("b","Store B","8")
  ]).ready).toBe(false);
 });
 it("keeps ties honest and discounts no actual payment",()=>{
  const a=compareManuallyEnteredPrices([
   offer("a","Option one","7","3"),offer("b","Option two","10","0")
  ]);
  expect(a.tied).toBe(true);
  expect(a.differenceJod).toBe(0);
 });
});
