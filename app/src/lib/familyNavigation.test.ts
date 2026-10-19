import {describe,expect,it} from "vitest";
import {areaFromRoute,familyDestinations} from "@/lib/familyNavigation";

describe("single Dabberna family navigation",()=>{
 it("has four unique connected pillars in both languages",()=>{
  expect(familyDestinations.map(x=>x.id)).toEqual(["today","money","ask","family"]);
  expect(new Set(familyDestinations.map(x=>x.to)).size).toBe(4);
  expect(familyDestinations.map(x=>x.shortEn)).toEqual(["Today","Money","Decide","Plans"]);
  for(const x of familyDestinations){
   expect(x.en.length).toBeGreaterThan(0);
   expect(x.ar.length).toBeGreaterThan(0);
   expect(x.shortEn.length).toBeGreaterThan(0);
  }
 });
 it.each([
  ["/","today"],["/advisor","ask"],["/family","family"],["/plans","family"],["/money","money"],["/household","money"],
  ["/explore/smartbuy","today"],["/explore/shopping","today"],["/explore/market","today"],
  ["/explore/restaurants","today"],["/explore/services","today"],["/explore/weekend","family"],
  ["/calendar","family"],["/occasions","family"],["/space","family"]
 ] as const)("assigns %s to the same visible family frame (%s)",(route,expected)=>{
  expect(areaFromRoute(route)).toBe(expected);
 });
});
