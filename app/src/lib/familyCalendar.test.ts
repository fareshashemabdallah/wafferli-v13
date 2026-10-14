import {describe,it,expect} from "vitest";
import {dateKey,isJordanWeekend,monthCells,nextJordanWeekend,occurrencesForDate,parseCalendarDate,shiftDays,upcomingMoments,type FamilyMoment} from "./familyCalendar";

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
});
