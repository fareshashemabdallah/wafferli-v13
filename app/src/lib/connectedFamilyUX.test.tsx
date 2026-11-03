import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {HouseholdExpenseSharing} from "@/components/HouseholdExpenseSharing";
import type {SharedExpenseRow} from "./expenseSharing";
import {emptyRealMoney} from "./moneyOverview";

const mock=vi.hoisted(()=>({
 fetch:vi.fn(),publish:vi.fn(),withdraw:vi.fn()
}));
vi.mock("@/lib/householdExpenseApi",()=>({
 HOUSEHOLD_EXPENSE_SHARING_ENABLED:true,
 fetchSharedHouseholdExpenses:mock.fetch,
 publishOneSharedExpense:mock.publish,
 withdrawSharedExpense:mock.withdraw
}));
const household="be02ac77-1d70-4ecc-980e-34d1124e24d1";
const a="35796b6a-8c32-4c8b-b905-14bf4c58feaa";
const b="6ca9e00a-bd8f-48bd-b7f6-8d01ca637bd7";
const shared=(id:string,author:string,amount:number):SharedExpenseRow=>({
 id,household_id:household,created_by:author,
 source_fingerprint:id.replaceAll("-","").repeat(2),
 category:"Education",amount_fils:amount,
 occurred_on:"2026-11-02",currency:"JOD",consented_at:"2026-11-03T05:00:00Z"
});
const fixture=()=>({...emptyRealMoney(),categories:[
 {id:"education",name:"Education",type:"variable" as const,planned:1000}
],expenses:[{id:"local-a",date:"2026-10-20",categoryId:"education",amount:70,
 shared:true,status:"paid" as const,note:"Private parent note"}]});
beforeEach(()=>{
 window.localStorage.clear();mock.fetch.mockReset();mock.publish.mockReset();mock.withdraw.mockReset();
 mock.fetch.mockResolvedValue([]);
 window.localStorage.setItem("wafferli.v13.money",JSON.stringify(fixture()));
});
afterEach(()=>{cleanup();window.localStorage.clear();});
describe("Connected family privacy UI",()=>{
 it("keeps a selected paid expense private until a separate visibility choice AND explicit consent",async()=>{
  render(<I18nProvider><HouseholdExpenseSharing householdId={household} userId={a}/></I18nProvider>);
  const select=await screen.findByRole("combobox",{name:/Choose one paid expense/});
  await waitFor(()=>expect(within(select).getAllByRole("option").length).toBe(2));
  fireEvent.change(select,{target:{value:"local-a"}});
  expect(screen.getByRole("radio",{name:/Only me/})).toBeChecked();
  expect(screen.getByRole("button",{name:/Share this one expense/})).toBeDisabled();
  expect(mock.publish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("radio",{name:/Share amount, category and date/}));
  expect(screen.getByRole("button",{name:/Share this one expense/})).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox",{name:/I explicitly agree/}));
  expect(screen.getByRole("button",{name:/Share this one expense/})).toBeEnabled();
  fireEvent.click(screen.getByRole("radio",{name:/Only me/}));
  expect(screen.getByRole("button",{name:/Share this one expense/})).toBeDisabled();
  expect(mock.publish).not.toHaveBeenCalled();
  expect(screen.queryByText(/Private parent note/)).not.toBeInTheDocument();
 });
 it("shows a consistent consented household total without modifying local Money",async()=>{
  mock.fetch.mockResolvedValue([
   shared("aee9e00a-bd8f-48bd-b7f6-8d01ca637bd7",a,70000),
   shared("bee9e00a-bd8f-48bd-b7f6-8d01ca637bd7",b,20000)
  ]);
  const before=window.localStorage.getItem("wafferli.v13.money");
  render(<I18nProvider><HouseholdExpenseSharing householdId={household} userId={a}/></I18nProvider>);
  const summary=await screen.findByTestId("connected-family-summary");
  await waitFor(()=>expect(within(summary).getAllByText("90.000 JOD").length).toBeGreaterThan(0));
  expect(within(summary).getByText("70.000 JOD")).toBeInTheDocument();
  expect(within(summary).getByText("20.000 JOD")).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBe(before);
  expect(mock.publish).not.toHaveBeenCalled();
 });
});
