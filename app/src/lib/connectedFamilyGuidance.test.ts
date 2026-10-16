import {describe,expect,it} from "vitest";
import {nextConnectedFamilyAction,personalOutingAdvice,type ConnectedContext} from "./connectedFamilyGuidance";
import {answerFamilyQuestion,detectAdvisorIntent,guidedPrompts} from "./guidedFamilyAdvisor";
import {defaultFamilyPreferences} from "./familyPreferences";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "./money";
import type {FamilyPlan} from "./familyPlans";
import type {FamilyMoment} from "./familyCalendar";
import type {OutingOption} from "./childAwareOutingCompare";
import type {WishlistItem} from "./familyWishlist";
const now=new Date(2026,9,16,12);
const date="2026-10-20";
const event:FamilyMoment={id:"event1",title:"School celebration",date,kind:"school",annual:false};
const plan=(overrides:Partial<FamilyPlan>={}):FamilyPlan=>({
 id:"plan1",title:"Friday family outing",kind:"outing",status:"planning",
 date:"2026-10-18",budgetJod:45,
 createdAt:"2026-10-15T12:00:00Z",updatedAt:"2026-10-15T12:00:00Z",...overrides
});
const gift:WishlistItem={id:"gift1",name:"Birthday story",kind:"gift",status:"considering",
 createdAt:"2026-10-15T12:00:00Z",updatedAt:"2026-10-15T12:00:00Z",
 targetDate:"2026-10-22",budgetJod:20,prices:[]};
const member:Member={id:"child-real",name:"Test child",role:"child",birthday:"2021-10-25",ageGroup:"3-5",prefs:""};
const input=(changes:Partial<ConnectedContext>={}):ConnectedContext=>({
 money:sampleMoney(),members:sampleMembers(),moments:[],plans:[],
 preferences:defaultFamilyPreferences,now,...changes
});
const venue=(name:string,overrides:Partial<OutingOption>={}):OutingOption=>({
 id:name,name,kind:"indoor",checkedOn:"2026-10-15",childAdmission:"yes",
 ageFit:"yes",accessible:"unknown",noise:"quiet",totalEstimatedJod:20,
 distanceKm:5,...overrides
});
describe("connected, device-only family priorities",()=>{
 it("highlights the next saved plan, uses the ceiling and does not treat demo cash as real",()=>{
  const original=input({plans:[plan()],moments:[event]});
  const frozen=JSON.stringify(original);
  const r=nextConnectedFamilyAction(original);
  expect(r.titleEn).toContain("next family plan");
  expect(r.detailEn).toContain("Friday family outing");
  expect(r.detailEn).toContain("2026-10-18");
  expect(r.detailEn).toContain("45.00 JOD");
  expect(r.detailEn).toContain("A safe cost assessment needs completed");
  expect(r.route).toBe("/plans");
  expect(JSON.stringify(original)).toBe(frozen);
 });
 it("chooses the earliest real calendar date, without resurrecting example children",()=>{
  const r=nextConnectedFamilyAction(input({moments:[event],members:[...sampleMembers(),member]}));
  expect(r.titleEn).toContain("next family occasion");
  expect(r.detailEn).toContain("School celebration");
  expect(r.detailEn).toContain(date);
  expect(r.detailEn).not.toContain("Child (sample)");
  expect(r.route).toBe("/occasions");
 });
 it("does not duplicate an occasion-linked plan or complete one without confirmation",()=>{
  const linked=plan({kind:"occasion",title:"School celebration",date,
   sourceRef:"occasion:event1@2026"});
  const next=nextConnectedFamilyAction(input({plans:[linked],moments:[event]}));
  expect(next.titleEn).toContain("family plan");
  expect(next.route).toBe("/plans");
  const done=nextConnectedFamilyAction(input({plans:[{...linked,status:"completed"}],moments:[event]}));
  expect(done.titleEn).toContain("occasion");
  expect(done.detailEn).toContain("already exists");
 });
 it("honors opted-out lifestyle and shopping suggestion settings",()=>{
  const prefs={...defaultFamilyPreferences,lifestyle:false,shoppingTips:false};
  const result=nextConnectedFamilyAction(input({preferences:prefs,plans:[plan({title:"Private outing"})],moments:[event]}));
  expect(result.route).toBe("/space");
  expect(result.detailEn).not.toContain("Private outing");
  expect(result.detailEn).not.toContain("School celebration");
  const q=nextConnectedFamilyAction(input({preferences:{...prefs,shoppingTips:true},wishlist:[gift]}));
  expect(q.detailEn).toContain("Birthday story");
  expect(q.route).toBe("/occasions");
  expect(nextConnectedFamilyAction(input({preferences:{...prefs,shoppingTips:true}})).route).toBe("/explore/smartbuy");
 });
 it("only uses family wishlist in cross-module advice when shopping tips are opted in",()=>{
  expect(nextConnectedFamilyAction(input({wishlist:[gift],preferences:{
   ...defaultFamilyPreferences,shoppingTips:false
  }})).detailEn).not.toContain("Birthday story");
  const on=nextConnectedFamilyAction(input({wishlist:[gift],preferences:{
   ...defaultFamilyPreferences,shoppingTips:true
  }}));
  expect(on.detailEn).toContain("Birthday story");
  expect(on.detailEn.toLowerCase()).toContain("no order or payment");
 });
 it("keeps unscheduled or past plans out of proactive due-date guidance",()=>{
  const withoutDate=plan();
  delete withoutDate.date;
  const result=nextConnectedFamilyAction(input({plans:[
   plan({date:"2026-10-15"}),withoutDate,plan({date:"2026-12-21"})
  ],moments:[event]}));
  expect(result.titleEn).toContain("occasion");
  expect(result.route).toBe("/occasions");
 });
});
describe("connected outing choice with children's needs",()=>{
 const prefs={...defaultFamilyPreferences,city:"Amman",distanceKm:15,outingLimit:45,typicalChildrenAttendance:"yes" as const};
 it("does not propose cheaper child-incompatible venues just to fit budget",()=>{
  const advice=personalOutingAdvice(input({preferences:prefs,members:[member],
   plans:[plan()],outings:[
    venue("Adults only", {childAdmission:"no",totalEstimatedJod:5}),
    venue("Family indoor play", {totalEstimatedJod:30,distanceKm:8})
   ]}));
  expect(advice.detailEn).toContain("Family indoor play");
  expect(advice.detailEn).not.toContain("Adults only");
  expect(advice.detailEn).toContain("Friday family outing");
  expect(advice.detailEn).toContain("45.00 JOD");
  expect(advice.detailEn).toContain("not verified");
  expect(advice.route).toBe("/explore/together");
 });
 it("does not recommend an incompatible venue, even when every option fails",()=>{
  const answer=personalOutingAdvice(input({preferences:prefs,outings:[
   venue("Too costly",{totalEstimatedJod:100}),
   venue("No children allowed",{childAdmission:"no",totalEstimatedJod:2})
  ]}));
  expect(answer.titleEn).toContain("another look");
  expect(answer.detailEn).not.toContain("choose Too costly");
  expect(answer.detailEn).not.toContain("choose No children allowed");
 });
 it("makes no venue, price, forecast or child assumptions with no recorded options",()=>{
  const r=personalOutingAdvice(input());
  expect(r.detailEn).toContain("No venue is saved for comparison yet");
  expect(r.detailEn).toContain("confirm whether children are attending");
  expect(r.detailEn).not.toContain("Family indoor play");
 });
 it("respects lifestyle disabled before consulting saved venues",()=>{
  const r=personalOutingAdvice(input({preferences:{...prefs,lifestyle:false},
   outings:[venue("Private choice")]}));
  expect(r.route).toBe("/space");
  expect(r.detailEn).not.toContain("Private choice");
 });
 it("answers from family records without changing them or uploading anything",()=>{
  const c=input({preferences:prefs,members:[member],outings:[venue("Family indoor play")]});
  const before=JSON.stringify(c);
  const r=answerFamilyQuestion("What outings suit our family?",c);
  expect(r.intent).toBe("outings");
  expect(r.textEn).toContain("Family indoor play");
  expect(r.textEn).toContain("not verified");
  expect(JSON.stringify(c)).toBe(before);
 });
});
describe("local natural family priority questions",()=>{
 it("keeps ten prompts and routes English and Arabic priorities to one next step",()=>{
  expect(guidedPrompts).toHaveLength(10);
  expect(guidedPrompts.some(p=>p.id==="priorities")).toBe(true);
  expect(detectAdvisorIntent("What should we do next for our family?")).toBe("priorities");
  expect(detectAdvisorIntent("شو الأهم للعيلة هالأسبوع؟")).toBe("priorities");
  const c=input({moments:[event]});
  const en=answerFamilyQuestion("What matters most for our family this week?",c);
  expect(en.intent).toBe("priorities");
  expect(en.route).toBe("/occasions");
  const ar=answerFamilyQuestion("شو أهم خطوة للعيلة هالأسبوع؟",c);
  expect(ar.intent).toBe("priorities");
  expect(ar.textAr).toContain("School celebration");
 });
});
