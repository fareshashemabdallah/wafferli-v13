import {useState} from "react";
import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {emptyRealMoney} from "./moneyOverview";
import {localToday} from "./cashflow";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import type {MoneyState} from "./money";
const initial:MoneyState={
 ...emptyRealMoney(),categories:[{id:"school",name:"Education",type:"fixed",planned:500,
 visualGroup:"custom",visualIcon:"education"}],expenses:[],commitments:[],
};
function App(){
 const [money,setMoney]=useState(initial);
 return <I18nProvider>
  <FamilyMoneyRhythm state={money} setState={setMoney} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/>
  <output data-testid="money-json">{JSON.stringify(money)}</output>
 </I18nProvider>;
}
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
describe("one-page illustrated category to partial payments",()=>{
 it("adds optional breakdown and a due date, records instalments, and reverses only one",()=>{
  render(<App/>);
  fireEvent.click(screen.getByRole("button",{name:/View all categories/}));
  fireEvent.click(screen.getByTestId("category-custom-school"));
  const section=screen.getByTestId("unified-category-details");
  expect(within(section).getByText("Education")).toBeInTheDocument();
  fireEvent.click(within(section).getByRole("button",{name:/Break down this category/}));
  fireEvent.change(within(section).getByLabelText("Name"),{target:{value:"School fees"}});
  fireEvent.change(within(section).getByLabelText("Amount (JOD)"),{target:{value:"300"}});
  fireEvent.click(within(section).getByLabelText("This is a bill with a due date"));
  fireEvent.change(within(section).getByLabelText("Next due date"),{target:{value:localToday()}});
  fireEvent.change(within(section).getByLabelText("Bill frequency"),{target:{value:"once"}});
  fireEvent.click(within(section).getByRole("button",{name:"Save line"}));
  const state=()=>JSON.parse(screen.getByTestId("money-json").textContent||"{}") as MoneyState;
  expect(state().categories[0]?.planned).toBe(500);
  expect(state().budgetItems).toHaveLength(1);
  expect(state().commitments).toHaveLength(1);
  fireEvent.click(within(section).getByRole("button",{name:"Pay full / partial"}));
  fireEvent.change(within(section).getByLabelText("Paid amount (JOD)"),{target:{value:"120"}});
  fireEvent.click(within(section).getByRole("button",{name:"Confirm payment"}));
  expect(state().expenses).toHaveLength(1);
  expect(state().commitments?.[0]?.paidDates).toBeUndefined();
  fireEvent.click(within(section).getByRole("button",{name:"Pay full / partial"}));
  fireEvent.click(within(section).getByRole("button",{name:"Confirm payment"}));
  expect(state().expenses).toHaveLength(2);
  expect(state().commitments?.[0]?.paidDates).toEqual([localToday()]);
  vi.spyOn(window,"confirm").mockReturnValue(true);
  fireEvent.click(within(section).getAllByRole("button",{name:"Undo"})[0]!);
  expect(state().expenses).toHaveLength(1);
  expect(state().commitments?.[0]?.paidDates).toEqual([]);
 });
});