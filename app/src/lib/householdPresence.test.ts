import {describe,expect,it} from "vitest";
import type {MoneyState,Member} from "./money";
import {
 emptyHouseholdPresence,exampleHelper,exampleGuest,
 guestDaysInMonth,estimateHouseholdPresence,applyHouseholdPresenceBudget,
 type HouseholdPresence
} from "./householdPresence";
const members:Member[]=[
 {id:"dad",name:"Dad",role:"adult",ageGroup:"30–44",prefs:""},
 {id:"child",name:"Child",role:"child",ageGroup:"6–12",prefs:""}
];
const money=():MoneyState=>({
 demo:false,income:1400,savingsPct:0,
 categories:[{id:"rent",name:"Rent",type:"fixed",planned:400,priority:"essential"}],
 expenses:[{id:"paid",date:"2026-10-10",categoryId:"rent",amount:400,status:"paid",shared:true}],
 cashOnHand:700,commitments:[{id:"rentbill",name:"Rent",amount:400,frequency:"monthly",dueDate:"2026-10-21",categoryId:"rent"}]
});
describe("Household helper and guest planning",()=>{
 it("does not count demo profiles and never manufactures family expense estimates",()=>{
  const p=emptyHouseholdPresence();
  const fake=[{id:"m1",name:"Me (sample)",role:"adult" as const,ageGroup:"30–44",prefs:""}];
  const e=estimateHouseholdPresence(p,fake,"2026-10");
  expect(e.adults).toBeNull();
  expect(e.permanentResidents).toBeNull();
  expect(e.total).toBe(0);
 });
 it("counts permanent family profiles once; live-in helper salary and food are independent",()=>{
  const p:HouseholdPresence={...emptyHouseholdPresence(),
   helpers:[{...exampleHelper(),id:"h",salaryMonthly:300,foodDaily:3,utilitiesMonthly:12,suppliesMonthly:13}]
  };
  const e=estimateHouseholdPresence(p,members,"2026-10");
  expect(e.permanentResidents).toBe(3);
  expect(e.helperSalary).toBe(300);
  expect(e.helperFood).toBe(93);
  expect(e.helperUtilities+e.helperSupplies).toBe(25);
  expect(e.total).toBe(418);
 });
 it("daytime helper food follows working days, not full month",()=>{
  const p={...emptyHouseholdPresence(),helpers:[{...exampleHelper(),id:"h",arrangement:"daytime" as const,
   workDaysMonthly:12,salaryMonthly:200,foodDaily:2,utilitiesMonthly:0,suppliesMonthly:0}]};
  const e=estimateHouseholdPresence(p,members,"2026-10");
  expect(e.helperFood).toBe(24);
  expect(e.helperSalary).toBe(200);
  expect(e.permanentResidents).toBe(2);
 });
 it("allocates a cross-month visit only to overlapping dates (both endpoints inclusive)",()=>{
  const guest={...exampleGuest(),id:"g",startDate:"2026-10-29",endDate:"2026-11-03",count:2,
   foodDaily:3,utilitiesDaily:0.5,otherDaily:0};
  const p={...emptyHouseholdPresence(),guests:[guest]};
  expect(guestDaysInMonth(guest,"2026-10")).toBe(3);
  expect(guestDaysInMonth(guest,"2026-11")).toBe(3);
  expect(guestDaysInMonth(guest,"2026-12")).toBe(0);
  expect(estimateHouseholdPresence(p,members,"2026-10").temporaryGuests).toBe(21);
  expect(estimateHouseholdPresence(p,members,"2026-11").temporaryGuests).toBe(21);
  expect(estimateHouseholdPresence(p,members,"2026-12").temporaryGuests).toBe(0);
 });
 it("recurring and permanent guests affect months without becoming family profiles",()=>{
  const p:HouseholdPresence={...emptyHouseholdPresence(),guests:[
   {...exampleGuest(),id:"monthly",pattern:"monthly",count:2,daysMonthly:4,foodDaily:3,utilitiesDaily:0,otherDaily:0},
   {...exampleGuest(),id:"permanent",pattern:"permanent",count:1,foodDaily:2,utilitiesDaily:0,otherDaily:0}
  ]};
  const feb=estimateHouseholdPresence(p,members,"2027-02");
  expect(feb.permanentResidents).toBe(3);
  expect(feb.recurringGuests).toBe(80); // 2 * 4 * 3 + 28 * 2
  expect(feb.temporaryGuests).toBe(0);
  expect(estimateHouseholdPresence(p,members,"2026-10").recurringGuests).toBe(86);
 });
 it("applying budget estimates never creates spending, bills, cash or duplicate categories",()=>{
  const p:HouseholdPresence={...emptyHouseholdPresence(),helpers:[{...exampleHelper(),id:"h"}],
   guests:[{...exampleGuest(),id:"g",count:2,startDate:"2026-10-29",endDate:"2026-11-03"}]};
  const before=money();
  const first=applyHouseholdPresenceBudget(before,p,members,"2026-10");
  expect(first.cashOnHand).toBe(700);
  expect(first.expenses).toEqual(before.expenses);
  expect(first.commitments).toEqual(before.commitments);
  expect(first.categories.find(c=>c.id==="rent")?.planned).toBe(400);
  expect(first.categories.find(c=>c.id==="presence-helper-salary")?.planned).toBe(300);
  expect(first.categories.find(c=>c.id==="presence-helper-living")?.planned).toBeCloseTo(113.35);
  expect(first.categories.find(c=>c.id==="presence-guests-2026-10")?.planned).toBe(0);
  expect(first.monthlyAdjustments?.["2026-10"]?.categoryDeltas["presence-guests-2026-10"]).toBe(21);
  const twice=applyHouseholdPresenceBudget(first,p,members,"2026-10");
  expect(twice.categories).toEqual(first.categories);
  expect(twice.monthlyAdjustments).toEqual(first.monthlyAdjustments);
  expect(first.categories).toHaveLength(4);
 });
 it("month-specific visits do not turn into recurring costs or override unrelated adjustments",()=>{
  const p={...emptyHouseholdPresence(),guests:[{...exampleGuest(),id:"g",
   startDate:"2026-11-04",endDate:"2026-11-06"}]};
  const before=money();
  before.monthlyAdjustments={"2026-11":{savingsDelta:15,categoryDeltas:{rent:10}}};
  const result=applyHouseholdPresenceBudget(before,p,members,"2026-11");
  expect(result.monthlyAdjustments?.["2026-11"]?.savingsDelta).toBe(15);
  expect(result.monthlyAdjustments?.["2026-11"]?.categoryDeltas.rent).toBe(10);
  expect(result.monthlyAdjustments?.["2026-11"]?.categoryDeltas["presence-guests-2026-11"]).toBe(21);
  expect(result.monthlyAdjustments?.["2026-10"]).toBeUndefined();
  expect(result.categories.find(c=>c.id==="presence-guests-2026-11")?.planned).toBe(0);
 });
 it("refuses to apply to demo finances and treats invalid dates as no visit",()=>{
  const p={...emptyHouseholdPresence(),guests:[{...exampleGuest(),id:"g",startDate:"2026-02-30",endDate:"2026-03-04"}]};
  expect(estimateHouseholdPresence(p,members,"2026-02").total).toBe(0);
  const before={...money(),demo:true};
  expect(applyHouseholdPresenceBudget(before,p,members,"2026-02")).toBe(before);
 });
});
