import {useState} from "react";
import {afterEach,beforeEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {emptyRealMoney} from "./moneyOverview";
import {oneMoneyDashboard} from "./oneMoneyDashboard";
import {buildFamilyMoneyRhythm} from "./familyMoneyRhythm";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import type {MoneyState} from "./money";

const now="2026-10-20";
function money():MoneyState{return {...emptyRealMoney(),cashOnHand:1000,cashReserve:150,cashUpdatedAt:now,
 incomeKnown:true,incomeSources:[{id:"salary",name:"Salary",amount:2300,frequency:"monthly",nextDate:"2026-10-25",shared:false}],
 categories:[{id:"food",name:"Groceries",type:"variable",planned:400},
  {id:"housing",name:"Housing",type:"fixed",planned:800},
  {id:"fuel",name:"Fuel",type:"variable",planned:160}],
 expenses:[{id:"x1",date:"2026-10-18",categoryId:"food",amount:80,status:"paid",shared:false},
  {id:"x2",date:"2026-10-19",categoryId:"fuel",amount:35,status:"planned",shared:false}],
 commitments:[{id:"rent",name:"Rent due",amount:800,frequency:"monthly",dueDate:"2026-11-01",categoryId:"housing"}]};}
function App(){
 const [state,setState]=useState(money());
 return <I18nProvider><FamilyMoneyRhythm state={state} setState={setState}
  onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/>
  <output data-testid="state">{JSON.stringify(state)}</output></I18nProvider>;
}
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();});
describe("One family Money dashboard",()=>{
 it("uses canonical income, budget, paid and bills; planned is not paid",()=>{
  const state=money(),forecast=buildFamilyMoneyRhythm(state,[],now,30);
  const view=oneMoneyDashboard(state,forecast,now);
  expect(view.monthlyIncome).toBe(2300);
  expect(view.planned).toBe(1360);
  expect(view.paid).toBe(80);
  expect(view.unpaidPlannedRecords).toBe(1);
  expect(view.billsDue).toBe(800);
  expect(view.upcoming.some(x=>x.label==="Rent due")).toBe(true);
  expect(forecast.events.some(x=>x.id.startsWith("envelope:food:"))).toBe(true);
  expect(forecast.events.some(x=>x.id.startsWith("envelope:fuel:"))).toBe(true);
  expect(forecast.events.some(x=>x.id.startsWith("envelope:housing:"))).toBe(false);
  expect(state.expenses).toHaveLength(2);
 });
 it("does not invent an actual cash balance when none was entered",()=>{
  const state={...money(),cashOnHand:null},view=oneMoneyDashboard(state,buildFamilyMoneyRhythm(state,[],now),now);
  expect(view.openingCash).toBeNull();
  expect(view.forecastEnd).toBeNull();
 });
 it("same estimated weekly envelope is consistent across forecast horizons",()=>{
  const state=money();
  const seven=buildFamilyMoneyRhythm(state,[],now,7);
  const thirty=buildFamilyMoneyRhythm(state,[],now,30);
  const ninety=buildFamilyMoneyRhythm(state,[],now,90);
  const first=seven.events.find(e=>e.id.startsWith("envelope:food:"));
  expect(first).toBeDefined();
  expect(thirty.events.find(e=>e.id===first!.id)?.amountJod).toBe(first!.amountJod);
  expect(ninety.events.find(e=>e.id===first!.id)?.amountJod).toBe(first!.amountJod);
 });
 it("records an actual payment exactly once from Money without moving cash",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("money-summary-paid"));
  const dialog=screen.getByRole("dialog",{name:"Quick add expense"});
  fireEvent.change(within(dialog).getByLabelText("Amount · JOD"),{target:{value:"20"}});
  fireEvent.change(within(dialog).getByLabelText("What for?"),{target:{value:"food"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save expense"}));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  const state=JSON.parse(screen.getByTestId("state").textContent||"{}") as MoneyState;
  expect(state.expenses).toHaveLength(3);
  expect(state.expenses.filter(x=>x.amount===20&&x.status==="paid"&&x.categoryId==="food")).toHaveLength(1);
  expect(state.cashOnHand).toBe(1000);
 });
 it("planned quick-entry stays out of actual paid totals",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("money-summary-paid"));
  const dialog=screen.getByRole("dialog",{name:"Quick add expense"});
  fireEvent.change(within(dialog).getByLabelText("Amount · JOD"),{target:{value:"75"}});
  fireEvent.click(within(dialog).getByLabelText("Planned"));
  fireEvent.click(within(dialog).getByRole("button",{name:"Save expense"}));
  const state=JSON.parse(screen.getByTestId("state").textContent||"{}") as MoneyState;
  expect(state.expenses.filter(x=>x.status==="planned")).toHaveLength(2);
  expect(oneMoneyDashboard(state,buildFamilyMoneyRhythm(state,[],now),now).paid).toBe(80);
 });
});
