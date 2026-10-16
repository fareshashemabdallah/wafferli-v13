import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {render,screen,fireEvent,waitFor,cleanup} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {QuickExpenseCard,saveQuickExpense} from "@/components/QuickExpenseCard";
import {sampleMoney,type MoneyState} from "@/lib/money";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});
const real=():MoneyState=>({...sampleMoney(),demo:false,expenses:[]});

describe("fast expense entry",()=>{
 it("does not accept a real expense in demo Money",()=>{
  const s=sampleMoney();
  expect(saveQuickExpense(s,{id:"expense-123",amount:"18.5",categoryId:"groc",note:"Test"},"2026-10-16")).toBe(s);
 });
 it("records a real entry once, privately, without deducting unverified cash",()=>{
  const original={...real(),cashOnHand:250,cashReserve:60};
  const draft={id:"expense-123",amount:"18.50",categoryId:"groc",note:"School purchase"};
  const next=saveQuickExpense(original,draft,"2026-10-16");
  expect(next.expenses).toHaveLength(1);
  expect(next.expenses[0]).toMatchObject({amount:18.5,shared:false,status:"paid",note:"School purchase",date:"2026-10-16"});
  expect(next.cashOnHand).toBe(250);
  expect(next.cashReserve).toBe(60);
  expect(saveQuickExpense(next,draft,"2026-10-16")).toBe(next);
  expect(saveQuickExpense(original,{...draft,amount:"18.001"},"2026-10-16")).toBe(original);
  expect(saveQuickExpense(original,{...draft,categoryId:"unknown"},"2026-10-16")).toBe(original);
 });
 it("lets a parent save one purchase and explicitly start a new one",async()=>{
  window.localStorage.setItem("wafferli.v13.money",JSON.stringify(real()));
  const close=vi.fn();
  render(<I18nProvider><QuickExpenseCard onClose={close}/></I18nProvider>);
  await screen.findByRole("button",{name:"Save expense"});
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"8.75"}});
  fireEvent.change(screen.getByLabelText("Category"),{target:{value:"groc"}});
  fireEvent.click(screen.getByRole("button",{name:"Save expense"}));
  await screen.findByText("Expense recorded once");
  let s=JSON.parse(window.localStorage.getItem("wafferli.v13.money")??"{}") as MoneyState;
  expect(s.expenses).toHaveLength(1);
  expect(s.expenses[0]?.amount).toBe(8.75);
  expect(s.expenses[0]?.shared).toBe(false);
  expect(screen.queryByRole("button",{name:"Save expense"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Add another"}));
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"4.5"}});
  fireEvent.change(screen.getByLabelText("Category"),{target:{value:"fuel"}});
  fireEvent.click(screen.getByRole("button",{name:"Save expense"}));
  await waitFor(()=>{
   s=JSON.parse(window.localStorage.getItem("wafferli.v13.money")??"{}") as MoneyState;
   expect(s.expenses).toHaveLength(2);
  });
  fireEvent.click(screen.getByRole("button",{name:"Close"}));
  expect(close).toHaveBeenCalledOnce();
 });
});
