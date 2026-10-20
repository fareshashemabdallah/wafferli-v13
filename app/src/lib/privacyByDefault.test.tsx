import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {render,screen,fireEvent,waitFor,cleanup} from "@testing-library/react";
import {I18nProvider} from "@/lib/i18n";
import {LocalExpensePrivacyReview} from "@/components/LocalExpensePrivacyReview";
import {sampleMoney,type MoneyState} from "./money";
import {recordBillPayment} from "./billPayment";
import {prepareExpenseForShare} from "./expenseSharing";

function source(path:string){return readFileSync(new URL("../"+path,import.meta.url),"utf8");}
const dateToday=()=>{
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
};
const real=():MoneyState=>({...sampleMoney(),demo:false,expenses:[{
 id:"priv-test",date:dateToday(),categoryId:"groc",amount:29.5,
 status:"paid",shared:true,owner:"Sensitive child's name",note:"Sensitive medical note"
}]});
beforeEach(()=>{window.localStorage.clear();vi.spyOn(window,"confirm").mockReturnValue(true);});
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});
describe("new financial records are private by default",()=>{
 it("marks automated bill-payment expenses private without modifying cash/paid logic",()=>{
  const money:MoneyState={...sampleMoney(),demo:false,expenses:[],cashOnHand:800,
   commitments:[{id:"rent",name:"Rent",amount:250,categoryId:"rent",
    frequency:"once",dueDate:"2026-10-16"}]};
  const entry=recordBillPayment(money,"rent","2026-10-16","2026-10-16","expense-new","already");
  expect(entry.expenses[0]).toMatchObject({shared:false,status:"paid",amount:250});
  expect(entry.cashOnHand).toBe(800);
  expect(prepareExpenseForShare(entry,entry.expenses[0]!,new Date(2026,9,16,12))).toBeNull();
 });
 it("ensures new payment paths use one private-by-default ledger",()=>{
  expect(source("routes/money.tsx")).toContain('amount,shared:false,status:"paid"');
  expect(source("routes/plans.tsx")).toContain('recordConfirmedExpense(');
  expect(source("components/QuickExpenseCard.tsx")).toContain('recordConfirmedExpense(');
  expect(source("routes/explore.shopping.tsx")).toContain('recordBasketExpense(');
  expect(source("lib/basketRecording.ts")).toContain('recordConfirmedExpense(');
  expect(source("lib/familyFinancialCommitments.ts")).toContain('recordConfirmedExpense(');
  expect(source("lib/billPayment.ts")).toContain('recordConfirmedExpense(');
  expect(source("lib/confirmedExpense.ts")).toContain('shared:input.shared??false');
  expect(source("components/CashFlowPlanner.tsx")).toContain('frequency:"monthly",nextDate:"",shared:false');
 });
 it("shows the exact hypothetical sharing fields without leaking notes or a household member identity",async()=>{
  window.localStorage.setItem("wafferli.v13.money",JSON.stringify(real()));
  render(<I18nProvider><LocalExpensePrivacyReview/></I18nProvider>);
  const button=await screen.findByRole("button",{name:"Preview separately consented fields"});
  fireEvent.click(button);
  const preview=await screen.findByRole("region",{name:"Hypothetical sharing data preview"});
  expect(preview).toHaveTextContent("Fields that could be copied only after future per-item consent");
  expect(preview).toHaveTextContent("Groceries");
  expect(preview).toHaveTextContent("29.500 JOD");
  expect(preview).not.toHaveTextContent("Sensitive medical note");
  expect(preview).not.toHaveTextContent("Sensitive child's name");
  expect(window.localStorage.getItem("wafferli.v13.money")).toContain("Sensitive medical note");
 });
 it("changing local privacy labels cannot publish an expense or overwrite its amounts",async()=>{
  window.localStorage.setItem("wafferli.v13.money",JSON.stringify(real()));
  render(<I18nProvider><LocalExpensePrivacyReview/></I18nProvider>);
  const select=await screen.findByRole("combobox",{name:"Expense privacy label"});
  fireEvent.change(select,{target:{value:"private"}});
  await waitFor(()=>{
   const money=JSON.parse(window.localStorage.getItem("wafferli.v13.money")??"{}") as MoneyState;
   expect(money.expenses[0]?.shared).toBe(false);
   expect(money.expenses[0]?.amount).toBe(29.5);
  });
  expect(screen.getByText(/A household label is not an upload/)).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.householdExpenses")).toBeNull();
 });
});
