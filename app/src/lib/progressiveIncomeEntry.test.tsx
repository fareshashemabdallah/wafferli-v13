import {useState} from "react";
import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {FamilyMoneyQuickEdit} from "@/components/FamilyMoneyQuickEdit";
import {emptyRealMoney} from "./moneyOverview";
import {sampleMoney,type MoneyState} from "./money";
type Editor="income"|"savings";
function App({initial=emptyRealMoney(),kind="income"}:{initial?:MoneyState;kind?:Editor}){
 const [state,setState]=useState(initial);
 const [open,setOpen]=useState(true);
 return <I18nProvider>
  {open&&<FamilyMoneyQuickEdit kind={kind} state={state} setState={setState} onClose={()=>setOpen(false)}/>}
  <output data-testid="saved-money">{JSON.stringify(state)}</output>
 </I18nProvider>;
}
const saved=()=>JSON.parse(screen.getByTestId("saved-money").textContent||"{}") as MoneyState;
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
describe("Income and payday progressive entry",()=>{
 it("saves only an amount, without requiring a source name or payment date",()=>{
  render(<App/>);
  const dialog=screen.getByRole("dialog",{name:"Income and paydays"});
  expect(within(dialog).getByLabelText("Income source (optional)")).toHaveValue("");
  fireEvent.change(within(dialog).getByLabelText("Amount (JOD)"),{target:{value:"2500"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save and update outlook"}));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(saved().incomeSources).toMatchObject([{name:"Monthly income",amount:2500,nextDate:"",frequency:"monthly"}]);
  expect(saved().income).toBe(2500);
  expect(saved().incomeKnown).toBe(true);
 });
 it("accepts Arabic numerals without requiring a day of month",()=>{
  render(<App/>);
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"٥٬٦٧٢٫٥٠"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and update outlook"}));
  expect(saved().incomeSources?.[0]?.amount).toBe(5672.5);
 });
 it("accepts an explicit zero income instead of incorrectly treating it as missing",()=>{
  render(<App/>);
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"0"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and update outlook"}));
  expect(saved().incomeKnown).toBe(true);
  expect(saved().incomeSources?.[0]?.amount).toBe(0);
 });
 it("prefills and updates the existing sole income, avoiding duplicate sources",()=>{
  const initial:MoneyState={...emptyRealMoney(),income:1800,
   incomeSources:[{id:"salary",name:"Salary",amount:1800,frequency:"monthly",nextDate:"",shared:false}]};
  render(<App initial={initial}/>);
  expect(screen.getByLabelText("Choose an existing entry or add new")).toHaveValue("salary");
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"2200"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and update outlook"}));
  expect(saved().incomeSources).toHaveLength(1);
  expect(saved().incomeSources?.[0]).toMatchObject({id:"salary",amount:2200,nextDate:""});
 });
 it("allows setup from sample Money only after explicit confirmation",()=>{
  vi.spyOn(window,"confirm").mockReturnValue(true);
  render(<App initial={sampleMoney()}/>);
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"3100"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and update outlook"}));
  expect(window.confirm).toHaveBeenCalledTimes(1);
  expect(saved().demo).toBe(false);
  expect(saved().income).toBe(3100);
  expect(saved().categories).toHaveLength(0);
 });
 it("does not overwrite sample Money if setup confirmation is refused",()=>{
  vi.spyOn(window,"confirm").mockReturnValue(false);
  render(<App initial={sampleMoney()}/>);
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"3100"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and update outlook"}));
  expect(saved().demo).toBe(true);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
 });
 it("keeps savings editable without a parallel budget form",()=>{
  render(<App kind="savings"/>);
  fireEvent.change(screen.getByLabelText(/Savings target each month/),{target:{value:"١٥٠"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and update outlook"}));
  expect(saved().savingsTargetAmount).toBe(150);
  expect(saved().savingsPct).toBe(0);
 });
 it("rejects an invalid income amount with a clear message",()=>{
  render(<App/>);
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"abc"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and update outlook"}));
  expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid income amount");
  expect(saved().incomeSources).toEqual([]);
 });
});
