import {describe,expect,it} from "vitest";
import {buildFamilyAttention,snoozeAttention,type AttentionItem} from "./familyAttention";
import {sampleMoney,sampleMembers,type Member} from "./money";
import {applyStarterBudget} from "./starterBudget";
import {defaultFamilyPreferences} from "./familyPreferences";
import {type FamilyMoment} from "./familyCalendar";
import {makeFamilyPlan} from "./familyPlans";

const now=new Date(2026,9,15,12);
const money=()=>applyStarterBudget(sampleMoney(),{income:2000,spending:1300,savings:250});
const parent:Member={id:"parent-real",name:"Parent",role:"adult",ageGroup:"30–44",prefs:""};
const child:Member={id:"child-real",name:"Child",role:"child",ageGroup:"0–5",prefs:"",birthday:"2021-10-18"};
const moment:FamilyMoment={id:"school-meeting",title:"School meeting",date:"2026-10-17",kind:"school",annual:false};
const assemble=(changes:Partial<Parameters<typeof buildFamilyAttention>[0]>={})=>
 buildFamilyAttention({money:money(),members:[parent,child],preferences:defaultFamilyPreferences,
  preferencesConfirmed:true,plans:[],moments:[],now,...changes});
describe("family attention queue",()=>{
 it("does not use demo money or sample birthdays as real family warnings",()=>{
  const got=assemble({money:sampleMoney(),members:sampleMembers()});
  expect(got.some(x=>x.category==="finance")).toBe(false);
  expect(got.some(x=>x.category==="occasion")).toBe(false);
 });
 it("puts cash safety first, with overdue bills always unsnoozable",()=>{
  const m={...money(),cashOnHand:25,cashReserve:0,cashUpdatedAt:"2026-10-15",
   commitments:[{id:"bill-1",name:"Electricity",frequency:"once" as const,
    amount:75,dueDate:"2026-10-13"}]};
  const got=assemble({money:m});
  expect(got.some(x=>x.category==="finance"&&x.severity==="critical")).toBe(true);
  expect(got.some(x=>x.category==="bill"&&x.severity==="critical")).toBe(true);
  expect(got.filter(x=>x.severity==="critical").every(x=>!x.canSnooze)).toBe(true);
  const first=got[0]!;
  expect(snoozeAttention({},first,now)).toEqual({});
  expect(assemble({money:m,snoozes:{[first.key]:"2030-01-01"}}).some(x=>x.key===first.key)).toBe(true);
 });
 it("flags upcoming unpaid bills only when parents opted into bill reminders",()=>{
  const m={...money(),cashOnHand:900,cashUpdatedAt:"2026-10-15",
   commitments:[{id:"bill",name:"School",amount:70,frequency:"once" as const,dueDate:"2026-10-18"}]};
  expect(assemble({money:m}).some(x=>x.category==="bill")).toBe(true);
  expect(assemble({money:m,preferences:{...defaultFamilyPreferences,billReminders:false}})
   .some(x=>x.category==="bill")).toBe(false);
 });
 it("honors global silence, gentle-only inspiration and actual children",()=>{
  expect(assemble({preferences:{...defaultFamilyPreferences,notificationFrequency:"off"}})).toEqual([]);
  const gentle={...defaultFamilyPreferences,notificationFrequency:"gentle" as const};
  const real=assemble({preferences:gentle});
  expect(real.some(x=>x.category==="inspiration")).toBe(true);
  const samples=assemble({preferences:gentle,members:sampleMembers()});
  expect(samples.some(x=>x.category==="inspiration")).toBe(false);
 });
 it("includes real near-term occasion but never fabricates one",()=>{
  const got=assemble({moments:[moment]});
  expect(got.some(x=>x.category==="occasion"&&x.detailEn.includes("School meeting"))).toBe(true);
  const birthday=assemble({moments:[]});
  expect(birthday.some(x=>x.key.includes("member-birthday:child-real"))).toBe(true);
 });
 it("considers upcoming plans, and never asserts a purchase is booked",()=>{
  const p=makeFamilyPlan({id:"plan-1",title:"Family outing",kind:"outing",date:"2026-10-17"},now)!;
  const got=assemble({plans:[p]});
  const signal=got.find(x=>x.category==="plan");
  expect(signal).toBeDefined();
  expect(signal?.detailEn).toMatch(/cost|estimate/i);
  expect(signal?.detailEn).not.toContain("booked");
 });
 it("snoozes non-critical items temporarily and never alters underlying data",()=>{
  const existing=assemble({moments:[moment]});
  const event=existing.find(x=>x.category==="occasion")!;
  const snoozes=snoozeAttention({},event,now);
  expect(assemble({moments:[moment],snoozes}).some(x=>x.key===event.key)).toBe(false);
  expect(assemble({moments:[moment],snoozes,now:new Date(2026,9,16,12)})
   .some(x=>x.key===event.key)).toBe(true);
  expect(moment.date).toBe("2026-10-17");
 });
 it("limits the list to four signals and protects critical priority",()=>{
  const m={...money(),cashOnHand:20,cashUpdatedAt:"2026-10-15",
   commitments:[{id:"bill",name:"Due",amount:90,frequency:"once" as const,dueDate:"2026-10-14"}]};
  const p=makeFamilyPlan({id:"plan",title:"Trip",kind:"outing",date:"2026-10-16"},now)!;
  const r=assemble({money:m,plans:[p],moments:[moment],maxItems:4});
  expect(r.length).toBeLessThanOrEqual(4);
  expect(r[0]?.severity).toBe("critical");
 });
 it("does not snooze a forged critical signal even if a caller tries",()=>{
  const fake:AttentionItem={
   key:"critical-test",category:"finance",severity:"critical",canSnooze:false,priority:0,
   titleEn:"",titleAr:"",detailEn:"",detailAr:"",actionEn:"",actionAr:"",link:"/money"
  };
  expect(snoozeAttention({},fake,now)).toEqual({});
 });
});
