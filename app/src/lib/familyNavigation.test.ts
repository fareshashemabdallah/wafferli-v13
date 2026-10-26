import {describe,expect,it} from "vitest";
import {areaFromRoute,familyDestinations} from "@/lib/familyNavigation";

describe("single Dabberna family navigation",()=>{
 it("has five distinct family destinations in both languages",()=>{
  expect(familyDestinations.map(x=>x.id)).toEqual(["today","money","parents","finds","family"]);
  expect(new Set(familyDestinations.map(x=>x.to)).size).toBe(5);
  expect(familyDestinations.map(x=>x.shortEn)).toEqual(["Today","Money","Parents Say","Market","Family"]);
  expect(familyDestinations.find(x=>x.id==="parents")).toMatchObject({en:"What Parents Say",ar:"شو بيقولوا الأهل؟",shortEn:"Parents Say",to:"/what-parents-say"});
  expect(familyDestinations.find(x=>x.id==="finds")).toMatchObject({en:"Our Market",ar:"سوقنا",shortEn:"Market",shortAr:"سوقنا",to:"/finds"});
  for(const x of familyDestinations){
   expect(x.en.length).toBeGreaterThan(0);
   expect(x.ar.length).toBeGreaterThan(0);
   expect(x.shortEn.length).toBeGreaterThan(0);
  }
 });
 it.each([
  ["/","today"],["/advisor","today"],["/finds","finds"],["/family","family"],["/plans","family"],["/money","money"],["/household","money"],
  ["/calendar","family"],["/occasions","family"],["/space","family"],["/what-parents-say","parents"]
 ] as const)("assigns %s to the same visible family frame (%s)",(route,expected)=>{
  expect(areaFromRoute(route)).toBe(expected);
 });
});
