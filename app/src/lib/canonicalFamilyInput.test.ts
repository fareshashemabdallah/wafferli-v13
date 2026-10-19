import {describe,expect,it} from "vitest";
import {isDuplicateFamilyMoment} from "./canonicalFamilyInput";
import type {FamilyMoment} from "./familyCalendar";
const event:FamilyMoment={id:"first",title:"School Celebration",date:"2026-10-30",kind:"school",annual:false};
describe("One family date shared by My Family and Calendar",()=>{
 it("prevents an identical new event on another input screen",()=>{
  expect(isDuplicateFamilyMoment([event],{...event,id:"another",title:" school  celebration "})).toBe(true);
 });
 it("allows editing the same event and different occasions on the same date",()=>{
  expect(isDuplicateFamilyMoment([event],event)).toBe(false);
  expect(isDuplicateFamilyMoment([event],{...event,id:"birthday",kind:"birthday"})).toBe(false);
  expect(isDuplicateFamilyMoment([event],{...event,id:"different",title:"Graduation"})).toBe(false);
 });
 it("recognizes annually repeating authored events across years without merging different titles",()=>{
  const recurring:FamilyMoment={...event,annual:true,date:"2026-10-30",kind:"anniversary"};
  expect(isDuplicateFamilyMoment([recurring],{...recurring,id:"another",date:"2027-10-30"})).toBe(true);
  expect(isDuplicateFamilyMoment([recurring],{...recurring,id:"another",date:"2027-10-31"})).toBe(false);
 });
});
