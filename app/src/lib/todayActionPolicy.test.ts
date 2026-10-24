import {describe,expect,it} from "vitest";
import {buildTodayActionPolicy} from "./todayActionPolicy";
import {emptyRealMoney} from "./moneyOverview";
import {sampleMembers,type MoneyState} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";
import type {FamilyPlan} from "./familyPlans";
import type {FamilyMoment} from "./familyCalendar";
const now=new Date(2026,9,20,12);
const moments:FamilyMoment[]=[{id:"sophia-bday",title:"Sophia's birthday",kind:"birthday",
 date:"2026-10-28",annual:false}];
const gift:FamilyPlan={id:"occasion1",title:"Sophia's birthday",kind:"occasion",status:"planning",
 sourceRef:"occasion:sophia-bday@2026",date:"2026-10-28",
 createdAt:"2026-10-01T12:00:00.000Z",updatedAt:"2026-10-01T12:00:00.000Z",
 occasionPreparation:{gift:{amountJod:70,description:"Science kit",dueDate:"2026-10-26",certainty:"planned"},
 celebration:{amountJod:20,dueDate:"2026-10-27"},extras:{amountJod:5,dueDate:"2026-10-28"}}};
const data=(money:MoneyState=emptyRealMoney(),plans:FamilyPlan[]=[],calendar:FamilyMoment[]=moments)=>
 ({money,members:sampleMembers(),moments:calendar,plans,preferences:{...defaultFamilyPreferences},now});
describe("Today: one contextual next action",()=>{
 it("never mistakes sample people and money for the family's own or invents a deadline",()=>{
  const b=buildTodayActionPolicy(data());
  expect(b.action?.kind).toBe("occasion");
  expect(b.action?.titleEn).toBe("Sophia's birthday");
  expect(b.moneyStatus).toBe("partial");
  expect(b.cashVerified).toBe(false);
  expect(b.upcomingBillsJod).toBe(0);
  expect(b.monthPaidJod).toBe(0);
  const empty=buildTodayActionPolicy(data(emptyRealMoney(),[],[]));
  expect(empty.action).toBeNull();
  expect(empty.week).toEqual([]);
  expect(empty.cashVerified).toBe(false);
 });
 it("continues the exact gift plan in Family without creating expenses",()=>{
  const money=emptyRealMoney();
  const b=buildTodayActionPolicy(data(money,[gift]));
  expect(b.action).toMatchObject({
   kind:"gift",route:"/plans",planId:"occasion1",
   occasionKey:"sophia-bday@2026",giftEstimateJod:70,sellerCount:0
  });
  expect(money.expenses).toHaveLength(0);
  expect(gift.occasionPreparation?.gift.amountJod).toBe(70);
  expect(b.plannedGiftJod).toBe(70);
  expect(b.cashVerified).toBe(false);
 });
 it("a chosen seller is not a completed payment; confirmed expense removes the gift step",()=>{
  const quote:FamilyPlan={...gift,occasionPreparation:{...gift.occasionPreparation!,
   gift:{...gift.occasionPreparation!.gift,selectedQuote:{
    productName:"Science kit",store:"Shop",totalJod:56,checkedByParent:false
   }}}};
  expect(buildTodayActionPolicy(data(emptyRealMoney(),[quote])).action).toMatchObject({kind:"gift",sellerCount:1});
  const paid={...emptyRealMoney(),expenses:[{id:"paid1",date:"2026-10-20",amount:54,categoryId:"uncategorized",shared:false,status:"paid" as const,
   sourcePlanId:gift.id,sourceOccasionCost:"gift" as const}]};
  expect(buildTodayActionPolicy(data(paid,[quote])).action?.kind).not.toBe("gift");
 });
 it("an actual essential-income shortfall outranks an upcoming family gift",()=>{
  const money={...emptyRealMoney(),income:500,incomeKnown:true,categories:[
   {id:"rent",name:"Rent",type:"fixed" as const,planned:700,priority:"essential" as const}]};
  const b=buildTodayActionPolicy(data(money,[gift]));
  expect(b.action?.kind).toBe("financial");
  expect(b.moneyStatus).toBe("risk");
  expect(b.action?.route).toBe("/money");
 });
 it("overdue bills outrank birthday shopping and do not get auto-marked paid",()=>{
  const money={...emptyRealMoney(),commitments:[{id:"school",name:"School fee",amount:80,frequency:"once" as const,dueDate:"2026-10-18"}]};
  const b=buildTodayActionPolicy(data(money,[gift]));
  expect(b.action?.kind).toBe("bill");
  expect(b.action?.id).toContain("overdue");
  expect(money.commitments).toEqual([{id:"school",name:"School fee",amount:80,frequency:"once",dueDate:"2026-10-18"}]);
 });
 it("respects lifestyle preference without suppressing genuine financial warnings",()=>{
  const prefs={...defaultFamilyPreferences,lifestyle:false};
  const noFamily=buildTodayActionPolicy({...data(),preferences:prefs});
  expect(noFamily.action).toBeNull();
  const money={...emptyRealMoney(),income:300,incomeKnown:true,categories:[
   {id:"rent",name:"Rent",type:"fixed" as const,planned:500,priority:"essential" as const}]};
  expect(buildTodayActionPolicy({...data(money,[gift]),preferences:prefs}).action?.kind).toBe("financial");
 });
});
