import {describe,it,expect} from "vitest";
import {allFamilyMoments,dateKey,isJordanWeekend,isMemberBirthday,memberBirthdayMoments,monthCells,nextJordanWeekend,occurrencesForDate,parseCalendarDate,shiftDays,upcomingMoments,type FamilyMoment} from "./familyCalendar";
import type {Member} from "./money";

const birthday:FamilyMoment={id:"one",kind:"birthday",title:"Birthday",date:"2024-11-02",annual:true};
describe("Family calendar",()=>{
 it("rejects impossible dates rather than rolling them into another month",()=>{
  expect(parseCalendarDate("2026-02-30")).toBe(null);
  expect(parseCalendarDate("2024-02-29")).not.toBe(null);
 });
 it("lists annual birthdays only after the first occurrence",()=>{
  expect(occurrencesForDate([birthday],"2026-11-02")).toHaveLength(1);
  expect(occurrencesForDate([birthday],"2023-11-02")).toHaveLength(0);
  expect(occurrencesForDate([birthday],"2026-11-03")).toHaveLength(0);
 });
 it("only shows leap-day birthdays on valid leap days, avoiding silently choosing another day",()=>{
  const leap:FamilyMoment={...birthday,date:"2024-02-29"};
  expect(occurrencesForDate([leap],"2027-02-28")).toHaveLength(0);
  expect(occurrencesForDate([leap],"2028-02-29")).toHaveLength(1);
 });
 it("keeps local date boundaries and includes a Fri-Sat weekend",()=>{
  const fri=new Date(2026,9,16,12);
  expect(isJordanWeekend(fri)).toBe(true);
  expect(isJordanWeekend(shiftDays(fri,1))).toBe(true);
  expect(isJordanWeekend(shiftDays(fri,2))).toBe(false);
  expect(dateKey(nextJordanWeekend(new Date(2026,9,14,9)))).toBe("2026-10-16");
 });
 it("produces a Monday-first full month grid with correct dates",()=>{
  const cells=monthCells(2026,9);
  expect(cells.length%7).toBe(0);
  expect(cells.filter(c=>c.inMonth)).toHaveLength(31);
  expect(cells.filter(c=>c.date==="2026-10-16")[0]?.weekend).toBe(true);
 });
 it("shows a special event once and annual events in upcoming occasions",()=>{
  const meeting:FamilyMoment={id:"2",title:"Family lunch",date:"2026-10-21",kind:"activity",annual:false};
  const out=upcomingMoments([meeting,birthday],new Date(2026,9,20,16),20);
  expect(out.map(x=>x.occursOn)).toEqual(["2026-10-21","2026-11-02"]);
 });
 it("derives a recurring birthday directly from the family profile and updates it when edited",()=>{
  const sophia:Member={id:"sophia",name:"Sophia",role:"child",ageGroup:"0–5",prefs:"",birthday:"2021-10-19"};
  const initial=memberBirthdayMoments([sophia]);
  expect(initial).toHaveLength(1);
  expect(initial[0]?.title).toBe("Sophia's birthday");
  expect(initial[0]?.annual).toBe(true);
  expect(isMemberBirthday(initial[0]!)).toBe(true);
  expect(occurrencesForDate(initial,"2026-10-19")).toHaveLength(1);
  const updated=memberBirthdayMoments([{...sophia,birthday:"2021-11-03"}]);
  expect(occurrencesForDate(updated,"2026-10-19")).toHaveLength(0);
  expect(occurrencesForDate(updated,"2026-11-03")).toHaveLength(1);
  expect(memberBirthdayMoments([])).toHaveLength(0);
 });
 it("shows a birthday only once when it was previously entered directly in the calendar",()=>{
  const member:Member={id:"sophia",name:"Sophia",role:"child",ageGroup:"0–5",prefs:"",birthday:"2021-10-19"};
  const manuallySaved:FamilyMoment={id:"previous",title:"Sophia Birthday",date:"2026-10-19",kind:"birthday",annual:true,note:"Gift idea"};
  const combined=allFamilyMoments([manuallySaved],[member]);
  expect(occurrencesForDate(combined,"2026-10-19")).toHaveLength(1);
  expect(combined[0]?.id).toBe("member-birthday:sophia");
  // Suppression is only a display change; previously stored data remains untouched.
  expect(manuallySaved.note).toBe("Gift idea");
 });
 it("keeps distinct birthdays and supports Arabic manually saved birthday names",()=>{
  const member:Member={id:"faris",name:"فارس",role:"child",ageGroup:"0–5",prefs:"",birthday:"2022-08-16"};
  const other:FamilyMoment={id:"someone-else",title:"Another birthday",date:"2022-08-16",kind:"birthday",annual:true};
  const already:FamilyMoment={id:"arabic",title:"عيد ميلاد فارس",date:"2026-08-16",kind:"birthday",annual:true};
  const combined=allFamilyMoments([other,already],[member],true);
  expect(occurrencesForDate(combined,"2027-08-16")).toHaveLength(2);
  expect(combined.some(e=>e.id==="arabic")).toBe(false);
 });
 it("a changed profile birth date suppresses the old manually copied birthday",()=>{
  const person:Member={id:"sophia",name:"Sophia",role:"child",ageGroup:"",
   prefs:"",birthdayMonthDay:"11-20"};
  const previouslyCopied:FamilyMoment={id:"old-copy",kind:"birthday",
   title:"Sophia Birthday",annual:true,date:"2026-11-12"};
  const combined=allFamilyMoments([previouslyCopied],[person]);
  expect(combined).toHaveLength(1);
  expect(combined[0]?.id).toBe("member-birthday:sophia");
  expect(occurrencesForDate(combined,"2026-11-12")).toHaveLength(0);
  expect(occurrencesForDate(combined,"2026-11-20")).toHaveLength(1);
 });
 it("a profile's updated month/day takes precedence over any stale legacy full birthday",()=>{
  const person:Member={id:"faris",name:"Faris",role:"child",ageGroup:"",
   prefs:"",birthday:"2021-10-15",birthdayMonthDay:"11-12"};
  expect(memberBirthdayMoments([person])[0]?.date).toBe("2021-11-12");
 });
 it("combines anniversaries and profile birthdays without persisting two versions of the birthday",()=>{
  const member:Member={id:"parent",name:"Parent",role:"adult",ageGroup:"30–44",prefs:"",birthday:"1988-02-12"};
  const anniversary:FamilyMoment={id:"anniversary",title:"Our wedding anniversary",date:"2018-10-22",kind:"anniversary",annual:true};
  const stored=[anniversary];
  const combined=allFamilyMoments(stored,[member]);
  expect(stored).toHaveLength(1);
  expect(combined).toHaveLength(2);
  expect(occurrencesForDate(combined,"2026-10-22")[0]?.kind).toBe("anniversary");
  expect(occurrencesForDate(combined,"2026-02-12")[0]?.kind).toBe("birthday");
  expect(memberBirthdayMoments([{...member,birthday:undefined}])).toHaveLength(0);
 });

});
