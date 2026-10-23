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
describe("Approved core Money concept",()=>{
 it("shows monthly overview, classified spending mix and categories, without parallel planning modules",()=>{
  render(<App/>);
  const home=screen.getByTestId("prototype-money-home");
  const dashboard=screen.getByTestId("unified-money-dashboard");
  for(const id of ["income","plan","paid"])expect(within(dashboard).getByTestId("money-summary-"+id)).toBeInTheDocument();
  expect(within(dashboard).queryByTestId("money-summary-bills")).not.toBeInTheDocument();
  expect(within(dashboard).getByTestId("money-spending-mix")).toBeInTheDocument();
  expect(within(home).getByText("Where our money goes")).toBeInTheDocument();
  expect(within(home).getByTestId("money-category-preview").children).toHaveLength(1);
  expect(screen.queryByText("More planning tools (optional)")).not.toBeInTheDocument();
  expect(screen.queryByText("Explore spending mix")).not.toBeInTheDocument();
  expect(screen.queryByText("What each cost means for our money")).not.toBeInTheDocument();
  expect(screen.queryByRole("button",{name:/View all categories/})).not.toBeInTheDocument();
  expect(screen.getByRole("button",{name:/Add category/})).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("category-picture-groceries"));
  expect(screen.getByTestId("unified-category-details")).toBeInTheDocument();
  expect(screen.queryByTestId("money-category-preview")).not.toBeInTheDocument();
  expect(screen.getByRole("button",{name:/Back to categories/})).toBeInTheDocument();
 });
 it("edits an existing income once without recording it as a payment",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("money-summary-income"));
  const dialog=screen.getByRole("dialog",{name:"Income and paydays"});
  fireEvent.change(within(dialog).getByLabelText("Choose an existing entry or add new"),
   {target:{value:"salary"}});
  fireEvent.change(within(dialog).getByLabelText("Next expected date (optional)"),{target:{value:"2026-11-04"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save and update outlook"}));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByTestId("income-records")).toHaveTextContent("2026-11-04");
  expect(screen.getByTestId("income-records")).not.toHaveTextContent("receivedDates");
  expect(screen.getByTestId("income-records").textContent?.match(/"id":"salary"/g)?.length).toBe(1);
  expect(screen.getByTestId("money-state")).toHaveTextContent('"expenses":[]');
 });
 it("preserves existing historical cash, commitments and savings facts while removing their additional UI",()=>{
  render(<App/>);
  expect(screen.queryByText("More planning tools (optional)")).not.toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Edit cash"})).not.toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Edit savings goal"})).not.toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Customize spending timing"})).not.toBeInTheDocument();
  const json=screen.getByTestId("money-state").textContent??"";
  expect(json).toContain('"cash":520');
  expect(json).toContain('"name":"Housing payment"');
  expect(json).toContain('"expenses":[]');
 });
});
