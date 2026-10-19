import {describe,it,expect} from "vitest";
import {decideFamilyNextSteps,scenarioFromQuestion,publicDecisionInvitation,planFromDecision,futureFamilyMilestones} from "./sixPillarDecisionEngine";
import {plannedOutingMoments} from "./activityPlanBridge";
import {sampleMoney,sampleMembers,type Member,type MoneyState} from "./money";
import {defaultFamilyPreferences,type FamilyPreferences} from "./familyPreferences";
import type {FamilyMoment} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";
const now=new Date(2026,9,19,12);
const members:Member[]=[
 {id:"a",name:"Alice Private",role:"child",ageGroup:"",prefs:"",ageYears:2},
 {id:"b",name:"Bob Private",role:"child",ageGroup:"",prefs:"",ageYears:8},
 {id:"c",name:"Chris Private",role:"child",ageGroup:"",prefs:"",ageYears:14}
];
const prefs:FamilyPreferences={...defaultFamilyPreferences,protectedFamilyValues:["family-time","education"],
 discoveryPriority:"balance",decisionLearningEnabled:false};
const money=():MoneyState=>({...sampleMoney(),demo:false,income:500,incomeKnown:true,savingsPct:0,
 categories:[
  {id:"essential",name:"Rent private",planned:600,type:"fixed",priority:"essential"},
  {id:"protected",name:"Child lessons private",planned:30,type:"fixed",priority:"protected"},
  {id:"flexible",name:"Restaurants private",planned:50,type:"variable",priority:"flexible"}
 ],expenses:[],cashOnHand:null});
const calendar:FamilyMoment[]=[{id:"party",title:"Private birthday",date:"2026-11-02",kind:"birthday",annual:false}];
const plans:FamilyPlan[]=[];
const context=()=>({money:money(),members,moments:calendar,plans,preferences:prefs,now});
describe("six-pillar family decisions",()=>{
 it("detects only common topics and respects explicit overrides in the UI",()=>{
  expect(scenarioFromQuestion("football lessons and school fees")).toBe("activity");
  expect(scenarioFromQuestion("birthday gift ideas")).toBe("occasion");
  expect(scenarioFromQuestion("family park this weekend")).toBe("outing");
  expect(scenarioFromQuestion("price of groceries")).toBe("purchase");
  expect(scenarioFromQuestion("a complex unrelated question")).toBeNull();
 });
 it("considers real siblings without sample names and upcoming family moments",()=>{
  const result=decideFamilyNextSteps("outing",context());
  expect(result.familyEn).toContain("2, 8, 14");
  expect(result.familyEn).not.toContain("sample");
  expect(result.upcomingEn).toContain("2026-11-02");
  expect(futureFamilyMilestones(context())[0]?.title).toBe("Private birthday");
 });
 it("protects essentials and important categories instead of pretending low income can be managed away",()=>{
  const result=decideFamilyNextSteps("activity",context());
  expect(result.realityEn).toContain("essential costs");
  expect(result.protectedEn).toContain("Child lessons private");
  expect(result.protectedEn).toContain("Education");
  expect(result.options[0]?.id).toBe("stage");
  expect(result.verifiedProviders).toBe(false);
  expect(result.unknownsEn.join(" ")).toContain("verify");
 });
 it("never uses sample finances to approve affordability, with or without a proposed cost",()=>{
  const c=context();
  const noData=decideFamilyNextSteps("outing",{...c,money:sampleMoney(),estimatedJod:75});
  expect(noData.realityEn).toContain("sample data");
  expect(noData.realityEn.toLowerCase()).not.toContain("safe to spend");
 });
 it("respects explicit quality, affordability and local feedback without income-class labels",()=>{
  const c=context();
  const balanced=money();
  balanced.income=4000;
  balanced.cashOnHand=3000;
  balanced.categories[0]!.planned=300;
  expect(decideFamilyNextSteps("outing",{...c,money:balanced,preferences:{...prefs,discoveryPriority:"quality"}}).options[0]?.id).toBe("compare");
  expect(decideFamilyNextSteps("outing",{...c,money:balanced,preferences:{...prefs,freeActivitiesFirst:true}}).options[0]?.id).toBe("affordable");
  expect(decideFamilyNextSteps("outing",{...c,money:balanced,preferences:{
   ...prefs,discoveryPriority:"balance",decisionLearningEnabled:true,
   decisionFeedback:{outing:{affordable:3}}
  }}).options[0]?.id).toBe("affordable");
 });
 it("creates safe-to-share generic invitations without family records, amounts or child ages",()=>{
  const english=publicDecisionInvitation("outing","stage",false);
  const arabic=publicDecisionInvitation("occasion","compare",true);
  for(const x of [english,arabic]){
   expect(x).not.toMatch(/Alice|Bob|Chris|Rent private|salary|500|2026-11-02|14|8/);
  }
  expect(english).toContain("Dabberna");
  expect(arabic).toContain("دبّرنا");
 });
 it("saves only a tentative idea; dated activities, occasions and purchases are derived from a single plan",()=>{
  for(const scenario of ["outing","activity","occasion","purchase"] as const){
   const plan=planFromDecision({scenario,approach:"compare",amount:24,date:"2026-11-08"},"plan-"+scenario,now);
   expect(plan?.status).toBe("planning");
   expect(plan?.budgetJod).toBe(24);
   expect(plan).not.toHaveProperty("expenseId");
   expect(plan).not.toHaveProperty("actualJod");
   expect(plannedOutingMoments([plan!])).toHaveLength(1);
   expect(plannedOutingMoments([])).toEqual([]);
  }
  expect(planFromDecision({scenario:"occasion",approach:"stage",date:"2026-02-30"},"bad",now)).toBeNull();
  expect(planFromDecision({scenario:"outing",approach:"compare",amount:-5},"bad2",now)).toBeNull();
 });
});
