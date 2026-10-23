import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {PlanDecisionPanel} from "@/components/PlanDecisionPanel";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import {emptyRealMoney} from "./moneyOverview";
import {makeFamilyPlan} from "./familyPlans";
import {PLAN_MONEY_FOCUS_KEY} from "./planBudgetSetup";
import type {MoneyState} from "./money";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
 <a href={to} {...props}>{children}</a>
}));
beforeEach(()=>{localStorage.clear();sessionStorage.clear()});
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear();sessionStorage.clear()});
const money=():MoneyState=>({...emptyRealMoney(),income:2800,incomeKnown:true,
 categories:[{id:"food",name:"Groceries",planned:700,type:"variable"}],financialInputsPartial:true});
const plan=()=>makeFamilyPlan({id:"a",title:"Family activity",kind:"outing",date:"2026-10-22",budgetJod:300},new Date(2026,9,22,10))!;
describe("Plan → Money setup is precise and contextual",()=>{
 it("explains the real partial-review blocker and never demands savings",()=>{
  render(<I18nProvider><PlanDecisionPanel plan={plan()} plans={[]} money={money()} onUpdate={()=>{}} setMoney={()=>{}}/></I18nProvider>);
  const guide=screen.getByTestId("plan-budget-missing");
  expect(guide).toHaveTextContent("Confirm the categories entered cover your usual household costs");
  expect(guide).toHaveTextContent("Savings targets, payday dates");
  expect(guide).not.toHaveTextContent("Monthly income amount is missing");
  const review=within(guide).getByRole("link",{name:/Review my spending categories/});
  fireEvent.click(review);
  expect(sessionStorage.getItem(PLAN_MONEY_FOCUS_KEY)).toBe("review");
 });
 it("names absent income and categories separately, with separate direct links",()=>{
  render(<I18nProvider><PlanDecisionPanel plan={plan()} plans={[]} money={emptyRealMoney()} onUpdate={()=>{}} setMoney={()=>{}}/></I18nProvider>);
  const guide=screen.getByTestId("plan-budget-missing");
  expect(guide).toHaveTextContent("Monthly income amount is missing");
  expect(guide).toHaveTextContent("No monthly spending budget category has been entered");
  fireEvent.click(within(guide).getByRole("link",{name:/Enter income/}));
  expect(sessionStorage.getItem(PLAN_MONEY_FOCUS_KEY)).toBe("income");
 });
 it("shows the income dialog automatically on the Money page when routed from Plan",()=>{
  render(<I18nProvider><FamilyMoneyRhythm state={emptyRealMoney()} setState={()=>{}} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}} requestedSetupStep="income"/></I18nProvider>);
  expect(screen.getByRole("dialog",{name:"Income and paydays"})).toBeInTheDocument();
  expect(screen.getByTestId("money-plan-setup")).toHaveTextContent("Enter income");
 });
 it("makes the hidden review confirmation visible and preserves existing categories",()=>{
  vi.spyOn(window,"confirm").mockReturnValue(true);
  // Controlled harness checks the parent would receive a partial-flag update.
  const changed:{current:MoneyState|null}={current:null};
  const state=money();
  render(<I18nProvider><FamilyMoneyRhythm state={state} setState={change=>{
    changed.current=typeof change==="function"?change(state):change;
   }} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}} requestedSetupStep="review"/></I18nProvider>);
  fireEvent.click(screen.getByRole("button",{name:"Confirm budget review"}));
  expect(changed.current?.financialInputsPartial).toBe(false);
  expect(changed.current?.categories).toEqual(state.categories);
  expect(window.confirm).toHaveBeenCalledTimes(1);
 });
});
