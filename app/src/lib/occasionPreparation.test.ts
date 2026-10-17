import {describe,expect,it} from "vitest";
import {initialOccasionPreparation,occasionFunding,occasionBudgetAdvice,validateOccasionPreparation} from "@/lib/occasionPreparation";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {upsertOccasionFamilyPlan} from "@/lib/occasionPlanBridge";
import type {FamilyPlan} from "@/lib/familyPlans";
import type {MomentOccurrence} from "@/lib/familyCalendar";

const today=new Date(2026,9,17,12);
const prep=()=>{
 const p=initialOccasionPreparation("2027-02-17");
 p.gift={description:"Science kit",amountJod:120,dueDate:"2026-11-20"};
 p.celebration={amountJod:200,dueDate:"2027-02-03"};
 p.extras={amountJod:30,dueDate:"2027-01-15"};
 return p;
};
describe("one connected occasion plan: funding and budgets",()=>{
 it("distinguishes the gift purchase date, celebration deposit and later extras",()=>{
  const result=occasionFunding(prep(),today);
  expect(result.totalJod).toBe(350);
  expect(result.monthlyJod).toBe(107.5);
  expect(result.lineItems.map(x=>[x.kind,x.months,x.monthlyJod])).toEqual([
   ["gift",2,60],["celebration",5,40],["extras",4,7.5]
  ]);
  expect(result.nextDueDate).toBe("2026-11-20");
  expect(result.overdueAmountJod).toBe(0);
 });
 it("calls out passed preparation deadlines without silently extending funding",()=>{
  const p=prep();p.gift.dueDate="2026-10-10";
  expect(occasionFunding(p,today)).toMatchObject({overdueAmountJod:120});
  expect(occasionFunding(p,today).lineItems[0]).toMatchObject({months:0,monthlyJod:120,overdue:true});
 });
 it("rejects invalid amounts, cents, totals and dates later than the event",()=>{
  const p=prep();
  expect(validateOccasionPreparation(p,"2027-02-17")).toBeNull();
  p.gift.dueDate="2027-02-18";
  expect(validateOccasionPreparation(p,"2027-02-17")).toBe("invalid-deadline");
  p.gift.dueDate="2026-11-20";p.celebration.amountJod=100000;
  expect(validateOccasionPreparation(p,"2027-02-17")).toBe("invalid-total");
  p.celebration.amountJod=200;p.gift.amountJod=1.001;
  expect(validateOccasionPreparation(p,"2027-02-17")).toBe("invalid-amount");
 });
 it("never advises reallocating budgets from demo or financially incomplete household records",()=>{
  expect(occasionBudgetAdvice(prep(),sampleMoney(),today).status).toBe("demo");
  expect(occasionBudgetAdvice(prep(),{...sampleMoney(),demo:false,categories:[]},today).status).toBe("missing-plan");
 });
 it("hints only from entered discretionary categories, never essential school, food or rent",()=>{
  const money:MoneyState={...sampleMoney(),demo:false,income:1200,savingsPct:10,categories:[
   {id:"rent",name:"Rent",type:"fixed",planned:650},
   {id:"school",name:"School fees",type:"periodic",planned:200},
   {id:"groc",name:"Groceries",type:"variable",planned:100},
   {id:"out",name:"Eating out",type:"variable",planned:80},
   {id:"ent",name:"Entertainment",type:"variable",planned:60}
  ],expenses:[]};
  const guidance=occasionBudgetAdvice(prep(),money,today);
  expect(guidance.status).toBe("pressure");
  expect(guidance.monthlyUnallocatedJod).toBe(0);
  expect(guidance.monthlyTargetJod).toBe(107.5);
  // A category name alone is not consent to reduce family life.
  expect(guidance.hints).toEqual([]);
  expect(guidance.notCoveredJod).toBe(107.5);
  const reviewed={...money,categories:money.categories.map(c=>c.id==="out"||c.id==="ent"?{...c,priority:"flexible" as const}:c)};
  const personalized=occasionBudgetAdvice(prep(),reviewed,today);
  expect(personalized.hints.map(h=>h.categoryId)).toEqual(["out","ent"]);
  expect(personalized.hints.map(h=>h.reviewJod)).toEqual([80,27.5]);
  expect(personalized.notCoveredJod).toBe(0);
  expect(money.categories.find(x=>x.id==="out")?.planned).toBe(80);
  expect(money.expenses).toEqual([]);
 });
 it("legacy occasion ideas cannot override a plan whose gift and celebration costs were already entered",()=>{
  const event:MomentOccurrence={id:"member-birthday:sophia",title:"Sophia's birthday",date:"2027-02-17",occursOn:"2027-02-17",annual:true,kind:"birthday"};
  const existing:FamilyPlan={id:"plan1",kind:"occasion",title:event.title,date:event.occursOn,
   sourceRef:"occasion:member-birthday:sophia@2027",status:"planning",budgetJod:350,
   occasionPreparation:prep(),createdAt:today.toISOString(),updatedAt:today.toISOString()};
  const result=upsertOccasionFamilyPlan([existing],event,{budgetJod:100},undefined,"id2",today);
  expect(result.plans).toHaveLength(1);
  expect(result.plans[0]!.budgetJod).toBe(350);
  expect(result.plans[0]!.occasionPreparation).toEqual(prep());
 });
});
