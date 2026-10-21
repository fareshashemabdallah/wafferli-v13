import {describe,it,expect} from "vitest";
import {emptyRealMoney} from "./moneyOverview";
import {computeMoney,type MoneyState} from "./money";
import {saveFamilyCategory,pictureCategories,visualGroupOf,iconForCategory} from "./familyCategoryCards";
import {effectiveCategoryAllowance} from "./monthAwareMoney";
const base=():MoneyState=>({...emptyRealMoney(),income:1500,categories:[
 {id:"groc",name:"Groceries",planned:300,type:"variable",priority:"essential"},
 {id:"school",name:"School fees",planned:250,type:"fixed",priority:"essential"}
], expenses:[{id:"expense-1",date:"2026-10-18",categoryId:"groc",amount:45,status:"paid",shared:false}],
 commitments:[{id:"bill-1",name:"Groceries subscription",amount:15,frequency:"monthly",dueDate:"2026-11-01",categoryId:"groc"}],
 spendingPaces:[{categoryId:"groc",intervalDays:7,nextDate:"2026-10-28"}],
 categoryMonthlyPlans:{"2026-11":{groc:350}},
 budgetItems:[{id:"item-1",categoryId:"groc",name:"Weekly staples",enabled:true,amountJod:50,frequency:"monthly",behaviour:"variable",priority:"essential"}]
});
describe("illustrated Money category management",()=>{
 it("renames a category without changing its ID, expense history, bill references, pace or seasonal amounts",()=>{
  const first=base();
  const result=saveFamilyCategory(first,{id:"groc",name:"Supermarket",planned:425,type:"variable",
   priority:"essential",visualGroup:"groceries",visualIcon:"groceries"},"ignored");
  expect(result.ok).toBe(true);
  if(!result.ok)return;
  const next=result.state;
  expect(next.categories.find(x=>x.id==="groc")).toMatchObject({name:"Supermarket",planned:425,visualGroup:"groceries"});
  expect(visualGroupOf(next.categories.find(x=>x.id==="groc")!)).toBe("groceries");
  expect(pictureCategories(next,"groceries")).toHaveLength(1);
  expect(next.expenses).toEqual(first.expenses);
  expect(next.commitments).toEqual(first.commitments);
  expect(next.budgetItems).toEqual(first.budgetItems);
  expect(next.spendingPaces).toEqual(first.spendingPaces);
  expect(effectiveCategoryAllowance(next,"groc","2026-11")).toBe(350);
  expect(computeMoney(next,new Date(2026,9,19)).spentBy("groc")).toBe(45);
  expect(first.categories[0]?.name).toBe("Groceries");
 });
 it("adds unlimited kinds of real family categories using stable IDs and custom pictures",()=>{
  const before=base();
  const draft={name:"Nanny",planned:300,type:"fixed" as const,visualGroup:"custom" as const,visualIcon:"household" as const,
   priority:"protected" as const};
  const result=saveFamilyCategory(before,draft,"custom-1");
  expect(result.ok).toBe(true);
  if(!result.ok)return;
  expect(result.state.categories).toHaveLength(3);
  expect(result.state.categories.at(-1)).toMatchObject({id:"custom-1",...draft});
  expect(iconForCategory(result.state.categories.at(-1)!)).toBe("household");
  expect(pictureCategories(result.state,"groceries")).toHaveLength(1);
  expect(result.state.expenses).toEqual(before.expenses);
 });
 it("rejects duplicate names, missing records, invalid amounts and budget below itemized costs",()=>{
  const before=base();
  const draft={name:"Groceries",planned:100,type:"variable" as const,visualGroup:"custom" as const,visualIcon:"other" as const};
  expect(saveFamilyCategory(before,draft,"new").ok).toBe(false);
  expect(saveFamilyCategory(before,{...draft,name:"New",planned:50.555},"new")).toMatchObject({ok:false,reason:"amount"});
  expect(saveFamilyCategory(before,{...draft,id:"missing",name:"Missing"},"new")).toMatchObject({ok:false,reason:"missing"});
  expect(saveFamilyCategory(before,{...draft,id:"groc",name:"Groceries",planned:49},"new")).toMatchObject({ok:false,reason:"item-minimum"});
  expect(saveFamilyCategory({...before,demo:true},{...draft,name:"New"},"new")).toMatchObject({ok:false,reason:"demo"});
  expect(before.expenses).toHaveLength(1);
 });
 it("retains legacy picture grouping by name until the category is first explicitly edited",()=>{
  const old=base().categories[0]!;
  expect(visualGroupOf(old)).toBe("groceries");
  const changed=saveFamilyCategory(base(),{id:"groc",name:"Monthly supermarket",planned:310,
   type:"variable",visualGroup:visualGroupOf(old),visualIcon:iconForCategory(old)},"ignored");
  expect(changed.ok).toBe(true);
  if(changed.ok)expect(visualGroupOf(changed.state.categories[0]!)).toBe("groceries");
 });
});
