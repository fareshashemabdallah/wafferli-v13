import {describe,it,expect,vi,afterEach} from "vitest";
import {cleanup,render,fireEvent,screen} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {SpendingBreakdownCard} from "@/components/SpendingBreakdownCard";
import {sampleMoney,type MoneyState} from "./money";
import {applyStarterBudget} from "./starterBudget";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
afterEach(()=>{cleanup();vi.restoreAllMocks()});
const renderCard=(money:MoneyState,compact=false,onChange?:(v:MoneyState)=>void)=>
 render(<I18nProvider><SpendingBreakdownCard state={money} compact={compact} {...(onChange?{onChange}:{})}/></I18nProvider>);
describe("parent understands monthly spending without digging through forms",()=>{
 it("shows fixed and variable budgets and their actual category line items",()=>{
  renderCard({...sampleMoney(),demo:false,expenses:[
   {id:"paid",date:new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0")+"-05",
    categoryId:"groc",amount:70,shared:true,status:"paid"}
  ]});
  expect(screen.getByRole("region",{name:"Fixed and variable spending breakdown"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Fixed expenses"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Variable expenses"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Periodic expenses"})).toBeInTheDocument();
  expect(screen.getByText("Groceries")).toBeInTheDocument();
  expect(screen.getByText("Rent")).toBeInTheDocument();
  expect(screen.getByText("Fuel & transport")).toBeInTheDocument();
  expect(screen.getByText(/The gap between planned and recorded isn't bank cash or confirmed savings/)).toBeInTheDocument();
 });
 it("refuses to classify the old three-number total as known rent/groceries; allows one conscious split",()=>{
  const state=applyStarterBudget(sampleMoney(),{income:1400,spending:1000,savings:200});
  const changed=vi.fn();
  renderCard(state,false,changed);
  expect(screen.getByRole("heading",{name:"Not yet broken down"})).toBeInTheDocument();
  expect(screen.getByText(/Your monthly spending is still one combined estimate/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Split my monthly spending once"}));
  fireEvent.change(screen.getByLabelText("Fixed costs (rent, bills) · JOD"),{target:{value:"600"}});
  fireEvent.change(screen.getByLabelText("Variable costs (groceries, transport) · JOD"),{target:{value:"300"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and show my breakdown"}));
  expect(screen.getByRole("alert")).toHaveTextContent("add up to your existing");
  expect(changed).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Variable costs (groceries, transport) · JOD"),{target:{value:"400"}});
  fireEvent.click(screen.getByRole("button",{name:"Save and show my breakdown"}));
  expect(changed).toHaveBeenCalledTimes(1);
  expect(changed.mock.calls[0]?.[0].categories.map((v:{id:string})=>v.id)).toEqual([
   "starter-fixed","starter-variable"
  ]);
 });
 it("keeps the compact Today view readable with a link to detailed Money records",()=>{
  const state={...sampleMoney(),demo:false,expenses:[]};
  renderCard(state,true);
  expect(screen.getByRole("link",{name:/See full breakdown & categories/})).toHaveAttribute("href","/money");
  expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(1);
 });
});
