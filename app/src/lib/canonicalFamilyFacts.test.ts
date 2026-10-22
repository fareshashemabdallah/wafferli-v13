import {describe,expect,it} from "vitest";
import {canonicalFamilyMoments,canonicalPlanView,canonicalPlanViews,
 canonicalOccasionForPlan,occasionLink} from "./canonicalFamilyFacts";
import {occurrencesForDate} from "./familyCalendar";
import {upsertOccasionFamilyPlan} from "./occasionPlanBridge";
import {familyFinancialCommitments,familyForecastCommitments,recordFamilyCommitmentPayment} from "./familyFinancialCommitments";
import {getMoneyOverview,emptyRealMoney} from "./moneyOverview";
import {homeSnapshot} from "./homeSnapshot";
import type {Member} from "./money";
import type {FamilyMoment} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";
const now=new Date(2026,9,20,12);
const child:Member={id:"daughter",name:"Sophia",role:"child",ageGroup:"",prefs:"",birthdayMonthDay:"11-12"};
const changed={...child,name:"Sophie",birthdayMonthDay:"11-20"};
const occasion=()=>occurrencesForDate(canonicalFamilyMoments([],[child]),"2026-11-12")[0]!;
const initial=()=>upsertOccasionFamilyPlan([],occasion(),{budgetJod:90},undefined,"gift-plan",now).plans[0]!;
const budget=()=>({
 gift:{amountJod:45,dueDate:"2026-11-08",description:"Art kit",certainty:"planned" as const},
 celebration:{amountJod:30,dueDate:"2026-11-10",certainty:"idea" as const},
 extras:{amountJod:0,dueDate:"2026-11-12"}
});
describe("one source for every family fact: profile → calendar → plan → money",()=>{
 it("uses a stable original member ID even after parent changes the child's name and birthday",()=>{
  const plan={...initial(),occasionPreparation:budget()};
  const stored=JSON.stringify(plan);
  const before=canonicalPlanViews([plan],[],[child])[0]!;
  const after=canonicalPlanViews([plan],[],[changed])[0]!;
  expect(before).toMatchObject({title:"Sophia's birthday",date:"2026-11-12"});
  expect(after).toMatchObject({title:"Sophie's birthday",date:"2026-11-20",
   id:"gift-plan",budgetJod:90,sourceRef:"occasion:member-birthday:daughter@2026"});
  expect(after.occasionPreparation).toEqual(plan.occasionPreparation);
  expect(JSON.stringify(plan)).toBe(stored);
  expect(canonicalPlanViews([plan],[],[changed],true)[0]!.title).toBe("عيد ميلاد Sophie");
  expect(upsertOccasionFamilyPlan([plan],occurrencesForDate(
   canonicalFamilyMoments([],[changed]),"2026-11-20")[0]!,
   {budgetJod:90},undefined,"unused",now).created).toBe(false);
 });
 it("does not invent two home planning cards or another recorded expense for the same birthday",()=>{
  const plan={...initial(),occasionPreparation:budget()};
  const money=emptyRealMoney();
  const snapshot=homeSnapshot({money,members:[changed],moments:[],plans:[plan],
   tasks:[],basket:[],wishlist:[],now,arabic:false});
  expect(snapshot.agenda).toHaveLength(0); // birthday is outside the upcoming week
  expect(snapshot.plans.filter(p=>p.title.includes("Sophie"))).toHaveLength(1);
  expect(snapshot.plans.find(p=>p.kind==="plan")).toMatchObject({
   id:"plan:gift-plan",title:"Sophie's birthday",date:"2026-11-20"
  });
  expect(money.expenses).toHaveLength(0);
  const forecast=familyForecastCommitments(canonicalPlanViews([plan],[],[changed]),money);
  expect(forecast).toHaveLength(1);
  expect(forecast[0]).toMatchObject({amount:45,name:"Sophie's birthday · Art kit"});
  const row=familyFinancialCommitments(canonicalPlanViews([plan],[],[changed]),money)
   .find(r=>r.kind==="gift")!;
  const paid=recordFamilyCommitmentPayment(money,row,42,"",now)!;
  expect(paid.expenses).toHaveLength(1);
  expect(recordFamilyCommitmentPayment(paid,row,42,"",now)).toBeNull();
  expect(familyForecastCommitments(canonicalPlanViews([plan],[],[changed]),paid)).toHaveLength(0);
  expect(getMoneyOverview(paid,now,[plan]).month.spent).toBe(42);
  expect(plan.occasionPreparation).toEqual(budget());
 });
 it("updates a renamed manual occasion without editing its associated gift records",()=>{
  const oldEvent:FamilyMoment={id:"party",title:"Dinner",date:"2026-11-10",kind:"celebration",annual:false};
  const event=occurrencesForDate([oldEvent],"2026-11-10")[0]!;
  const plan=upsertOccasionFamilyPlan([],event,{budgetJod:50},undefined,"p-1",now).plans[0]!;
  const updated:FamilyMoment={...oldEvent,title:"Family dinner",date:"2026-12-03"};
  const projected=canonicalPlanView(plan,[updated]);
  expect(projected).toMatchObject({id:"p-1",title:"Family dinner",date:"2026-12-03",
   sourceRef:"occasion:party@2026"});
  expect(plan.title).toBe("Dinner");
  expect(plan.date).toBe("2026-11-10");
 });
 it("never treats a deleted birthday as a newly created occasion or erases a saved plan/payment",()=>{
  const plan=initial();
  expect(canonicalOccasionForPlan(plan,[])).toBeNull();
  expect(canonicalPlanView(plan,[])).toBe(plan);
  expect(occasionLink(plan)).toEqual({momentId:"member-birthday:daughter",year:"2026"});
  expect(canonicalFamilyMoments([],[])).toEqual([]);
 });
 it("keeps separate people with the same birthday, and rejects non-existent leap-day occurrences",()=>{
  const sibling:Member={...child,id:"son",name:"Faris"};
  expect(canonicalFamilyMoments([],[child,sibling])).toHaveLength(2);
  const leap:Member={...child,birthdayMonthDay:"02-29"};
  const plan={...initial(),sourceRef:"occasion:member-birthday:daughter@2027"};
  expect(canonicalOccasionForPlan(plan,canonicalFamilyMoments([],[leap]))).toBeNull();
  const leap2028={...plan,sourceRef:"occasion:member-birthday:daughter@2028"};
  expect(canonicalOccasionForPlan(leap2028,canonicalFamilyMoments([],[leap]))?.occursOn).toBe("2028-02-29");
 });
});
