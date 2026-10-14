import {describe,it,expect} from "vitest";
import {calendarWithMemberBirthdays,dateKey,isJordanWeekend,monthCells,nextJordanWeekend,occurrencesForDate,parseCalendarDate,shiftDays,upcomingMoments,type FamilyMoment} from "./familyCalendar";

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
 it("derives an annual birthday from a family profile without saving a second event",()=>{
  const members=[{id:"m1",name:"Sophia",birthday:"2021-10-20"}];
  const events=calendarWithMemberBirthdays([],members,"en");
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({id:"member-birthday:m1",title:"Sophia's birthday",date:"2021-10-20",annual:true,source:"member"});
  expect(occurrencesForDate(events,"2026-10-20")).toHaveLength(1);
  expect(calendarWithMemberBirthdays([],members,"ar")[0]?.title).toBe("عيد ميلاد Sophia");
 });
 it("updates profile birthdays dynamically and removes them when the member no longer has a date",()=>{
  const before=calendarWithMemberBirthdays([],[{id:"m1",name:"Faris",birthday:"2022-06-12"}],"en");
  const after=calendarWithMemberBirthdays([],[{id:"m1",name:"Faris",birthday:"2022-06-15"}],"en");
  expect(occurrencesForDate(before,"2027-06-12")).toHaveLength(1);
  expect(occurrencesForDate(after,"2027-06-12")).toHaveLength(0);
  expect(occurrencesForDate(after,"2027-06-15")).toHaveLength(1);
  expect(calendarWithMemberBirthdays([],[{id:"m1",name:"Faris"}],"en")).toHaveLength(0);
 });
 it("does not duplicate an existing manually entered birthday for the same name and day",()=>{
  const manual:FamilyMoment={id:"old",title:"Sophia birthday",date:"2021-10-20",kind:"birthday",annual:true};
  const events=calendarWithMemberBirthdays([manual],[{id:"m1",name:"Sophia",birthday:"2021-10-20"}],"en");
  expect(occurrencesForDate(events,"2026-10-20")).toHaveLength(1);
 });
 it("keeps separately entered annual wedding anniversaries and older nonbirthday events",()=>{
  const anniversary:FamilyMoment={id:"wedding",title:"Wedding anniversary",date:"2015-07-07",kind:"anniversary",annual:true};
  const events=calendarWithMemberBirthdays([anniversary],[{id:"m1",name:"Faris",birthday:"2022-07-07"}],"en");
  expect(occurrencesForDate(events,"2027-07-07").map(x=>x.kind).sort()).toEqual(["anniversary","birthday"]);
 });

});
