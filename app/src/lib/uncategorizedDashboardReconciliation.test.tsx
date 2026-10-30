import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {localToday,futureDate} from "./cashflow";
import {emptyRealMoney} from "./moneyOverview";
import {buildFamilyMoneyRhythm} from "./familyMoneyRhythm";
import {moneyDashboardDecision} from "./moneyDashboardDecision";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import type {MoneyState} from "./money";
const date=localToday();
const state=():MoneyState=>({...emptyRealMoney(),incomeKnown:true,income:2500,
 incomeSources:[{id:"salary",name:"Salary",amount:2500,frequency:"monthly",nextDate:futureDate(date,3),shared:false}],
 categories:[
  {id:"home",name:"Housing",type:"fixed",planned:800,remainderRole:"committed"},
  {id:"food",name:"Groceries",type:"variable",planned:400}],
 expenses:[
  {id:"housing-paid",date,categoryId:"home",amount:300,status:"paid",shared:false},
  {id:"groceries-paid",date,categoryId:"food",amount:100,status:"paid",shared:false},
  {id:"orphan-paid",date,categoryId:"uncategorized",amount:250,status:"paid",shared:false},
  {id:"retired-paid",date,categoryId:"removed-category",amount:150,status:"paid",shared:false},
  {id:"planned-orphan",date,categoryId:"uncategorized",amount:700,status:"planned",shared:false}
 ],financialInputsPartial:false,
 retiredCategoryNames:{"removed-category":"Former category"}});
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear()});
describe("Money uncategorized amounts reconcile without duplicate spending",()=>{
 it("counts only paid records lacking a current category as extra to the plan",()=>{
  const money=state();const view=moneyDashboardDecision(money,buildFamilyMoneyRhythm(money,[],date),date);
  expect(view.overview.planned).toBe(1200);
  expect(view.overview.paid).toBe(800); // 300+100+250+150, not the planned 700
  expect(view.overview.uncategorizedPaid).toBe(400);
  expect(view.overview.uncategorizedPaidCount).toBe(2);
  expect(view.unallocated).toBe(900); // 2500 - 1200 budget - 400 outside budget, never -800
  expect(view.unclassifiedPlanned).toBe(400); // Groceries is inside 1200
  expect(view.unclassifiedPaid).toBe(100); // within the 800 total paid
  expect(view.unclassifiedCategoryId).toBe("food");
  expect(money.expenses).toHaveLength(5);
 });
 it("reclassifying an old payment updates the original record's projection without duplicate deductions",()=>{
  const money=state();
  const reclassified={...money,expenses:money.expenses.map(e=>e.id==="orphan-paid"?{...e,categoryId:"food"}:e)};
  const view=moneyDashboardDecision(reclassified,buildFamilyMoneyRhythm(reclassified,[],date),date);
  expect(view.overview.paid).toBe(800);
  expect(view.overview.uncategorizedPaid).toBe(150);
  expect(view.unallocated).toBe(1150);
  expect(view.unclassifiedPaid).toBe(350);
  expect(reclassified.expenses).toHaveLength(5);
 });
 it("surfaces paid-orphan records and an unclassified category with separate links",()=>{
  const onReview=vi.fn(),onSpending=vi.fn();
  const money=state();
  render(<I18nProvider><FamilyMoneyRhythm state={money} setState={()=>{}}
    onBills={()=>{}} onSpending={onSpending} onReviewUncategorized={onReview}
    onCategories={()=>{}}/></I18nProvider>);
  expect(screen.getByTestId("money-summary-paid")).toHaveTextContent("800 JOD");
  expect(screen.getByTestId("money-summary-unallocated")).toHaveTextContent("900 JOD");
  expect(screen.getByTestId("money-uncategorized-paid")).toHaveTextContent("400 JOD");
  expect(screen.getByTestId("money-unclassified-plan")).toHaveTextContent("400 JOD");
  expect(screen.getByTestId("money-unclassified-plan")).toHaveTextContent("100 JOD");
  expect(screen.getByTestId("money-needs-categorization")).toHaveTextContent("not an extra cost");
  fireEvent.click(screen.getByTestId("review-uncategorized-paid"));
  expect(onReview).toHaveBeenCalledTimes(1);
  expect(onSpending).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("review-unclassified-category"));
  expect(screen.getByTestId("unified-category-details")).toHaveTextContent("Groceries");
  expect(money.expenses).toHaveLength(5);
 });
 it("shows neither warning for fully classified budgets with all spending linked",()=>{
  const money=state();
  money.categories=money.categories.map(c=>({...c,remainderRole:"necessary"}));
  money.expenses=money.expenses.filter(e=>["housing-paid","groceries-paid"].includes(e.id));
  const view=moneyDashboardDecision(money,buildFamilyMoneyRhythm(money,[],date),date);
  expect(view.unallocated).toBe(1300);
  expect(view.overview.uncategorizedPaid).toBe(0);
  expect(view.unclassifiedPlanned).toBe(0);
  const onReview=vi.fn();
  render(<I18nProvider><FamilyMoneyRhythm state={money} setState={()=>{}}
    onBills={()=>{}} onSpending={()=>{}} onReviewUncategorized={onReview}
    onCategories={()=>{}}/></I18nProvider>);
  expect(screen.queryByTestId("money-needs-categorization")).not.toBeInTheDocument();
  expect(onReview).not.toHaveBeenCalled();
 });
});
