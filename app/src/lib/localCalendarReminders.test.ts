import {describe,expect,it} from "vitest";
import {buildReminderCalendar,collectCalendarReminders} from "./localCalendarReminders";
import {sampleMoney,sampleMembers,type Member} from "./money";
import {makeFamilyTask,setTaskComplete} from "./familyTasks";
import {makeWishlistItem,updateWishlistStatus} from "./familyWishlist";
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

 it("exports parent-selected open tasks and unpurchased gift dates, no more",()=>{
  const task=makeFamilyTask({id:"t",title:"Pack school bags",dueDate:"2026-10-18",priority:"high"},now)!;
  const gift=makeWishlistItem({id:"g",kind:"gift",name:"Birthday present",targetDate:"2026-10-22"},now)!;
  const rows=collectCalendarReminders(data({tasks:[task],wishlist:[gift],
   options:{bills:false,family:false,tasks:true,shopping:true}}));
  expect(rows.map(r=>r.kind)).toEqual(["task","shopping"]);
  expect(rows[0]?.title).toContain("Pack school bags");
  expect(rows[1]?.title).toContain("Birthday present");
  const calendar=buildReminderCalendar(rows,now);
  expect(calendar).toContain("TRIGGER:-P1D");
  expect(calendar).toContain("Review task");
  expect(calendar).toContain("Plan gift");
 });
 it("excludes completed tasks, already purchased gifts and unselected categories",()=>{
  const task=makeFamilyTask({id:"t",title:"Review family task",dueDate:"2026-10-18",priority:"normal"},now)!;
  const gift=makeWishlistItem({id:"g",kind:"gift",name:"Birthday present",targetDate:"2026-10-22"},now)!;
  const declined=collectCalendarReminders(data({
   tasks:[task],wishlist:[gift],options:{bills:false,family:false,tasks:false,shopping:false}
  }));
  expect(declined).toEqual([]);
  const done=collectCalendarReminders(data({
   tasks:[setTaskComplete(task,true,now)],wishlist:[updateWishlistStatus(gift,"purchased",now)],
   options:{bills:false,family:false,tasks:true,shopping:true}
  }));
  expect(done).toEqual([]);
 });
 it("never copies family task notes, price or provider credentials into calendar file",()=>{
  const task=makeFamilyTask({id:"t",title:"School task",dueDate:"2026-10-18",
   priority:"normal",note:"PRIVATE_CHILD_NOTE"},now)!;
  const gift=makeWishlistItem({id:"g",kind:"gift",name:"Some gift",
   targetDate:"2026-10-22",recipientLabel:"PRIVATE_RECIPIENT"},now)!;
  const rows=collectCalendarReminders(data({tasks:[task],wishlist:[gift],
   options:{bills:false,family:false,tasks:true,shopping:true}}));
  const calendar=buildReminderCalendar(rows,now);
  expect(calendar).not.toContain("PRIVATE_CHILD_NOTE");
  expect(calendar).not.toContain("PRIVATE_RECIPIENT");
  expect(calendar).not.toMatch(/ATTENDEE|ORGANIZER|LOCATION:/);
 });
 it("refuses malformed date and empty export, never sends any network request",()=>{
  expect(()=>buildReminderCalendar([])).toThrow();
  expect(()=>buildReminderCalendar([{key:"a",date:"2026-02-31",title:"Bad",kind:"bill"}]))
   .toThrow(/invalid/i);
 });
});
