import {describe,it,expect} from "vitest";
import {ACTIVITY_THEMES,activitySearchUrl,childAgeOptions,suggestedActivityThemes} from "./familyActivityDiscovery";
import type {Member} from "./money";

describe("parent-first activity discovery",()=>{
 it("does not infer a real child's age from demo profiles",()=>{
  const members:Member[]=[
   {id:"m3",name:"Child (sample)",role:"child",ageGroup:"6–12",prefs:""},
   {id:"c1",name:"Child",role:"child",ageGroup:"",prefs:"",ageYears:2},
   {id:"c2",name:"Teen",role:"child",ageGroup:"",prefs:"",ageYears:14},
   {id:"p",name:"Adult",role:"adult",ageGroup:"",prefs:"",ageYears:40}
  ];
  expect(childAgeOptions(members)).toEqual([2,14]);
  expect(childAgeOptions(members.slice(0,1))).toEqual([]);
 });
 it("shows only age-appropriate search themes, never invented dated listings",()=>{
  expect(suggestedActivityThemes(2).some(x=>x.id==="toddler")).toBe(true);
  expect(suggestedActivityThemes(2).some(x=>x.id==="robotics")).toBe(false);
  expect(suggestedActivityThemes(14).some(x=>x.id==="teen")).toBe(true);
  expect(suggestedActivityThemes(14).some(x=>x.id==="toddler")).toBe(false);
  expect(suggestedActivityThemes(null).length).toBe(ACTIVITY_THEMES.length);
 });
 it("gives free-search themes more prominence when requested, without claiming a price",()=>{
  expect(suggestedActivityThemes(8,"affordable")[0]?.tags.includes("free-search")).toBe(true);
  expect(suggestedActivityThemes(8,"balance").length).toBeGreaterThan(0);
 });
 it("links to search, using only city and broad activity type, never child profile or income",()=>{
  const url=activitySearchUrl(ACTIVITY_THEMES[0]!,"Amman");
  const parsed=new URL(url);
  expect(parsed.hostname).toBe("www.google.com");
  expect(parsed.searchParams.get("query")).toContain("Amman");
  expect(url).not.toMatch(/salary|income|profile|childId/);
  expect(activitySearchUrl(ACTIVITY_THEMES[0]!,"")).toContain("Amman");
 });
});
