import {describe,expect,it} from "vitest";
import {assessFinancialReality} from "./financialReality";
import {applyStarterBudget,needsStarterBudget} from "./starterBudget";
import {emptyRealMoney} from "./moneyOverview";
import {familyFinancialSummary,familyForecastCommitments} from "./familyFinancialCommitments";
import {getFinancialReadiness} from "./financialReadiness";
import {occasionBudgetAdvice} from "./occasionPreparation";
import {memberBirthdayMoments} from "./familyCalendar";
import type {MoneyState,Member} from "./money";
import type {FamilyPlan} from "./familyPlans";

const today=new Date(2026,9,17,12);
const sample=()=>emptyRealMoney();
const real=(income:number,essential:number,other:number,savings=0)=>
 applyStarterBudget(sample(),{income,spending:essential+other,essential,other,savings,approximateIncome:true,
  zeroIncomeConfirmed:income===0});
const occasion:FamilyPlan={
 id:"b1",title:"Birthday",kind:"occasion",status:"planning",date:"2027-02-17",
 createdAt:"2026-10-17T10:00:00.000Z",updatedAt:"2026-10-17T10:00:00.000Z",
 occasionPreparation:{
  gift:{description:"Gift",amountJod:120,dueDate:"2026-11-20",certainty:"idea"},
  celebration:{amountJod:200,dueDate:"2026-10-25",certainty:"firm"},
  extras:{amountJod:30,dueDate:"2026-11-10",certainty:"planned"}
 }
};
describe("Dabberna financial reality and respectful data collection",()=>{
 it("recognizes an essential-income gap without confusing it with a savings failure",()=>{
  const m=real(900,1200,0);
  const a=assessFinancialReality(m,[],today);
  expect(a.kind).toBe("essentials-gap");
  expect(a.knownIncomeJod).toBe(900);
  expect(a.essentialJod).toBe(1200);
  expect(a.savingsIntentionJod).toBe(0);
  expect(a.messageEn).toContain("300.00 JOD");
  expect(getFinancialReadiness(m,today).savingsReady).toBe(true);
 });
 it("shows ordinary plan pressure differently from an essential-cost structural gap",()=>{
  const a=assessFinancialReality(real(1200,850,550),[],today);
  expect(a.kind).toBe("plan-gap");
  expect(a.essentialJod).toBe(850);
  expect(a.plannedGapJod).toBe(-200);
 });
 it("never presumes legacy unlabeled cost categories are safe to cut",()=>{
  const m:MoneyState={...real(2000,800,300),categories:[{id:"v",name:"Restaurants",type:"variable",planned:300}]};
  const a=assessFinancialReality(m,[],today);
  expect(a.kind).toBe("unknown");
  expect(a.unclassifiedJod).toBe(300);
 });
 it("accepts explicitly verified zero household income and zero savings",()=>{
  const m=real(0,250,0);
  expect(m.demo).toBe(false);
  expect(m.incomeKnown).toBe(true);
  expect(m.savingsTargetAmount).toBe(0);
  expect(needsStarterBudget(m)).toBe(false);
  expect(assessFinancialReality(m,[],today).kind).toBe("essentials-gap");
  expect(applyStarterBudget(sample(),{income:0,spending:250,savings:0})).toEqual(sample());
 });
 it("preserves pre-existing real bills, expense entries and cash when adding new estimates",()=>{
  const old={...sample(),cashOnHand:1000,
   expenses:[{id:"paid1",date:"2026-10-10",amount:55,categoryId:"school",shared:true}],
   commitments:[{id:"rent1",name:"Rent",amount:400,frequency:"once" as const,dueDate:"2026-10-30"}]};
  const next=applyStarterBudget(old,{income:1700,spending:1500,essential:1100,other:400,savings:0});
  expect(next.cashOnHand).toBe(1000);
  expect(next.commitments).toEqual(old.commitments);
  expect(next.expenses).toEqual(old.expenses);
  expect(next.categories.map(c=>c.priority)).toEqual(["essential","flexible"]);
 });
 it("keeps tentative ideas out of required bill cash forecasts and preparation amounts",()=>{
  const m=real(1500,700,250);
  expect(familyForecastCommitments([occasion],m).map(x=>x.amount)).toEqual([200,30]);
  expect(familyFinancialSummary([occasion],m,today)).toMatchObject({
   possibleIdeasJod:120,upcomingTotalJod:230,monthlyPreparationJod:215
  });
  const byDate=assessFinancialReality({...m,cashOnHand:100,cashReserve:20},[occasion],today);
  expect(byDate.forecastCashRisk).toBe(true);
 });
 it("does not infer that all essential bills have been reviewed from a scheduled birthday alone",()=>{
  const money=real(1600,800,250);
  const r=getFinancialReadiness(money,today,[occasion]);
  expect(r.billsReviewed).toBe(false);
  expect(r.next).toBe("cash");
  const withCash={...money,cashOnHand:1000,cashUpdatedAt:"2026-10-17"};
  expect(getFinancialReadiness(withCash,today,[occasion]).next).toBe("bills");
  expect(getFinancialReadiness({...withCash,noBillsConfirmedMonth:"2026-10"},today,[occasion]).billsReviewed).toBe(true);
 });
 it("recognizes zero income in event budget advice as a genuine essential-cost shortfall",()=>{
  const money=real(0,250,0);
  const a=occasionBudgetAdvice(occasion.occasionPreparation!,money,today);
  expect(a.status).toBe("essentials-gap");
 });
 it("stores only a birthday month and day when parents do not supply a birth year",()=>{
  const person:Member={id:"child1",name:"Child",role:"child",ageGroup:"",prefs:"",birthdayMonthDay:"02-29"};
  const b=memberBirthdayMoments([person]);
  expect(b).toHaveLength(1);
  expect(b[0]?.date).toBe("2000-02-29");
  expect(b[0]?.annual).toBe(true);
  expect(person.birthday).toBeUndefined();
 });
 it("does not call an unreviewed zero-estimate category safe to cut",()=>{
  const m={...real(1500,100,100),categories:[
   {id:"unknown",name:"Unreviewed cost",type:"variable" as const,planned:0}
  ]};
  const assessment=assessFinancialReality(m,[],today);
  expect(assessment.kind).toBe("unknown");
  expect(assessment.unclassifiedJod).toBe(0);
  expect(assessment.unclassifiedCategoryCount).toBe(1);
  expect(assessment.essentialJod).toBeNull();
 });
 it("flags preparation needed for known family occasions without adding duplicate expenses",()=>{
  const m=real(1000,700,250);
  const assessment=assessFinancialReality(m,[occasion],today);
  expect(assessment.kind).toBe("room");
  expect(assessment.familyUpcomingJod).toBe(230);
  expect(assessment.familyMonthlyPreparationJod).toBe(215);
  expect(assessment.titleEn).toContain("occasions");
  expect(assessment.messageEn).toContain("categories already include");
  expect(assessment.plannedGapJod).toBe(50);
  expect(m.expenses).toHaveLength(0);
 });
});
