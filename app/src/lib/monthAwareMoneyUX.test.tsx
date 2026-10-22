import {useState} from "react";
import {afterEach,beforeEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {localToday} from "./cashflow";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";

const base=():MoneyState=>({
 ...emptyRealMoney(),categories:[{id:"groc",name:"Groceries",planned:400,type:"variable",priority:"essential"}],
 expenses:[],commitments:[],cashOnHand:null,incomeSources:[],
});
function App(){
 const [money,setMoney]=useState(base());
 return <I18nProvider>
  <FamilyMoneyRhythm state={money} setState={setMoney} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/>
  <output data-testid="finance-json">{JSON.stringify(money)}</output>
 </I18nProvider>;
}
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();});
describe("Month-aware guidance embedded in existing illustrated Money Map",()=>{
 it("uses an existing pictured category card and optional confirmation; no extra tab, bill or paid expense",()=>{
  render(<App/>);
  const home=screen.getByTestId("prototype-money-home");
  expect(within(home).getByText("Where our money goes")).toBeInTheDocument();
  fireEvent.click(within(home).getByTestId("category-picture-groceries"));
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  fireEvent.click(screen.getByRole("button",{name:"Adjust a particular month"}));
  const dialog=screen.getByRole("dialog",{name:"Adjust a month's allowance"});
  expect(within(dialog).getByText("Groceries")).toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText("Plan for that month (JOD)"),{target:{value:"550"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Confirm this month's plan"}));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByTestId("finance-json")).toHaveTextContent('"' + localToday().slice(0,7) + '":{"groc":550}');
  expect(screen.getByTestId("finance-json")).toHaveTextContent('"expenses":[]');
  expect(screen.getByTestId("finance-json")).toHaveTextContent('"commitments":[]');
  expect(within(home).getByText("Adjusted this month")).toBeInTheDocument();
 });
 it("restores the usual plan with one click without deleting expenses or modifying core categories",()=>{
  render(<App/>);
  const home=screen.getByTestId("prototype-money-home");
  const groceries=()=>within(home).getByTestId("category-picture-groceries");
  fireEvent.click(groceries());
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  fireEvent.click(screen.getByRole("button",{name:"Adjust a particular month"}));
  fireEvent.change(screen.getByLabelText("Plan for that month (JOD)"),{target:{value:"600"}});
  fireEvent.click(screen.getByRole("button",{name:"Confirm this month's plan"}));
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  fireEvent.click(screen.getByRole("button",{name:"Adjust a particular month"}));
  fireEvent.click(screen.getByRole("button",{name:"Use usual plan"}));
  const json=screen.getByTestId("finance-json");
  expect(json.textContent).not.toContain('"categoryMonthlyPlans"');
  expect(json).toHaveTextContent('"planned":400');
 });
});
