import {describe,it,expect} from "vitest";
import {memberBirthdayMoments,occurrencesForDate} from "./familyCalendar";
import {upsertOccasionFamilyPlan} from "./occasionPlanBridge";
import {selectOccasionGiftSeller,matchesGiftProduct} from "./occasionGiftPurchase";
import {recordFamilyCommitmentPayment,familyFinancialCommitments,familyFinancialSummary} from "./familyFinancialCommitments";
import {emptyRealMoney,getMoneyOverview} from "./moneyOverview";
import type {FamilyPlan} from "./familyPlans";

const now=new Date(2026,9,20,12);
function setup(){
 const event=occurrencesForDate(memberBirthdayMoments([{
  id:"sophia",name:"Sophia",role:"child" as const,ageGroup:"",prefs:"",birthdayMonthDay:"11-12"
 }]),"2026-11-12")[0]!;
 const result=upsertOccasionFamilyPlan([],event,{budgetJod:90},undefined,"birthday-plan",now);
 const plan:FamilyPlan={...result.plans[0]!,occasionPreparation:{
  gift:{description:"Science Kit",amountJod:70,dueDate:"2026-11-05",certainty:"planned"},
  celebration:{amountJod:15,dueDate:"2026-11-10",certainty:"planned"},
  extras:{amountJod:5,dueDate:"2026-11-12",certainty:"planned"}
 }};
 return {event,plan};
}
describe("canonical birthday gift to actual purchase",()=>{
 it("preserves the birthday event and one linked plan when a parent chooses a seller",()=>{
  const {event,plan}=setup();
  expect(event.id).toBe("member-birthday:sophia");
  expect(plan.sourceRef).toBe("occasion:member-birthday:sophia@2026");
  expect(matchesGiftProduct(" Science   Kit ","science kit")).toBe(true);
  const chosen=selectOccasionGiftSeller(plan,"science kit","Family Shop",63.5,true,"2026-10-20",now);
  expect(chosen).not.toBe(plan);
  expect(chosen.occasionPreparation?.gift.selectedQuote).toEqual({
   productName:"science kit",store:"Family Shop",totalJod:63.5,
   checkedByParent:true,parentCheckedOn:"2026-10-20"
  });
  expect(chosen.budgetJod).toBe(90);
  expect(chosen.occasionPreparation?.gift.amountJod).toBe(70);
  expect(chosen.occasionPreparation?.celebration.amountJod).toBe(15);
  expect(chosen.occasionPreparation?.extras.amountJod).toBe(5);
  expect(chosen.date).toBe("2026-11-12");
 });
 it("blocks copying another product, a fictitious price, or invalid future price-check dates",()=>{
  const {plan}=setup();
  expect(selectOccasionGiftSeller(plan,"Other Toy","Family Shop",50,false,undefined,now)).toBe(plan);
  expect(selectOccasionGiftSeller(plan,"Science Kit","Family Shop",0,false,undefined,now)).toBe(plan);
  expect(selectOccasionGiftSeller(plan,"Science Kit","Family Shop",-10,false,undefined,now)).toBe(plan);
  expect(selectOccasionGiftSeller(plan,"Science Kit","Family Shop",50.001,false,undefined,now)).toBe(plan);
  expect(selectOccasionGiftSeller(plan,"Science Kit","Family Shop",50,true,"2026-12-10",now)).toBe(plan);
  expect(selectOccasionGiftSeller(plan,"Science Kit","Family Shop",50,false,"2026-10-20",now)).toBe(plan);
  const completed:FamilyPlan={...plan,status:"completed"};
  expect(selectOccasionGiftSeller(completed,"Science Kit","Family Shop",50,true,"2026-10-20",now)).toBe(completed);
 });
 it("uses selected seller as a reference only; one confirmed payment changes finance once",()=>{
  const {plan}=setup();
  const chosen=selectOccasionGiftSeller(plan,"Science Kit","Family Shop",63.5,false,undefined,now);
  const finances={...emptyRealMoney(),cashOnHand:300,cashReserve:100,expenses:[]};
  expect(getMoneyOverview(finances,now,[chosen]).month.spent).toBe(0);
  expect(familyFinancialSummary([chosen],finances,now).upcomingTotalJod).toBe(90);
  const gift=familyFinancialCommitments([chosen],finances).find(x=>x.kind==="gift")!;
  const paid=recordFamilyCommitmentPayment(finances,gift,60,"",now)!;
  expect(paid.expenses).toHaveLength(1);
  expect(paid.expenses[0]).toMatchObject({
   id:"family-occasion-paid:birthday-plan:gift",amount:60,plannedAmount:70,
   categoryId:"uncategorized",shared:false,sourcePlanId:plan.id,
   sourceOccasionCost:"gift",status:"paid"
  });
  expect(paid.cashOnHand).toBe(300);
  expect(paid.savingsGoals).toBeUndefined();
  expect(familyFinancialSummary([chosen],paid,now).upcomingTotalJod).toBe(20);
  expect(getMoneyOverview(paid,now,[chosen]).month.spent).toBe(60);
  expect(recordFamilyCommitmentPayment(paid,gift,60,"",now)).toBeNull();
  expect(finances.expenses).toHaveLength(0);
  const other=familyFinancialCommitments([chosen],paid).find(x=>x.kind==="celebration")!;
  const otherPaid=recordFamilyCommitmentPayment(paid,other,15,"",now)!;
  expect(otherPaid.expenses).toHaveLength(2);
  expect(otherPaid.expenses[1]?.sourceOccasionCost).toBe("gift");
 });
});
