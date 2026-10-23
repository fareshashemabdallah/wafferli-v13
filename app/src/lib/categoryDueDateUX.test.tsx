import {useState} from "react";
import {afterEach,beforeEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {emptyRealMoney} from "./moneyOverview";
import {futureDate,localToday} from "./cashflow";
import {UnifiedCategoryDetails} from "@/components/UnifiedCategoryDetails";
import type {MoneyState} from "./money";

const base=():MoneyState=>({...emptyRealMoney(),categories:[
 {id:"household",name:"Household",type:"variable",planned:400,remainderRole:"necessary"}
],expenses:[],commitments:[],budgetItems:[]});
function App({initial=base()}:{initial?:MoneyState}){
 const [state,setState]=useState(initial);
 return <I18nProvider><UnifiedCategoryDetails state={state} setState={setState}
 categoryId="household" onEdit={()=>{}} onClose={()=>{}}/>
 <output data-testid="saved-due-records">{JSON.stringify(state)}</output></I18nProvider>;
}
const state=()=>JSON.parse(screen.getByTestId("saved-due-records").textContent??"{}") as MoneyState;
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();});
describe("one due payment is one saved obligation",()=>{
 it("defaults Set a due date to once and never invents next month's second payment",()=>{
  render(<App/>);
  const panel=screen.getByTestId("unified-category-details");
  fireEvent.click(within(panel).getByText("Schedule a payment (optional)"));
  fireEvent.click(within(panel).getByRole("button",{name:/Set a due date/}));
  const form=within(panel).getByLabelText("Payment name").closest("form")!;
  expect(within(form).getByLabelText("Repeats")).toHaveValue("once");
  fireEvent.change(within(form).getByLabelText("Payment name"),{target:{value:"Cleaning materials"}});
  fireEvent.change(within(form).getByLabelText("Amount (JOD)"),{target:{value:"200"}});
  fireEvent.change(within(form).getByLabelText("Due date"),{target:{value:futureDate(localToday(),7)}});
  fireEvent.click(within(form).getByRole("button",{name:"Save due date"}));
  expect(state().commitments).toHaveLength(1);
  expect(state().commitments![0]).toMatchObject({name:"Cleaning materials",amount:200,frequency:"once"});
  expect(within(panel).getAllByText("Cleaning materials")).toHaveLength(1);
  expect(within(panel).getByText(/One-time/)).toBeInTheDocument();
  expect(within(panel).getAllByText("Due payments")).toHaveLength(1);
  expect(state().expenses).toHaveLength(0);
 });
 it("explicit monthly recurrence remains one record and only the next occurrence is shown",()=>{
  const initial=base();
  initial.commitments=[{id:"clean",name:"Cleaning materials",amount:200,
   dueDate:futureDate(localToday(),7),frequency:"monthly",categoryId:"household"}];
  render(<App initial={initial}/>);
  const panel=screen.getByTestId("unified-category-details");
  expect(within(panel).getAllByText("Cleaning materials")).toHaveLength(1);
  expect(within(panel).getByText(/Repeats.*Monthly/)).toBeInTheDocument();
  expect(within(panel).getAllByText("Due payments")).toHaveLength(1);
  expect(within(panel).getAllByRole("button",{name:"Pay full / partial"})).toHaveLength(1);
  expect(state().commitments).toHaveLength(1);
  expect(state().commitments![0]?.frequency).toBe("monthly");
 });
 it("a new monthly bill is recurring only after the parent explicitly selects Monthly",()=>{
  render(<App/>);
  const panel=screen.getByTestId("unified-category-details");
  fireEvent.click(within(panel).getByText("Schedule a payment (optional)"));
  fireEvent.click(within(panel).getByRole("button",{name:/Set a due date/}));
  fireEvent.change(within(panel).getByLabelText("Payment name"),{target:{value:"Cleaning materials"}});
  fireEvent.change(within(panel).getByLabelText("Amount (JOD)"),{target:{value:"200"}});
  fireEvent.change(within(panel).getByLabelText("Due date"),{target:{value:futureDate(localToday(),7)}});
  fireEvent.change(within(panel).getByLabelText("Repeats"),{target:{value:"monthly"}});
  fireEvent.click(within(panel).getByRole("button",{name:"Save due date"}));
  expect(state().commitments).toHaveLength(1);
  expect(state().commitments![0]?.frequency).toBe("monthly");
  expect(within(panel).getAllByText("Cleaning materials")).toHaveLength(1);
  expect(within(panel).getByText(/Repeats.*Monthly/)).toBeInTheDocument();
 });
});
