import {describe,expect,it} from "vitest";
import {areaFromRoute,familyDestinations} from "@/lib/familyNavigation";

describe("single Dabberna family navigation",()=>{
 it("has four unique family areas in both languages",()=>{
  expect(familyDestinations.map(x=>x.id)).toEqual(["today","money","finds","family"]);
  expect(new Set(familyDestinations.map(x=>x.to)).size).toBe(4);
  expect(familyDestinations.map(x=>x.shortEn)).toEqual(["Today","Money","Market","Family"]);
  expect(familyDestinations.find(x=>x.id==="finds")).toMatchObject({en:"Our Market",ar:"سوقنا",shortEn:"Market",shortAr:"سوقنا",to:"/finds"});
  for(const x of familyDestinations){
   expect(x.en.length).toBeGreaterThan(0);
   expect(x.ar.length).toBeGreaterThan(0);
   expect(x.shortEn.length).toBeGreaterThan(0);
  }
 });
 it.each([
  ["/","today"],["/advisor","today"],["/finds","finds"],["/family","family"],["/plans","family"],["/money","money"],["/household","money"],
  ["/calendar","family"],["/occasions","family"],["/space","family"],["/what-parents-say","family"]
 ] as const)("assigns %s to the same visible family frame (%s)",(route,expected)=>{
  expect(areaFromRoute(route)).toBe(expected);
 });
});
