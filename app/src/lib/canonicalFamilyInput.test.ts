import {describe,expect,it} from "vitest";
import {isDuplicateFamilyMoment,isDuplicateProfileBirthday} from "./canonicalFamilyInput";
import type {FamilyMoment} from "./familyCalendar";
import type {Member} from "./money";
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

describe("A birthday entered once in the family profile",()=>{
 const sophia:Member={id:"sophia",name:"Sophia",role:"child",ageGroup:"",prefs:"",birthdayMonthDay:"02-17"};
 const sibling:Member={...sophia,id:"milo",name:"Milo",birthdayMonthDay:"02-17"};
 const birthday:FamilyMoment={id:"manual",title:"Sophia's birthday",date:"2027-02-17",kind:"birthday",annual:true};
 it("rejects a second English or Arabic birthday for the same person across years",()=>{
  expect(isDuplicateProfileBirthday([sophia],birthday)).toBe(true);
  expect(isDuplicateProfileBirthday([sophia],{...birthday,title:"Birthday of Sophia",date:"2028-02-17"})).toBe(true);
  expect(isDuplicateProfileBirthday([{...sophia,name:"صوفيا"}],{...birthday,title:"عيد ميلاد صوفيا"})).toBe(true);
 });
 it("allows an independent occasion, a different person, or a different date",()=>{
  expect(isDuplicateProfileBirthday([sophia],{...birthday,title:"Milo's birthday"})).toBe(false);
  expect(isDuplicateProfileBirthday([sibling],birthday)).toBe(false);
  expect(isDuplicateProfileBirthday([sophia],{...birthday,date:"2027-02-18"})).toBe(false);
  expect(isDuplicateProfileBirthday([sophia],{...birthday,kind:"celebration"})).toBe(false);
 });
 it("ignores demonstration profiles and does not mutate saved member records",()=>{
  const sample:Member={...sophia,id:"m3",name:"Child (sample)"};
  const before=JSON.stringify([sophia]);
  expect(isDuplicateProfileBirthday([sample],{...birthday,title:"Child (sample)'s birthday"})).toBe(false);
  expect(isDuplicateProfileBirthday([sophia],birthday)).toBe(true);
  expect(JSON.stringify([sophia])).toBe(before);
 });
});
