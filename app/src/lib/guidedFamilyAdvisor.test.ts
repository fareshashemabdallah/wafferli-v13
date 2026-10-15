import {describe,expect,it} from "vitest";
import {answerFamilyQuestion,detectAdvisorIntent,guidedPrompts} from "./guidedFamilyAdvisor";
import {sampleMoney,sampleMembers,type MoneyState} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";
import type {FamilyMoment} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";
const now=new Date(2026,9,15,12);
const money:MoneyState={...sampleMoney(),demo:false,income:2200,
 cashOnHand:1200,cashReserve:300,cashUpdatedAt:"2026-10-15",
 commitments:[{id:"rent",name:"Rent",frequency:"once",amount:500,dueDate:"2026-10-19"}],
 incomeSources:[{id:"salary",name:"Salary",amount:2200,frequency:"monthly",nextDate:"2026-11-01",shared:true}]
};
const args=(overrides:Record<string,unknown>={})=>({
 money,members:sampleMembers(),moments:[] as FamilyMoment[],plans:[] as FamilyPlan[],
 preferences:defaultFamilyPreferences,now,...overrides
});
describe("family question advisor",()=>{
 it("supports English and Arabic family intents",()=>{
  expect(detectAdvisorIntent("What is due this week?")).toBe("bills");
  expect(detectAdvisorIntent("كيف الفواتير عنا")).toBe("bills");
  expect(detectAdvisorIntent("سعر مشتريات الأطفال")).toBe("family");
  expect(detectAdvisorIntent("How much have we saved?")).toBe("savings");
  expect(detectAdvisorIntent("Our cash balance safe?")).toBe("safety");
  expect(guidedPrompts).toHaveLength(6);
 });
 it("never passes demo figures as real household safety data",()=>{
  const a=answerFamilyQuestion("Is our spending safe?",args({money:sampleMoney()}));
  expect(a.intent).toBe("safety");
  expect(a.textEn).toMatch(/Sample numbers|sample/i);
  expect(a.textEn).not.toMatch(/may cover|safe to spend/i);
 });
 it("prioritizes outstanding cash-flow risk without asserting a bank balance",()=>{
  const a=answerFamilyQuestion("Is our spending safe?",args({money:{
   ...money,cashOnHand:100,cashReserve:200
  }}));
  expect(a.textEn).toMatch(/shortfall/i);
  expect(a.route).toBe("/money");
 });
 it("identifies upcoming bills but avoids verified payment claims",()=>{
  const a=answerFamilyQuestion("What bills need attention?",args());
  expect(a.textEn).toContain("Rent");
  expect(a.textEn).toContain("not verified");
  expect(a.sourceEn).toContain("Money");
 });
 it("ignores sample profile birthdays and uses only recorded real events",()=>{
  const a=answerFamilyQuestion("What's coming up for the children?",args());
  expect(a.textEn).toMatch(/No birthday or calendar event/);
  const b=answerFamilyQuestion("What's coming up for the children?",args({
   moments:[{id:"real",title:"School concert",date:"2026-10-20",kind:"school",annual:false}]
  }));
  expect(b.textEn).toContain("School concert");
  expect(b.textEn).not.toContain("Child (sample)");
 });
 it("does not invent unentered store prices or a confirmed savings figure",()=>{
  const a=answerFamilyQuestion("How can we buy more wisely?",args());
  expect(a.textEn).toContain("manually entered");
  expect(a.textEn).toContain("not verified");
 });
 it("clearly discloses unsupported open questions and no connected AI",()=>{
  const a=answerFamilyQuestion("Tell me the best pediatrician in Amman",args());
  expect(a.intent).toBe("unsupported");
  expect(a.textEn).toContain("cannot");
  expect(a.sourceEn).toContain("no external AI");
 });
});
