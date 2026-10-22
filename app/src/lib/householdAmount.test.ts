import {describe,it,expect} from "vitest";
import {parseHouseholdAmount} from "./householdAmount";
describe("income and household amount entry",()=>{
 it("accepts ordinary decimal and group separators",()=>{
  expect(parseHouseholdAmount("5000")).toBe(5000);
  expect(parseHouseholdAmount("5,000")).toBe(5000);
  expect(parseHouseholdAmount("5,000.75")).toBe(5000.75);
  expect(parseHouseholdAmount("3,5")).toBe(3.5);
  expect(parseHouseholdAmount("0")).toBe(0);
 });
 it("accepts Arabic digits and local separators",()=>{
  expect(parseHouseholdAmount("٥٬٠٠٠٫٥٠")).toBe(5000.5);
  expect(parseHouseholdAmount("۵۰۰۰")).toBe(5000);
  expect(parseHouseholdAmount("١٢٥٠")).toBe(1250);
 });
 it("refuses blank, malformed and above-limit amounts without turning them into zero",()=>{
  for(const x of [""," ","1,2,3","a50","-2","0.333","1.000,50","10 00","100001"])
   expect(parseHouseholdAmount(x)).toBeNull();
 });
});
