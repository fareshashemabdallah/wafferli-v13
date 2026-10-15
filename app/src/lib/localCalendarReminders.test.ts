import {describe,expect,it} from "vitest";
import {buildReminderCalendar,collectCalendarReminders} from "./localCalendarReminders";
import {sampleMoney,sampleMembers,type Member} from "./money";
const now=new Date(2026,9,15,12);
const realMember:Member={id:"real-child",name:"Actual Kid",role:"child",ageGroup:"0–5",prefs:"",
 birthday:"2022-10-19"};
const data=(override:Record<string,unknown>={})=>({
 money:{...sampleMoney(),demo:false,commitments:[{
  id:"school-fee",name:"School Fee",amount:80,frequency:"once" as const,dueDate:"2026-10-20"
 }]},members:[realMember,...sampleMembers()],moments:[{id:"school-event",title:"School concert",
 date:"2026-10-21",kind:"school" as const,annual:false}],options:{bills:true,family:true},
 now,...override
});
describe("private user-driven iCalendar export",()=>{
 it("produces only real member birthdays, recorded bills and calendar events",()=>{
  const rows=collectCalendarReminders(data());
  expect(rows.some(x=>x.title.includes("Actual Kid"))).toBe(true);
  expect(rows.some(x=>x.title.includes("Child (sample)"))).toBe(false);
  expect(rows.some(x=>x.title.includes("School Fee"))).toBe(true);
  expect(rows.some(x=>x.title.includes("School concert"))).toBe(true);
 });
 it("respects explicit category selection and demo-finance exclusion",()=>{
  const noBills=collectCalendarReminders(data({options:{bills:false,family:true}}));
  expect(noBills.every(e=>e.kind==="family")).toBe(true);
  const sample=collectCalendarReminders(data({money:sampleMoney(),options:{bills:true,family:false}}));
  expect(sample).toEqual([]);
  expect(collectCalendarReminders(data({options:{bills:false,family:false}}))).toEqual([]);
 });
 it("escapes injected newlines and delimiter characters in downloaded file",()=>{
  const calendar=buildReminderCalendar([{
   key:"1",date:"2026-10-20",title:"Rent\nATTENDEE:evil@host.com;price,now",
   kind:"bill"
  }],now);
  expect(calendar).toContain("BEGIN:VALARM");
  expect(calendar).toContain("TRIGGER:-P1D");
  expect(calendar).not.toContain("\nATTENDEE:evil@host.com");
  expect(calendar).not.toContain("SUMMARY:Rent\r\nATTENDEE");
  expect(calendar).toContain("DTSTART;VALUE=DATE:20261020");
  expect(calendar).toContain("DTEND;VALUE=DATE:20261021");
 });
 it("refuses malformed date and empty export, never sends any network request",()=>{
  expect(()=>buildReminderCalendar([])).toThrow();
  expect(()=>buildReminderCalendar([{key:"a",date:"2026-02-31",title:"Bad",kind:"bill"}]))
   .toThrow(/invalid/i);
 });
});
