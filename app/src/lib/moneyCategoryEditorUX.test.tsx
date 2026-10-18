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

describe("Adventure Money overview and category exploration",()=>{
 it("shows the money journey first, with real category forms only after selecting one",()=>{
  const go=vi.fn();
  render(<I18nProvider>
   <MoneyOverviewPanel state={{...sampleMoney(),demo:false}} setState={vi.fn()} goTo={go}
    householdPanel={<p data-testid="household-personnel">Your people</p>}
    budgetManagement={<section data-testid="expense-category-editor">Category controls</section>}/>
  </I18nProvider>);
  expect(screen.getByRole("region",{name:"Your monthly picture"})).toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Family exploration steps"})).toBeInTheDocument();
  expect(screen.queryByRole("region",{name:"Build household budget"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Discover cost of living/}));
  expect(screen.getByRole("region",{name:"Family budget adventure"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Where shall we explore?"})).toBeInTheDocument();
  expect(screen.queryByRole("region",{name:"Build household budget"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Groceries/}));
  expect(screen.getByRole("region",{name:"Build household budget"})).toBeInTheDocument();
  expect(screen.getByText("Reference unavailable")).toBeInTheDocument();
  expect(screen.getByTestId("expense-category-editor")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Explore another category/}));
  expect(screen.queryByRole("region",{name:"Build household budget"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Back to the adventure"}));
  expect(screen.getByRole("region",{name:"Your monthly picture"})).toBeInTheDocument();
 });
 it("keeps the deeper analytical view optional",()=>{
  render(<I18nProvider>
   <MoneyOverviewPanel state={{...sampleMoney(),demo:false}} setState={vi.fn()} goTo={vi.fn()}/>
  </I18nProvider>);
  expect(screen.queryByRole("heading",{name:"Financial insights & details"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Detailed financial insights/}));
  expect(screen.getByRole("heading",{name:"Financial insights & details"})).toBeInTheDocument();
  expect(screen.queryByRole("region",{name:"Build household budget"})).not.toBeInTheDocument();
 });
 it("does not pass sample budgets off as household finances",()=>{
  render(<I18nProvider>
   <MoneyOverviewPanel state={sampleMoney()} setState={vi.fn()} goTo={vi.fn()}/>
  </I18nProvider>);
  expect(screen.getAllByText("Not entered", {exact:true}).length).toBe(4);
  expect(screen.queryByText("1,200 JOD")).not.toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Start my family plan"})).toBeInTheDocument();
 });
});
