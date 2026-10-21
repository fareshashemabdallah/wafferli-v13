import {describe,it,expect} from "vitest";
import {suggestLowEffortFamilyIdea,isFreshQuickDiscoveryIntent} from "./lowEffortDiscovery";
import type {Member} from "./money";
const member=(id:string,birthday:string,role:"child"|"adult"="child"):Member=>({
 id,name:id,role,ageGroup:"",prefs:"",birthday,birthdayMonthDay:birthday.slice(5)
});
const now=new Date(2026,9,21,12);
describe("a lazy parent gets useful inspiration without setup or financial entry",()=>{
 it("works with zero profiles and without inventing a child or real venue",()=>{
  const idea=suggestLowEffortFamilyIdea([],now);
  expect(idea).toMatchObject({kind:"park",agesKnown:false});
  expect(idea.contextEn).toContain("without setting up");
  expect(idea.contextEn).not.toMatch(/guaranteed|verified venue|afford/);
 });
 it("distinguishes a 1-year-old, a teenager and two children of very different ages",()=>{
  expect(suggestLowEffortFamilyIdea([member("baby","2025-08-20")],now))
   .toMatchObject({kind:"park",agesKnown:true,titleEn:"A gentle change of scene?"});
  expect(suggestLowEffortFamilyIdea([member("teen","2011-09-10")],now))
   .toMatchObject({kind:"museum",agesKnown:true,titleEn:"Explore something new together"});
  const both=suggestLowEffortFamilyIdea([member("baby","2025-08-20"),member("teen","2011-09-10")],now);
  expect(both.titleEn).toBe("An idea for different ages");
  expect(both.kind).toBe("park");
  expect(both.contextEn).toContain("both toddlers and teenagers");
 });
 it("does not count demonstration profiles, adults, or undisclosed ages as confirmed suitability",()=>{
  const sample:Member={id:"m3",name:"Child (sample)",role:"child",ageGroup:"6–12",prefs:"",birthday:"2012-05-15"};
  expect(suggestLowEffortFamilyIdea([sample],now).agesKnown).toBe(false);
  expect(suggestLowEffortFamilyIdea([member("parent","1988-01-01","adult")],now).agesKnown).toBe(false);
  const unknown:Member={id:"u",name:"Child",role:"child",ageGroup:"",prefs:""};
  expect(suggestLowEffortFamilyIdea([member("teen","2011-09-10"),unknown],now).agesKnown).toBe(false);
 });
 it("consumes a category-only intent only if it is recent and valid",()=>{
  const nowMs=1_790_000_000_000;
  expect(isFreshQuickDiscoveryIntent({kind:"park",requestedAt:nowMs-1000},nowMs)).toBe(true);
  expect(isFreshQuickDiscoveryIntent({kind:"park",requestedAt:nowMs-600000},nowMs)).toBe(false);
  expect(isFreshQuickDiscoveryIntent({kind:"park",requestedAt:nowMs+100},nowMs)).toBe(false);
  expect(isFreshQuickDiscoveryIntent({kind:"salary",requestedAt:nowMs-1000},nowMs)).toBe(false);
  expect(isFreshQuickDiscoveryIntent({kind:"museum",requestedAt:nowMs-1000,childrenNames:["private"]},nowMs)).toBe(true);
 });
});
