import {describe,expect,it} from "vitest";
import {canonicalFamilyReadModel,canonicalPlanView} from "./canonicalFamilyFacts";
import {buildTodayActionPolicy} from "./todayActionPolicy";
import {nextConnectedFamilyAction} from "./connectedFamilyGuidance";
import {answerFamilyQuestion} from "./guidedFamilyAdvisor";
import {emptyRealMoney} from "./moneyOverview";
import {defaultFamilyPreferences} from "./familyPreferences";
import {familyForecastCommitments} from "./familyFinancialCommitments";
import type {Member,MoneyState} from "./money";
import type {FamilyPlan} from "./familyPlans";

const now=new Date(2026,9,24,12);
const member:Member={id:"kid-1",name:"Sophia",role:"child",ageGroup:"",prefs:"",
 birthdayMonthDay:"10-27"};
const changed:Member={...member,name:"Sophie",birthdayMonthDay:"11-02"};
const stored:FamilyPlan={
 id:"bday-plan",kind:"occasion",status:"planning",title:"Sophia's birthday",date:"2026-10-27",
 sourceRef:"occasion:member-birthday:kid-1@2026",createdAt:"2026-10-01T12:00:00Z",
 updatedAt:"2026-10-01T12:00:00Z",budgetJod:90,
 occasionPreparation:{
  gift:{amountJod:70,dueDate:"2026-10-30",description:"Painting kit",certainty:"planned"},
  celebration:{amountJod:15,dueDate:"2026-10-31",certainty:"idea"},
  extras:{amountJod:0,dueDate:"2026-11-02",certainty:"idea"}
 }
};
const prefs={...defaultFamilyPreferences};
const data=(members:Member[],money:MoneyState=emptyRealMoney())=>({
 money,members,moments:[],plans:[stored],preferences:prefs,now
});
describe("active surfaces share canonical family facts",()=>{
 it("uses the changed profile date/name in Today, connected advice and guided plans, without persisting a copied event",()=>{
  const original=JSON.stringify(stored);
  const parent=canonicalFamilyReadModel([stored],[],[changed]);
  expect(parent.moments).toHaveLength(1);
  expect(parent.moments[0]).toMatchObject({id:"member-birthday:kid-1",title:"Sophie's birthday"});
  expect(parent.plans).toHaveLength(1);
  expect(parent.plans[0]).toMatchObject({id:"bday-plan",title:"Sophie's birthday",date:"2026-11-02"});
  const today=buildTodayActionPolicy(data([changed]));
  expect(today.action).toMatchObject({kind:"gift",titleEn:"Sophie's birthday",
   date:"2026-11-02",planId:"bday-plan",giftEstimateJod:70});
  expect(today.week.some(w=>w.date==="2026-10-27")).toBe(false);
  const connected=nextConnectedFamilyAction(data([changed]));
  expect(connected.detailEn).toContain("Sophie's birthday");
  expect(connected.detailEn).toContain("2026-11-02");
  expect(connected.detailEn).not.toContain("2026-10-27");
  const guided=answerFamilyQuestion("Show my plans",data([changed]));
  expect(guided.textEn).toContain("Sophie's birthday");
  expect(guided.textEn).toContain("2026-11-02");
  expect(guided.textEn).not.toContain("2026-10-27");
  const calendar=answerFamilyQuestion("What's coming up for the children?",data([changed]));
  expect(calendar.textEn).toContain("2026-11-02");
  expect(JSON.stringify(stored)).toBe(original);
 });
 it("keeps an existing gift expense as one payment and does not change its due date when the profile changes",()=>{
  const money:MoneyState={...emptyRealMoney(),expenses:[{
   id:"one-payment",date:"2026-10-25",amount:64,categoryId:"gifts",status:"paid",shared:false,
   sourcePlanId:"bday-plan",sourceOccasionCost:"gift"
  }]};
  const projection=canonicalFamilyReadModel([stored],[],[changed]);
  expect(projection.plans[0]?.occasionPreparation?.gift.dueDate).toBe("2026-10-30");
  expect(projection.plans[0]?.title).toBe("Sophie's birthday");
  expect(familyForecastCommitments(projection.plans,money)).toHaveLength(0);
  expect(money.expenses).toHaveLength(1);
  expect(money.expenses[0]?.amount).toBe(64);
  expect(stored.occasionPreparation?.gift.amountJod).toBe(70);
 });
 it("does not invent a new occasion from removed source data or rewrite a legacy orphaned plan",()=>{
  const original=JSON.stringify(stored);
  const deleted=canonicalFamilyReadModel([stored],[],[]);
  expect(deleted.moments).toHaveLength(0);
  expect(deleted.plans[0]).toBe(stored);
  expect(canonicalPlanView(stored,[])).toBe(stored);
  expect(JSON.stringify(stored)).toBe(original);
 });
 it("preserves unrelated same-title events rather than combining records based on name",()=>{
  const sibling:Member={...changed,id:"kid-2"};
  const model=canonicalFamilyReadModel([stored],[],[changed,sibling]);
  expect(model.moments).toHaveLength(2);
  expect(model.moments[0]?.id).not.toBe(model.moments[1]?.id);
  expect(model.plans).toHaveLength(1);
  expect(model.plans[0]?.sourceRef).toBe(stored.sourceRef);
 });
});
