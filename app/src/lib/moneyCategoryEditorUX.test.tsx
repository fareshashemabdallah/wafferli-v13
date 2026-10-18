import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {MoneyOverviewPanel} from "@/components/MoneyOverviewPanel";
import {sampleMoney} from "./money";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});

describe("Money page keeps its first screen light",()=>{
 it("shows a concise snapshot, leaving detailed category comparisons closed until requested",async()=>{
  const manage=vi.fn(), go=vi.fn();
  render(<I18nProvider>
   <MoneyOverviewPanel state={{...sampleMoney(),demo:false}} setState={vi.fn()} goTo={go}
    onManageCategories={manage}
    householdPanel={<div data-testid="household-people">People & visitors</div>}
    budgetManagement={<section data-testid="expense-category-editor">Category controls</section>}/>
  </I18nProvider>);
  expect(screen.getByRole("region",{name:"Monthly money snapshot"})).toBeInTheDocument();
  expect(screen.getByText("Your family money this month")).toBeInTheDocument();
  expect(screen.getByText("Your plan, recorded payments and upcoming bills are different views of the same finances—not amounts to add together. This is not your bank balance or money confirmed safe to spend.")).toBeInTheDocument();
  expect(screen.queryByRole("region",{name:"Build household budget"})).not.toBeInTheDocument();
  expect(screen.queryByTestId("expense-category-editor")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Explore & adjust my household budget"}));
  const editor=screen.getByTestId("expense-category-editor");
  const builder=screen.getByRole("region",{name:"Build household budget"});
  expect(screen.queryByRole("region",{name:"Monthly money snapshot"})).not.toBeInTheDocument();
  expect(editor.compareDocumentPosition(builder)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText("Household members, helpers & visitors")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Manage categories"}));
  expect(manage).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button",{name:"Back to Our Money"}));
  expect(screen.getByRole("region",{name:"Monthly money snapshot"})).toBeInTheDocument();
 });
 it("keeps advanced analysis optional rather than appending it to the home scroll",()=>{
  render(<I18nProvider>
   <MoneyOverviewPanel state={{...sampleMoney(),demo:false}} setState={vi.fn()} goTo={vi.fn()}/>
  </I18nProvider>);
  expect(screen.queryByRole("heading",{name:"Financial insights & details"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/More financial insights/}));
  expect(screen.getByRole("heading",{name:"Financial insights & details"})).toBeInTheDocument();
  expect(screen.queryByRole("region",{name:"Build household budget"})).not.toBeInTheDocument();
 });
});
