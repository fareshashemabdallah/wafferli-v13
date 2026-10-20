import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {ReactNode} from "react";
import {QuickMoneySetup} from "@/components/QuickMoneySetup";
import {I18nProvider} from "@/lib/i18n";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {emptyRealMoney} from "@/lib/moneyOverview";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children}:{to:string;children:ReactNode})=><a href={to}>{children}</a>
}));
vi.mock("sonner",()=>({toast:{success:vi.fn()}}));
const mount=(initial:MoneyState)=>{
 let saved=initial;
 const setMoney=(update:(before:MoneyState)=>MoneyState)=>{saved=update(saved);};
 render(<I18nProvider><QuickMoneySetup money={initial} setMoney={setMoney}/></I18nProvider>);
 return ()=>saved;
};
beforeEach(()=>vi.spyOn(window,"confirm").mockReturnValue(true));
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe("busy-parent one-fact financial entry",()=>{
 it("shows exactly one amount, adds one estimate, and leaves demo relatives/calendar/plans alone",()=>{
  const get=mount(sampleMoney());
  expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
  expect(screen.getByRole("combobox",{name:"Choose one money fact"})).toHaveValue("essential");
  fireEvent.change(screen.getByRole("spinbutton"),{target:{value:"540"}});
  fireEvent.click(screen.getByRole("button",{name:"Save this one fact"}));
  const money=get();
  expect(money.demo).toBe(false);
  expect(money.categories).toHaveLength(1);
  expect(money.categories[0]).toMatchObject({id:"household-essential",planned:540,amountConfidence:"estimate"});
  expect(money.incomeKnown).toBeUndefined();
  expect(money.expenses).toEqual([]);
  expect(money.commitments).toEqual([]);
 });
 it("adds only missing spending, preserving real income, transactions, bills and existing estimates",()=>{
  const original={...emptyRealMoney(),financialInputsPartial:true,income:1500,incomeKnown:true,
   cashOnHand:300,expenses:[{id:"paid",date:"2026-10-19",categoryId:"groceries",amount:55,shared:true}],
   categories:[{id:"household-essential",name:"Essential household costs (estimate)",
    planned:670,type:"fixed" as const,priority:"essential" as const}],
   commitments:[{id:"rent",name:"Rent",amount:300,frequency:"monthly" as const,dueDate:"2026-11-01"}]
  };
  const get=mount(original);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
  expect(screen.getByRole("combobox",{name:"Choose one money fact"})).toHaveValue("other");
  fireEvent.change(screen.getByRole("spinbutton"),{target:{value:"120"}});
  fireEvent.click(screen.getByRole("button",{name:"Save this one fact"}));
  const after=get();
  expect(after.income).toBe(1500);
  expect(after.expenses).toEqual(original.expenses);
  expect(after.commitments).toEqual(original.commitments);
  expect(after.cashOnHand).toBe(300);
  expect(after.categories.find(c=>c.id==="household-essential")?.planned).toBe(670);
  expect(after.categories.find(c=>c.id==="household-flexible")?.planned).toBe(120);
  expect(after.categories).toHaveLength(2);
 });
 it("lets parents start with income or savings without requiring children's names or other amounts",()=>{
  const get=mount(sampleMoney());
  fireEvent.change(screen.getByRole("combobox",{name:"Choose one money fact"}),{target:{value:"income"}});
  expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
  fireEvent.change(screen.getByRole("spinbutton"),{target:{value:"0"}});
  fireEvent.click(screen.getByRole("button",{name:"Save this one fact"}));
  expect(screen.getByRole("alert")).toHaveTextContent("Zero income needs explicit confirmation");
  fireEvent.click(screen.getByRole("checkbox",{name:"I confirm current household income is zero"}));
  fireEvent.click(screen.getByRole("button",{name:"Save this one fact"}));
  expect(get()).toMatchObject({demo:false,income:0,incomeKnown:true,financialInputsPartial:true});
  expect(get().categories).toEqual([]);
 });
});
