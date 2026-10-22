import {describe,it,expect} from "vitest";
import {removeMoneyCategory} from "./removeMoneyCategory";
import {saveFamilyCategory} from "./familyCategoryCards";
import {computeMoney,type MoneyState} from "./money";
import {emptyRealMoney} from "./moneyOverview";
import {buildFamilyMoneyRhythm} from "./familyMoneyRhythm";

const input=():MoneyState=>({
 ...emptyRealMoney(),income:2000,incomeKnown:true,cashOnHand:1000,
 categories:[{id:"old",name:"School fees",type:"fixed",planned:400},
  {id:"food",name:"Groceries",type:"variable",planned:200}],
 budgetItems:[{id:"lesson",categoryId:"old",name:"School transport",amountJod:75,enabled:true,frequency:"monthly",behaviour:"fixed",priority:"essential"}],
 expenses:[{id:"paid",date:"2026-10-15",categoryId:"old",budgetItemId:"lesson",amount:100,shared:false,status:"paid"}],
 commitments:[{id:"due",name:"School fee due",categoryId:"old",amount:300,dueDate:"2026-11-15",frequency:"once"}],
 spendingPaces:[{categoryId:"old",intervalDays:7,nextDate:"2026-10-23"}],
 categoryMonthlyPlans:{"2026-10":{old:400,food:200}},
 monthlyAdjustments:{"2026-10":{savingsDelta:0,categoryDeltas:{old:15,food:10}}},
});
describe("Remove Money category from single family dashboard",()=>{
 it("removes its allowance, card and spending pace without deleting paid transactions or bills",()=>{
  const before=input();
  const after=removeMoneyCategory(before,"old");
  expect(after.categories.map(c=>c.id)).toEqual(["food"]);
  expect(after.hiddenStarterGroups).toEqual([]);
  expect(after.retiredCategoryNames?.["old"]).toBe("School fees");
  expect(after.spendingPaces).toEqual([]);
  expect(after.expenses).toEqual(before.expenses);
  expect(after.commitments?.[0]).toMatchObject({name:"School fee due",dueDate:"2026-11-15",amount:300});
  expect(after.commitments?.[0]).not.toHaveProperty("categoryId");
  expect(after.categoryMonthlyPlans?.["2026-10"]).toEqual({food:200});
  expect(after.monthlyAdjustments?.["2026-10"]?.categoryDeltas).toEqual({food:10});
  expect(after.budgetItems?.[0]).toMatchObject({id:"lesson",enabled:false});
  expect(after.financialInputsPartial).toBe(true);
  const c=computeMoney(after,new Date(2026,9,22));
  expect(c.spent).toBe(100);
  expect(c.planned).toBe(210);
  expect(c.projected).toBeGreaterThanOrEqual(100);
  const forecast=buildFamilyMoneyRhythm(after,[],"2026-10-22",30);
  expect(forecast.events.some(x=>x.kind==="bill"&&x.label==="School fee due")).toBe(true);
  expect(forecast.events.some(x=>x.id.startsWith("envelope:old:"))).toBe(false);
 });
 it("deletes an unused category and its unneeded item details",()=>{
  const before=input();
  before.expenses=[];before.commitments=[];
  const after=removeMoneyCategory(before,"old");
  expect(after.budgetItems).toEqual([]);
  expect(after.expenses).toEqual([]);
  expect(before.categories).toHaveLength(2);
 });
 it("removes even its starter illustration and allows re-adding it explicitly",()=>{
  const state=input();
  state.categories=[{id:"groc",name:"Groceries",type:"variable",planned:200}];
  const removed=removeMoneyCategory(state,"groc");
  expect(removed.categories).toEqual([]);
  expect(removed.hiddenStarterGroups).toContain("groceries");
  const added=saveFamilyCategory(removed,{name:"Groceries",planned:120,type:"variable",
   visualGroup:"groceries",visualIcon:"groceries"},"newgroc");
  expect(added.ok).toBe(true);
  if(added.ok)expect(added.state.hiddenStarterGroups).not.toContain("groceries");
 });
 it("rejects demo or unknown category removals without touching records",()=>{
  const before=input();
  expect(removeMoneyCategory(before,"unknown")).toBe(before);
  const sample={...before,demo:true};
  expect(removeMoneyCategory(sample,"old")).toBe(sample);
 });
});
