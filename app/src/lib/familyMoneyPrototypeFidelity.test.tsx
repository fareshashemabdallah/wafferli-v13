import {useState} from "react";
import {afterEach,beforeEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";
function example():MoneyState{
 return {...emptyRealMoney(),cashOnHand:520,cashReserve:140,cashUpdatedAt:"2026-10-20",income:2500,
  incomeKnown:true,
  incomeSources:[{id:"salary",name:"Primary salary",amount:2500,frequency:"monthly",nextDate:"2026-10-25",shared:false}],
  categories:[{id:"groc",name:"Groceries",type:"variable",planned:400,priority:"essential"}],
  commitments:[{id:"rent",name:"Housing payment",amount:800,frequency:"monthly",dueDate:"2026-11-01"}],
  expenses:[]};
}
function App(){
 const [state,setState]=useState(example());
 return <I18nProvider>
  <FamilyMoneyRhythm state={state} setState={setState} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/>
  <output data-testid="income-records">{JSON.stringify(state.incomeSources)}</output>
  <output data-testid="money-state">{JSON.stringify({cash:state.cashOnHand,pace:state.spendingPaces,categories:state.categories,expenses:state.expenses,commitments:state.commitments})}</output>
 </I18nProvider>;
}
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();});
describe("Prototype-faithful Money experience",()=>{
 it("opens on the approved three-figure visual layout and four pictured areas",()=>{
  render(<App/>);
  const home=screen.getByTestId("prototype-money-home");
  expect(within(home).getByText("Starting cash · manually entered")).toBeInTheDocument();
  expect(within(home).getByText("Next expected income")).toBeInTheDocument();
  expect(within(home).getByText("Bills due · next 30 days")).toBeInTheDocument();
  for(const item of ["Income & paydays","Bills & commitments","Everyday spending","Annual expenses"]){
   expect(within(home).getByRole("button",{name:new RegExp(item)})).toBeInTheDocument();
  }
  for(const name of ["Groceries","Fuel","Restaurants","Children","Housing","Health"]){
   expect(within(home).getByRole("button",{name:new RegExp(name)})).toBeInTheDocument();
  }
  expect(within(home).getByText("••••")).toBeInTheDocument();
  expect(screen.getAllByRole("tab",{name:/Money Map/})).toHaveLength(1);
 });
 it("edits the same dated income source without inventing a payment or duplicating it",()=>{
  render(<App/>);
  const home=screen.getByTestId("prototype-money-home");
  fireEvent.click(within(home).getByRole("button",{name:/Income & paydays/}));
  const dialog=screen.getByRole("dialog",{name:"Income and paydays"});
  fireEvent.change(within(dialog).getByLabelText("Choose an existing entry or add new"),
   {target:{value:"salary"}});
  fireEvent.change(within(dialog).getByLabelText("Next expected date"),{target:{value:"2026-11-04"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save and update outlook"}));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByTestId("income-records")).toHaveTextContent("2026-11-04");
  expect(screen.getByTestId("income-records")).not.toHaveTextContent("receivedDates");
  expect(screen.getByTestId("income-records").textContent?.match(/"id":"salary"/g)?.length).toBe(1);
  expect(screen.getByTestId("money-state")).toHaveTextContent('"expenses":[]');
 });
 it("can edit manual cash and an existing category pace without creating a second paid expense",()=>{
  render(<App/>);
  fireEvent.click(screen.getByRole("tab",{name:/Timeline/}));
  fireEvent.click(screen.getByRole("button",{name:"Edit starting cash & reserve"}));
  const dialog=screen.getByRole("dialog",{name:"Cash and safety reserve"});
  fireEvent.change(within(dialog).getByLabelText("Cash available now (JOD)"),{target:{value:"650"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save and update outlook"}));
  expect(screen.getByTestId("money-state")).toHaveTextContent('"cash":650');
  fireEvent.click(screen.getByRole("tab",{name:/Spending pace/}));
  fireEvent.click(screen.getByRole("button",{name:"Spread this budget"}));
  fireEvent.change(screen.getByLabelText("Monthly allowance (JOD)"),{target:{value:"450"}});
  fireEvent.click(screen.getByRole("button",{name:"Save pace"}));
  expect(screen.getByTestId("money-state")).toHaveTextContent('"planned":450');
  expect(screen.getByTestId("money-state")).toHaveTextContent('"intervalDays":7');
  expect(screen.getByTestId("money-state")).toHaveTextContent('"expenses":[]');
 });
});
