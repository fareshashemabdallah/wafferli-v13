import {describe,it,expect} from "vitest";
import {render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {emptyRealMoney} from "./moneyOverview";
import {localToday} from "./cashflow";
import type {MoneyState} from "./money";
import {buildFamilyMoneyRhythm} from "./familyMoneyRhythm";
import {spendingBreakdown} from "./spendingGroups";
import {addCategoryItem,recordCategoryPayment,saveCategoryDueDate} from "./unifiedCategoryLedger";
import {UnifiedCategoryDetails} from "@/components/UnifiedCategoryDetails";

const budget=():MoneyState=>({...emptyRealMoney(),cashOnHand:1500,
 categories:[{id:"groc",name:"Groceries",planned:1200,type:"variable",remainderRole:"necessary"}],
 commitments:[],expenses:[],budgetItems:[]});
describe("Category budget, classification and forecast integrity",()=>{
 it("keeps unsplit groceries essential when a family adds a more detailed line",()=>{
  const state=addCategoryItem(budget(),{id:"organic",categoryId:"groc",name:"Organic treats",
   amountJod:300,frequency:"monthly",enabled:true,behaviour:"variable",priority:"flexible",spendingRole:"flexible"});
  expect(state.categories[0]?.remainderRole).toBe("necessary");
  const view=spendingBreakdown(state,"2026-10");
  expect(view.totalPlanned).toBe(1200);
  expect(view.groups.map(x=>x.planned)).toEqual([0,900,300]);
  expect(view.unassigned).toEqual([]);
  expect(state.expenses).toEqual([]);
 });
 it("counts a linked dated bill once but still forecasts other category spending",()=>{
  const state=saveCategoryDueDate(budget(),{id:"grocery-bill",name:"Grocery subscription",
   amount:100,categoryId:"groc",dueDate:"2026-10-27",frequency:"once"});
  const forecast=buildFamilyMoneyRhythm(state,[],"2026-10-20",30);
  const oct=forecast.events.filter(e=>e.date.startsWith("2026-10"));
  expect(oct.filter(e=>e.kind==="bill").reduce((a,e)=>a-e.amountJod,0)).toBe(100);
  expect(oct.filter(e=>e.kind==="pace"&&e.categoryId==="groc")
   .reduce((a,e)=>a-e.amountJod,0)).toBe(1100);
  expect(state.categories[0]?.planned).toBe(1200);
 });
 it("a partially settled October bill reduces the forecast only by its unpaid balance",()=>{
  const entered=saveCategoryDueDate(budget(),{id:"grocery-bill",name:"Grocery subscription",
   amount:100,categoryId:"groc",dueDate:"2026-10-27",frequency:"once"});
  const state=recordCategoryPayment(entered,{id:"forty",categoryId:"groc",billId:"grocery-bill",
   dueDate:"2026-10-27",date:"2026-10-21",amount:40});
  const oct=buildFamilyMoneyRhythm(state,[],"2026-10-22",30).events.filter(e=>e.date.startsWith("2026-10"));
  expect(oct.filter(e=>e.kind==="bill").reduce((a,e)=>a-e.amountJod,0)).toBe(60);
  expect(oct.filter(e=>e.kind==="pace"&&e.categoryId==="groc")
   .reduce((a,e)=>a-e.amountJod,0)).toBe(1100);
  expect(state.expenses).toHaveLength(1);
 });
 it("clearly shows budget overrun rather than reporting zero money left",()=>{
  const today=localToday();
  const state={...budget(),expenses:[{id:"big-grocery",categoryId:"groc",date:today,amount:1350,status:"paid" as const,shared:false}]};
  render(<I18nProvider><UnifiedCategoryDetails state={state} setState={()=>{}} categoryId="groc"
   onEdit={()=>{}} onClose={()=>{}}/></I18nProvider>);
  const panel=screen.getByTestId("unified-category-details");
  expect(within(panel).getByText("Over budget")).toBeInTheDocument();
  expect(within(panel).getByText("150 JOD")).toBeInTheDocument();
  expect(within(panel).getByRole("button",{name:"Record spending"})).toBeInTheDocument();
  expect(within(panel).getByRole("button",{name:"Edit budget"})).toBeInTheDocument();
  expect(within(panel).queryByText("No payments recorded in this category yet.")).not.toBeInTheDocument();
 });
});
