import {describe,expect,it} from "vitest";
import {areaFromRoute,familyDestinations} from "@/lib/familyNavigation";

describe("single Dabberna family navigation",()=>{
 it("has six unique connected areas in both languages",()=>{
  expect(familyDestinations.map(x=>x.id)).toEqual(["today","ask","plans","money","shopping","calendar"]);
  expect(new Set(familyDestinations.map(x=>x.to)).size).toBe(6);
  for(const x of familyDestinations){
   expect(x.en.length).toBeGreaterThan(0);
   expect(x.ar.length).toBeGreaterThan(0);
   expect(x.shortEn.length).toBeGreaterThan(0);
  }
 });
 it.each([
  ["/","today"],["/advisor","ask"],["/plans","plans"],["/money","money"],["/household","money"],
  ["/explore/smartbuy","shopping"],["/explore/shopping","shopping"],["/explore/market","shopping"],
  ["/explore/restaurants","shopping"],["/explore/services","shopping"],["/explore/weekend","shopping"],
  ["/calendar","calendar"],["/occasions","calendar"],["/space","today"]
 ] as const)("assigns %s to the same visible family frame (%s)",(route,expected)=>{
  expect(areaFromRoute(route)).toBe(expected);
 });
});
