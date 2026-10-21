import {describe,expect,it} from "vitest";
import {areaFromRoute,familyDestinations} from "@/lib/familyNavigation";

describe("one category, one Dabberna destination",()=>{
 it("has exactly five unique bilingual categories",()=>{
  expect(familyDestinations.map(x=>x.id)).toEqual(["today","money","family","discover","shopping"]);
  expect(new Set(familyDestinations.map(x=>x.to)).size).toBe(5);
  expect(familyDestinations.map(x=>x.shortEn)).toEqual(["Today","Money","Family","Explore","Shop"]);
  for(const item of familyDestinations)expect(item.en&&item.ar&&item.shortEn&&item.shortAr).toBeTruthy();
 });
 it.each([
  ["/","today"],["/advisor","today"],["/family","family"],["/plans","family"],
  ["/money","money"],["/household","money"],["/explore","discover"],
  ["/explore/weekend","discover"],["/explore/restaurants","discover"],
  ["/explore/services","discover"],["/community","discover"],["/experience","discover"],
  ["/explore/smartbuy","shopping"],["/explore/shopping","shopping"],["/explore/market","shopping"],
  ["/calendar","family"],["/occasions","family"],["/space","family"],["/explore/together","family"]
 ] as const)("maps %s to %s without inventing another category",(route,area)=>{
  expect(areaFromRoute(route)).toBe(area);
 });
});
