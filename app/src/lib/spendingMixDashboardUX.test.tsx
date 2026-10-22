import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import type {MoneyState} from "./money";
import {emptyRealMoney} from "./moneyOverview";
import {SpendingMixDashboard} from "@/components/SpendingMixDashboard";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";

const sample=():MoneyState=>({
 ...emptyRealMoney(),income:5000,incomeKnown:true,
 categories:[
  {id:"car",name:"Car",type:"variable",planned:700},
  {id:"utilities",name:"Utilities",type:"variable",planned:500},
  {id:"nanny",name:"Nanny",type:"fixed",planned:400,remainderRole:"committed"}
 ],
 budgetItems:[
  {id:"loan",categoryId:"car",name:"Instalment",amountJod:350,frequency:"monthly",
   enabled:true,behaviour:"fixed",priority:"essential",spendingRole:"committed"},
  {id:"fuel",categoryId:"car",name:"Fuel",amountJod:250,frequency:"monthly",
   enabled:true,behaviour:"variable",priority:"essential",spendingRole:"necessary"},
  {id:"maintenance",categoryId:"car",name:"Maintenance",amountJod:1200,frequency:"yearly",
   enabled:true,behaviour:"variable",priority:"essential",spendingRole:"necessary"},
  {id:"water",categoryId:"utilities",name:"Water",amountJod:150,frequency:"monthly",
   enabled:true,behaviour:"variable",priority:"essential",spendingRole:"necessary"},
  {id:"electric",categoryId:"utilities",name:"Electricity",amountJod:150,frequency:"monthly",
   enabled:true,behaviour:"variable",priority:"essential",spendingRole:"necessary"},
  {id:"internet",categoryId:"utilities",name:"Internet",amountJod:35,frequency:"monthly",
   enabled:true,behaviour:"fixed",priority:"essential",spendingRole:"committed"},
  {id:"building",categoryId:"utilities",name:"Building",amountJod:50,frequency:"monthly",
   enabled:true,behaviour:"fixed",priority:"essential",spendingRole:"committed"},
  {id:"phone",categoryId:"utilities",name:"Phone",amountJod:20,frequency:"monthly",
   enabled:true,behaviour:"fixed",priority:"essential",spendingRole:"committed"}
 ]
});
beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear()});

describe("Money dashboard compact spending mix",()=>{
 it("renders the correct groups, distinguishing the Utilities cushion without duplicating it",()=>{
  const open=vi.fn();
  render(<I18nProvider><SpendingMixDashboard state={sample()} onOpenCategory={open}/></I18nProvider>);
  const panel=screen.getByTestId("money-spending-mix");
  expect(panel).toHaveTextContent("Your family's spending mix");
  expect(panel).toHaveTextContent("1,600 JOD");
  expect(within(panel).getByTestId("mix-stat-committed")).toHaveTextContent("835 JOD");
  expect(within(panel).getByTestId("mix-stat-necessary")).toHaveTextContent("665 JOD");
  expect(within(panel).getByTestId("mix-stat-cushion")).toHaveTextContent("95 JOD");
  expect(within(panel).queryByTestId("mix-stat-unclassified")).not.toBeInTheDocument();
  expect(within(panel).getByTestId("money-spending-mix-bar").children).toHaveLength(3);
  expect(within(panel).getByTestId("mix-expanded-lines")).toHaveTextContent("Utilities · Water");
  expect(within(panel).getByTestId("mix-expanded-lines")).toHaveTextContent("Utilities · Cushion");
  fireEvent.click(within(panel).getByRole("button",{name:/Utilities · Water/}));
  expect(open).toHaveBeenCalledWith("utilities");
  expect(sample().budgetItems).toHaveLength(8);
 });
 it("is inserted immediately under the original four financial cards in the actual Money journey",()=>{
  render(<I18nProvider><FamilyMoneyRhythm state={sample()} setState={()=>{}} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/></I18nProvider>);
  const dashboard=screen.getByTestId("unified-money-dashboard");
  const fourth=within(dashboard).getByTestId("money-summary-bills");
  const mix=within(dashboard).getByTestId("money-spending-mix");
  expect(fourth.compareDocumentPosition(mix)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(within(dashboard).getByTestId("money-summary-income")).toHaveTextContent("5,000 JOD");
  expect(within(dashboard).getByTestId("money-summary-plan")).toHaveTextContent("1,600 JOD");
  expect(mix).toHaveTextContent("Budget cushions");
  expect(within(dashboard).getByTestId("money-summary-paid")).toHaveTextContent("0 JOD");
 });
 it("keeps genuinely unclassified categories separate from itemized cushions",()=>{
  const s=sample();
  s.categories.push({id:"misc",name:"Unsorted category",type:"variable",planned:50});
  render(<I18nProvider><SpendingMixDashboard state={s} onOpenCategory={()=>{}}/></I18nProvider>);
  expect(screen.getByTestId("mix-stat-unclassified")).toHaveTextContent("50 JOD");
  expect(screen.getByTestId("mix-stat-cushion")).toHaveTextContent("95 JOD");
  expect(screen.getByTestId("mix-insight")).toHaveTextContent("50 JOD");
 });
});
