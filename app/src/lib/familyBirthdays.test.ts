import {describe,it,expect} from "vitest";
import {birthDateFromParts,birthdayParts,birthYears,memberAgeYears,memberAgeMonths,memberAgeDisplay,memberAgeLabel,updateMemberBirthday} from "./familyBirthdays";
import {memberBirthdayMoments,upcomingMoments} from "./familyCalendar";
import {childAgeOptions,suggestedActivityThemes} from "./familyActivityDiscovery";
import type {Member} from "./money";
const member=(extra:Partial<Member>={}):Member=>({
 id:"person1",name:"Sophia",role:"child",ageGroup:"",prefs:"",...extra
});
describe("Mobile birthday input and optional birth year",()=>{
 it("saves MM-DD without requiring the user to type a hyphen or choose a birth year",()=>{
  const m=updateMemberBirthday(member(),"02","17","");
  expect(m).toMatchObject({birthdayMonthDay:"02-17"});
  expect(m.birthday).toBeUndefined();
  expect(birthdayParts(m)).toEqual({month:"02",day:"17",year:""});
  expect(birthDateFromParts("02","17","")).toEqual({monthDay:"02-17",full:undefined,valid:true});
  expect(memberAgeYears(m,new Date(2026,9,21))).toBeNull();
  expect(memberBirthdayMoments([m])).toHaveLength(1);
  const dates=upcomingMoments(memberBirthdayMoments([m]),new Date(2027,1,15),7);
  expect(dates.some(x=>x.occursOn==="2027-02-17")).toBe(true);
 });
 it("saves birth year only when explicitly provided; shows accurate ages for toddlers, teens and adults",()=>{
  const date=new Date(2026,9,21,12);
  const toddler=updateMemberBirthday(member({name:"Toddler"}),"10","22","2025");
  const teen=updateMemberBirthday(member({name:"Teen"}),"10","20","2011");
  const adult=updateMemberBirthday(member({name:"Parent",role:"adult"}),"04","02","1983");
  expect(toddler.birthday).toBe("2025-10-22");
  expect(memberAgeYears(toddler,date)).toBe(0);
  expect(memberAgeYears(toddler,new Date(2026,9,22))).toBe(1);
  expect(memberAgeYears(teen,date)).toBe(15);
  expect(memberAgeYears(adult,date)).toBe(43);
  expect(memberAgeLabel(adult,date)).toBe("43");
  expect(childAgeOptions([toddler,teen,adult],date)).toEqual([0,15]);
  expect(suggestedActivityThemes(1).some(x=>x.id==="toddler")).toBe(true);
  expect(suggestedActivityThemes(15).some(x=>x.id==="toddler")).toBe(false);
  expect(suggestedActivityThemes(15).some(x=>x.id==="teen")).toBe(true);
 });
 it("rejects invalid dates including a nonexistent February 29",()=>{
  expect(birthDateFromParts("02","29","2024").valid).toBe(true);
  expect(birthDateFromParts("02","29","2025").valid).toBe(false);
  expect(birthDateFromParts("02","29","").valid).toBe(true);
  expect(birthDateFromParts("02","30","2020").valid).toBe(false);
  expect(birthDateFromParts("13","02","").valid).toBe(false);
  expect(birthDateFromParts("","12","2020").valid).toBe(false);
  expect(birthDateFromParts("","", "2020").valid).toBe(false);
  expect(birthYears(new Date(2026,9,21))[0]).toBe("2026");
  expect(birthYears(new Date(2026,9,21)).at(-1)).toBe("1900");
 });
 it("never keeps a stale manual age when the parent provides birth year",()=>{
  const old=member({ageYears:12,ageGroup:"6–12",birthdayMonthDay:"09-01"});
  const updated=updateMemberBirthday(old,"09","01","2014");
  expect(updated.ageYears).toBeUndefined();
  expect(updated.ageGroup).toBe("");
  expect(memberAgeYears(updated,new Date(2026,9,21))).toBe(12);
  expect(memberAgeYears(updated,new Date(2027,9,21))).toBe(13);
  const monthOnly=updateMemberBirthday(updated,"09","01","");
  expect(monthOnly.birthday).toBeUndefined();
  expect(monthOnly.birthdayMonthDay).toBe("09-01");
  expect(memberAgeYears(monthOnly,new Date(2027,9,21))).toBeNull();
 });
 it("shows a toddler's age in completed months, then switches to years on their second birthday",()=>{
  const toddler=member({birthday:"2025-09-20",birthdayMonthDay:"09-20"});
  expect(memberAgeMonths(toddler,new Date(2026,9,21))).toBe(13);
  expect(memberAgeDisplay(toddler,false,new Date(2026,9,21))).toBe("13 months");
  expect(memberAgeDisplay(toddler,true,new Date(2026,9,21))).toContain("13");
  expect(memberAgeDisplay(toddler,false,new Date(2027,8,19))).toBe("23 months");
  expect(memberAgeDisplay(toddler,false,new Date(2027,8,20))).toBe("2 years");
  expect(memberAgeMonths(toddler,new Date(2027,8,20))).toBeNull();
  expect(memberAgeDisplay(member({birthday:"2026-10-01"}),false,new Date(2026,9,21))).toBe("0 months");
  expect(memberAgeDisplay(member({ageYears:1,birthdayMonthDay:"01-01"}),false,new Date(2026,9,21))).toBe("1 year");
 });
 it("keeps older manual age and age range records working where birth year is absent",()=>{
  expect(memberAgeYears(member({ageYears:5,birthdayMonthDay:"04-20"}),new Date(2026,9,21))).toBe(5);
  expect(memberAgeLabel(member({ageGroup:"18–29"}))).toBe("18–29");
  expect(memberAgeYears(member({birthday:"2027-12-01"}),new Date(2026,9,21))).toBeNull();
 });
});
