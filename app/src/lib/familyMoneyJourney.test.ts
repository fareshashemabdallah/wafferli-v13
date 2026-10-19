import {describe,expect,it} from "vitest";
import {buildFamilyMoneyJourney,moneyJourneyWeek} from "./familyMoneyJourney";
import {sampleMoney,sampleMembers,type Member,type MoneyState} from "./money";
import {defaultFamilyPreferences,type FamilyPreferences} from "./familyPreferences";
import type {FamilyMoment} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";

const now=new Date(2026,9,19,12);
const base=()=>({money:sampleMoney(),members:sampleMembers(),moments:[] as FamilyMoment[],
 plans:[] as FamilyPlan[],preferences:{...defaultFamilyPreferences} as FamilyPreferences,now});
const realMoney=():MoneyState=>({...sampleMoney(),demo:false,income:900,incomeKnown:true,savingsPct:0,categories:[
 {id:"essential",name:"Rent",type:"fixed",planned:1000,priority:"essential"},
 {id:"important",name:"Swimming lessons",type:"periodic",planned:60,priority:"protected"},
 {id:"unknown",name:"Unreviewed",type:"variable",planned:20}
 ],expenses:[],cashOnHand:null});
describe("the family money journey",()=>{
 it("starts from optional real data and never interprets the sample budget as the family's own",()=>{
  const s=buildFamilyMoneyJourney(base());
  expect(s.knownFinances).toBe(false);
  expect(s.storyEn).toContain("No income disclosure");
  expect(s.statusEn).toContain("getting to know");
  expect(s.hasActualCash).toBe(false);
  expect(s.reviewedCategories).toBe(0);
  expect(s.unclassifiedCategories).toBe(0);
 });
 it("respects an essential-income gap instead of suggesting savings or declaring money available",()=>{
  const s=buildFamilyMoneyJourney({...base(),money:realMoney()});
  expect(s.knownFinances).toBe(true);
  expect(s.reality.kind).toBe("essentials-gap");
  expect(s.next.route).toBe("/money");
  expect(s.next.titleEn).toContain("financial pressure");
  expect(s.dimensions[1]!.detailEn).toContain("Essential");
  expect(s.storyEn).toContain("Tracking alone cannot resolve");
  expect(s.reviewedCategories).toBe(2);
  expect(s.unclassifiedCategories).toBe(1);
 });
 it("includes next plans and dates when permitted, while respecting lifestyle preference",()=>{
  const moments:FamilyMoment[]=[{id:"event",title:"Birthday (parent entered)",date:"2026-10-25",kind:"birthday",annual:false}];
  const visible=buildFamilyMoneyJourney({...base(),moments});
  expect(visible.nextMilestones.some(x=>x.title==="Birthday (parent entered)")).toBe(true);
  const hidden=buildFamilyMoneyJourney({...base(),moments,preferences:{...defaultFamilyPreferences,lifestyle:false}});
  expect(hidden.nextMilestones).toEqual([]);
 });
 it("prioritizes financial safety above optional preferred care dimension",()=>{
  const s=buildFamilyMoneyJourney({...base(),money:realMoney(),
   preferences:{...defaultFamilyPreferences,moneyJourneyFocus:"live"}});
  expect(s.next.route).toBe("/money");
  expect(s.next.detailEn).not.toMatch(/you can afford/i);
 });
 it("generates stable local Monday–Sunday week without pretending scheduled notifications",()=>{
  expect(moneyJourneyWeek(new Date(2026,9,19,18))).toBe("2026-10-19");
  expect(moneyJourneyWeek(new Date(2026,9,25,10))).toBe("2026-10-19");
  expect(moneyJourneyWeek(new Date(2026,9,26,8))).toBe("2026-10-26");
  expect(buildFamilyMoneyJourney(base()).weekEnd).toBe("2026-10-25");
 });
 it("uses only real child profiles and never guesses that essential spending is covered",()=>{
  const children:Member[]=[
   ...sampleMembers(),{id:"child1",name:"Real child",role:"child",ageGroup:"",prefs:"",ageYears:5}
  ];
  const s=buildFamilyMoneyJourney({...base(),members:children,money:realMoney()});
  expect(s.childCount).toBe(1);
  expect(s.dimensions[1]!.detailEn).toContain("Essential spending");
  expect(s.dimensions[1]!.detailEn).not.toContain("is covered");
 });
});
