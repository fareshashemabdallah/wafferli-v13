import {describe,expect,it} from "vitest";
import {sampleMoney,type MoneyState,type Member} from "./money";
import {emptyHouseholdPresence,exampleHelper,exampleGuest} from "./householdPresence";
import {
 BUDGET_TEMPLATES,PUBLIC_JORDAN_UNIT_PRICES,
 categoryItemTotal,categoryUnallocated,householdCategoryReference,
 monthlyItemCost,removeBudgetItem,setCategoryPlanFromItems,upsertBudgetItem,
 type BudgetItem
} from "./householdBudgetBuilder";
const people:Member[]=[{id:"parent",name:"Parent",role:"adult",ageGroup:"30–44",prefs:""},
 {id:"child",name:"Child",role:"child",ageGroup:"6–12",prefs:""}];
const base=():MoneyState=>({
 ...sampleMoney(),demo:false,
 categories:[{id:"groc",name:"Groceries",type:"variable",planned:350},
  {id:"fuel",name:"Fuel & transport",type:"variable",planned:150}],
 expenses:[{id:"paid",categoryId:"groc",date:"2026-10-18",amount:100,shared:false,status:"paid"}],
 cashOnHand:600,commitments:[{id:"due",name:"School",amount:120,frequency:"once",dueDate:"2026-11-12"}]
});
const item=(id:string,amountJod:number,categoryId="groc"):BudgetItem=>({
 id,categoryId,name:"Groceries "+id,enabled:true,amountJod,frequency:"monthly",
 behaviour:"variable",priority:"essential"
});
describe("Itemized Money budget",()=>{
 it("only describes existing category envelope; never counts items on top",()=>{
  const before=base();
  const first=upsertBudgetItem(before,item("bread",55));
  const second=upsertBudgetItem(first,item("meat",90));
  expect(categoryItemTotal(second.budgetItems??[],"groc")).toBe(145);
  expect(categoryUnallocated(second,"groc")).toBe(205);
  expect(second.categories.find(c=>c.id==="groc")?.planned).toBe(350);
  expect(second.expenses).toEqual(before.expenses);
  expect(second.commitments).toEqual(before.commitments);
  expect(second.cashOnHand).toBe(600);
 });
 it("editing, disabling and removing items preserves allocations until explicitly approved",()=>{
  let s=upsertBudgetItem(base(),item("bread",80));
  s=upsertBudgetItem(s,item("bread",110));
  expect(s.budgetItems).toHaveLength(1);
  expect(categoryItemTotal(s.budgetItems??[],"groc")).toBe(110);
  expect(categoryUnallocated(s,"groc")).toBe(240);
  s=upsertBudgetItem(s,{...item("bread",110),enabled:false});
  expect(categoryItemTotal(s.budgetItems??[],"groc")).toBe(0);
  expect(s.categories[0]?.planned).toBe(350);
  s=removeBudgetItem(s,"bread");
  expect(s.budgetItems).toEqual([]);
  expect(s.categories[0]?.planned).toBe(350);
 });
 it("parent approval replaces category plan rather than adds a second budget",()=>{
  const original=upsertBudgetItem(base(),item("bread",70));
  const revised=setCategoryPlanFromItems(original,"groc");
  expect(revised.categories[0]?.planned).toBe(70);
  expect(revised.categories[1]?.planned).toBe(150);
  expect(revised.expenses).toEqual(original.expenses);
  expect(revised.commitments).toEqual(original.commitments);
  expect(revised.cashOnHand).toBe(600);
  expect(setCategoryPlanFromItems(revised,"groc").categories[0]?.planned).toBe(70);
 });
 it("annual, quarterly, weekly and quantity × unit price calculations use one source",()=>{
  expect(monthlyItemCost({...item("school",1200),frequency:"yearly"})).toBe(100);
  expect(monthlyItemCost({...item("insurance",300),frequency:"quarterly"})).toBe(100);
  expect(monthlyItemCost({...item("food",30),frequency:"weekly"})).toBe(130);
  const petroleum={...item("petrol",999),quantity:100,unitPriceJod:1.05};
  expect(monthlyItemCost(petroleum)).toBe(105);
  expect(monthlyItemCost({...petroleum,enabled:false})).toBe(0);
 });
 it("never permits editing sample finances or an item in unknown category",()=>{
  const demo=sampleMoney();
  expect(upsertBudgetItem(demo,item("new",70))).toBe(demo);
  expect(setCategoryPlanFromItems(demo,"groc")).toBe(demo);
  const noCategory=base();
  expect(upsertBudgetItem(noCategory,item("wrong",40,"none"))).toBe(noCategory);
 });
});
describe("Household reference transparency",()=>{
 it("is unavailable when household counts are not confirmed or categories lack evidence",()=>{
  const grocery=base().categories[0]!;
  expect(householdCategoryReference(grocery,[],emptyHouseholdPresence(),"2026-10")).toBeNull();
  expect(householdCategoryReference({...grocery,name:"Special religious expenses",id:"misc"},people,emptyHouseholdPresence(),"2026-10")).toBeNull();
 });
 it("responds to parents and children using explicitly labelled illustrative assumptions",()=>{
  const groc=base().categories[0]!;
  const two=householdCategoryReference(groc,people,emptyHouseholdPresence(),"2026-10");
  expect(two?.amountJod).toBe(190);
  expect(two?.basis).toBe("illustrative");
  const four=householdCategoryReference(groc,people,{...emptyHouseholdPresence(),adults:2,children:2},"2026-10");
  expect(four?.amountJod).toBe(355);
  expect(four?.explanation).toMatch(/NOT a verified public-data spending average/);
 });
 it("factors recorded helper/visitor food and utilities into reference, but not salary",()=>{
  const p={...emptyHouseholdPresence(),adults:2,children:1,
   helpers:[{...exampleHelper(),id:"helper",foodDaily:3,salaryMonthly:300,utilitiesMonthly:12}],
   guests:[{...exampleGuest(),id:"visitor",startDate:"2026-10-20",endDate:"2026-10-21",count:2,foodDaily:3,utilitiesDaily:.5,otherDaily:0}]};
  const g=householdCategoryReference(base().categories[0]!,people,p,"2026-10");
  expect(g?.amountJod).toBe(25+210+60+31*3+2*2*3);
  const utilities=householdCategoryReference({id:"utils",name:"Electricity & water",planned:100,type:"fixed"},people,p,"2026-10");
  expect(utilities?.amountJod).toBe(60+2*18+8+12+2*2*.5);
 });
 it("uses official October 2026 government unit prices only for LPG and petrol",()=>{
  expect(PUBLIC_JORDAN_UNIT_PRICES.find(x=>x.key==="petrol90")?.priceJod).toBe(1.05);
  expect(PUBLIC_JORDAN_UNIT_PRICES.find(x=>x.key==="cookinggas")?.priceJod).toBe(7);
  expect(PUBLIC_JORDAN_UNIT_PRICES.every(x=>x.source.includes("memr.gov.jo"))).toBe(true);
  expect(BUDGET_TEMPLATES.food).toContain("Dairy & eggs");
 });
});
