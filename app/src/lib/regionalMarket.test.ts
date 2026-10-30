import {describe,expect,it} from "vitest";
import {COUNTRIES,countryName,formatLocalizedCurrency,getCountry,indicativeCurrencies,isCountryCode} from "./regionalMarket";
describe("regional configuration never reinterprets household finance",()=>{
 it("includes 22 unique Arab markets and explicit multi-currency exceptions",()=>{
  expect(COUNTRIES).toHaveLength(22);
  expect(new Set(COUNTRIES.map(c=>c.code)).size).toBe(22);
  expect(indicativeCurrencies("LB")).toContain("USD");
  expect(indicativeCurrencies("PS")).toContain("JOD");
 });
 it("validates countries and safely defaults legacy unspecified settings",()=>{
  expect(isCountryCode("FR")).toBe(false);
  expect(isCountryCode("JO")).toBe(true);
  expect(getCountry("INVALID").code).toBe("JO");
  expect(countryName("MA","fr")).toBe("Maroc");
 });
 it("formats a selected currency without changing an amount",()=>{
  expect(formatLocalizedCurrency(12.5,"MAD","fr")).toContain("12");
  expect(()=>formatLocalizedCurrency(Number.NaN,"JOD","en")).toThrow();
  expect(()=>formatLocalizedCurrency(5,"INVALID","en")).toThrow();
 });
});
