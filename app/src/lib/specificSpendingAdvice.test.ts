import {describe,expect,it} from "vitest";
import {explicitJodAmount,explainSpecificSpending} from "./specificSpendingAdvice";
import {answerFamilyQuestion} from "./guidedFamilyAdvisor";
import {sampleMoney,sampleMembers,type MoneyState} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";

const now=new Date(2026,9,16,12);
const money=():MoneyState=>({...sampleMoney(),demo:false,income:2000,
 cashOnHand:1000,cashReserve:300,cashUpdatedAt:"2026-10-16",
 incomeSources:[{id:"salary",name:"Salary",amount:2000,frequency:"monthly",nextDate:"2026-10-30",shared:true}],
 commitments:[{id:"school",name:"School bill",amount:300,frequency:"once",dueDate:"2026-10-20"}]
});
const ctx=(m=money())=>({money:m,members:sampleMembers(),moments:[],plans:[],
 preferences:defaultFamilyPreferences,now});

describe("explicit amount financial question",()=>{
 it("understands only explicitly labeled Jordanian dinars in English and Arabic",()=>{
  expect(explicitJodAmount("Can we afford 75 JOD for a gift?")).toBe(75);
  expect(explicitJodAmount("Can we afford JOD 25.50 for a school trip?")).toBe(25.5);
  expect(explicitJodAmount("هل فينا ندفع ٥٠ دينار للطلعة؟")).toBe(50);
  expect(explicitJodAmount("هل ميزانيتنا بتسمح بطلعة تكلف ١٢٫٥٠ دينار؟")).toBe(12.5);
  expect(explicitJodAmount("Can we afford 1,500.50 JOD?")).toBe(1500.5);
  expect(explicitJodAmount("٣٬٥٠٠ دينار")).toBe(3500);
  expect(explicitJodAmount("۱۰ دينار")).toBe(10);
 });
 it("never interprets age, date, a second price or another currency as a JOD spend",()=>{
  expect(explicitJodAmount("Can we take 3 children aged 5 and 7?")).toBeNull();
  expect(explicitJodAmount("Can we afford 20 or 40 JOD?")).toBe(40); // Only the explicitly labeled amount is understood
  expect(explicitJodAmount("50 JOD or 70 JOD")).toBeNull();
  expect(explicitJodAmount("Can we afford 60 USD?")).toBeNull();
  expect(explicitJodAmount("Can we afford 0 JOD?")).toBeNull();
  expect(explicitJodAmount("Can we afford 200000 JOD?")).toBeNull();
  expect(explicitJodAmount("Can we afford 22.456 JOD?")).toBeNull();
  expect(explicitJodAmount("Can we afford 12,50 JOD?")).toBeNull();
 });
 it("uses the same conservative money forecast rather than promising bank affordability",()=>{
  const s=money(),before=JSON.stringify(s);
  const low=explainSpecificSpending(s,100,now);
  expect(low.outcome).toBe("provisional");
  expect(low.detailEn).toContain("100.00 JOD");
  expect(low.detailEn).toContain("NOT confirmation");
  expect(low.detailEn).toContain("unrecorded daily costs");
  const high=explainSpecificSpending(s,650,now);
  expect(high.outcome).toBe("review");
  expect(high.detailEn).toContain("650.00 JOD");
  expect(high.detailEn).toContain("reserve");
  expect(JSON.stringify(s)).toBe(before);
 });
 it("honestly asks for missing real finances and never turns demo data into advice",()=>{
  const missing=explainSpecificSpending({...money(),cashOnHand:null},20,now);
  expect(missing.outcome).toBe("unknown");
  expect(missing.detailEn).toContain("cash balance");
  const demo=explainSpecificSpending(sampleMoney(),20,now);
  expect(demo.outcome).toBe("unknown");
  expect(demo.detailEn).toContain("Demo finances");
  expect(demo.detailAr).toContain("التجريبية");
 });
 it("runs through the actual local family Q&A route in both languages",()=>{
  const ask=answerFamilyQuestion("Can we afford 65 JOD for our children this weekend?",ctx());
  expect(ask.intent).toBe("safety");
  expect(ask.textEn).toContain("65.00 JOD");
  expect(ask.sourceEn).toContain("Money");
  expect(ask.route).toBe("/money");
  const ar=answerFamilyQuestion("هل ميزانية العيلة بتسمح بطلعة تكلف ٦٥ دينار؟",ctx());
  expect(ar.intent).toBe("safety");
  expect(ar.textAr).toContain("65.00");
  expect(ar.textAr).toContain("غير المسجلة");
  expect(answerFamilyQuestion("What outings suit our family?",ctx()).intent).toBe("outings");
 });
});
