import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {emptyRealMoney} from "./moneyOverview";
import {moneyDashboardDecision} from "./moneyDashboardDecision";
import {buildFamilyMoneyRhythm} from "./familyMoneyRhythm";
import {localToday,futureDate} from "./cashflow";
import type {MoneyState} from "./money";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";

const today="2026-10-20";
function realistic():MoneyState{
 return {...emptyRealMoney(),income:2000,incomeKnown:true,
  incomeSources:[{id:"pay",name:"Salary",amount:2000,frequency:"monthly",nextDate:"2026-10-25",shared:false}],
  categories:[{id:"home",name:"Housing",type:"fixed",planned:300}],
  commitments:[{id:"rent",name:"Rent",amount:300,frequency:"once",dueDate:"2026-10-24",categoryId:"home"}],
  expenses:[{id:"paid",date:"2026-10-19",categoryId:"home",billId:"rent",dueDate:"2026-10-24",amount:200,shared:false,status:"paid"}],
  cashOnHand:null,financialInputsPartial:true};
}
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear()});
describe("Parent-first financial summary is derived from original records",()=>{
 it("keeps income less planned costs separate from bank cash and does not double count a bill",()=>{
  const state=realistic();
  const decision=moneyDashboardDecision(state,buildFamilyMoneyRhythm(state,[],today),today);
  expect(decision.overview.monthlyIncome).toBe(2000);
  expect(decision.overview.planned).toBe(300);
  expect(decision.unallocated).toBe(1700);
  expect(decision.overview.openingCash).toBeNull();
  expect(decision.overview.forecastEnd).toBeNull();
  expect(decision.upcomingBill?.amountJod).toBe(-100); // 300 due less 200 already paid
  expect(decision.next.kind).toBe("bill");
  expect(decision.next.target).toBe("bills");
  expect(decision.planMayBeIncomplete).toBe(true);
  expect(state.expenses).toHaveLength(1);
  expect(state.commitments).toHaveLength(1);
 });
 it("does not falsely call partial or unknown budgets spendable cash",()=>{
  const missing=emptyRealMoney();
  const decision=moneyDashboardDecision(missing,buildFamilyMoneyRhythm(missing,[],today),today);
  expect(decision.unallocated).toBeNull();
  expect(decision.next.kind).toBe("income");
  const highPlan=realistic();
  highPlan.categories[0]!.planned=2500;
  const gap=moneyDashboardDecision(highPlan,buildFamilyMoneyRhythm(highPlan,[],today),today);
  expect(gap.unallocated).toBe(-500);
  expect(gap.overview.openingCash).toBeNull();
 });
 it("flags an overdue instalment as unconfirmed, not verified unpaid by a provider",()=>{
  const state=realistic();
  state.commitments![0]!.dueDate="2026-10-15";
  state.expenses=[];
  const decision=moneyDashboardDecision(state,buildFamilyMoneyRhythm(state,[],today),today);
  expect(decision.upcomingBill?.overdue).toBe(true);
  expect(decision.next.kind).toBe("overdue");
  expect(decision.next.detailEn).toContain("does not verify payments");
 });
 it("offers learning, not a fake financial recommendation, on demonstration data",()=>{
  const state={...realistic(),demo:true};
  const decision=moneyDashboardDecision(state,buildFamilyMoneyRhythm(state,[],today),today);
  expect(decision.next.kind).toBe("demo");
  expect(decision.unallocated).toBeNull();
 });
 it("shows the real upcoming bill and routes the next step through existing Bills",()=>{
  const upcoming=futureDate(localToday(),4),salary=futureDate(localToday(),2);
  const state:MoneyState={...realistic(),expenses:[],cashOnHand:null,financialInputsPartial:false,
   commitments:[{id:"rent",name:"Rent",amount:300,frequency:"once",dueDate:upcoming,categoryId:"home"}],
   incomeSources:[{id:"pay",name:"Salary",amount:2000,frequency:"monthly",nextDate:salary,shared:false}]};
  const onBills=vi.fn(),onSpending=vi.fn();
  render(<I18nProvider><FamilyMoneyRhythm state={state} setState={()=>{}}
   onBills={onBills} onSpending={onSpending} onCategories={()=>{}}/></I18nProvider>);
  expect(screen.getByTestId("money-summary-unallocated")).toHaveTextContent("1,700 JOD");
  expect(screen.getByTestId("money-unallocated-caution")).toHaveTextContent("not money available to spend");
  expect(screen.getByTestId("money-upcoming-payment")).toHaveTextContent("Rent");
  expect(screen.getByTestId("money-upcoming-payment")).toHaveTextContent("300 JOD");
  expect(screen.getByTestId("money-next-step")).toHaveTextContent("scheduled payment");
  fireEvent.click(screen.getByTestId("money-next-action"));
  expect(onBills).toHaveBeenCalledTimes(1);
  expect(onSpending).not.toHaveBeenCalled();
  expect(state.expenses).toHaveLength(0);
 });
});
