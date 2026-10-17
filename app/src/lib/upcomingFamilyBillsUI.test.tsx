import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {cleanup,render,screen,within,waitFor,fireEvent} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {CashFlowPlanner} from "@/components/CashFlowPlanner";
import {useLocalState,writeLocal,readLocal} from "@/lib/storage";
import {emptyRealMoney,getMoneyOverview} from "@/lib/moneyOverview";
import type {MoneyState} from "@/lib/money";
import type {FamilyPlan} from "@/lib/familyPlans";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
const plan:FamilyPlan={
 id:"bday",title:"Sophia's birthday",kind:"occasion",status:"planning",date:"2027-02-17",
 createdAt:"2026-10-17T12:00:00.000Z",updatedAt:"2026-10-17T12:00:00.000Z",
 occasionPreparation:{
  gift:{description:"Science kit",amountJod:120,dueDate:"2026-11-20"},
  celebration:{amountJod:200,dueDate:"2027-02-02"},
  extras:{amountJod:30,dueDate:"2027-01-21"}
 }
};
const money:MoneyState={...emptyRealMoney(),income:1400,categories:[
 {id:"party",name:"Celebrations",type:"variable",planned:180}],
 commitments:[{id:"rent",name:"Rent",amount:450,frequency:"monthly",dueDate:"2026-10-20"}],
 cashOnHand:800};
const View=()=>{
 const [state,setState]=useLocalState("money",money);
 return <CashFlowPlanner state={state} members={[]} update={setState}/>;
};
beforeEach(()=>{
 localStorage.clear();
 writeLocal("familyPlans",[plan]);
 writeLocal("money",money);
});
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
describe("Family commitments appear directly within Upcoming Bills",()=>{
 it("shows calendar gift and celebration commitments inside the existing bills section, not only in a separate overview",async()=>{
  render(<I18nProvider><View/></I18nProvider>);
  const heading=screen.getByRole("heading",{name:/Upcoming bills/});
  const parent=heading.closest("section");
  expect(parent).not.toBeNull();
  const family=await within(parent!).findByRole("region",{name:"Family commitments from calendar"});
  expect(within(parent!).getByText("Rent")).toBeInTheDocument();
  expect(within(family).getByText("Sophia's birthday · Gift")).toBeInTheDocument();
  expect(within(family).getByText("Sophia's birthday · Celebration")).toBeInTheDocument();
  expect(within(family).getAllByText("2026-11-20",{exact:false}).length).toBeGreaterThan(0);
  expect(within(family).getByText("350 JOD")).toBeInTheDocument();
  expect(readLocal<MoneyState>("money",money).expenses).toHaveLength(0);
 });
 it("keeps changing the occasion in sync and removes paid items from Upcoming Bills",async()=>{
  render(<I18nProvider><View/></I18nProvider>);
  const bills=screen.getByRole("heading",{name:/Upcoming bills/}).closest("section")!;
  const family=await within(bills).findByRole("region",{name:"Family commitments from calendar"});
  const revised:FamilyPlan={...plan,occasionPreparation:{...plan.occasionPreparation!,
   gift:{...plan.occasionPreparation!.gift,amountJod:150}}};
  writeLocal("familyPlans",[revised]);
  await waitFor(()=>expect(within(family).getByText("380 JOD")).toBeInTheDocument());
  fireEvent.click(within(family).getAllByRole("button",{name:"I paid this"})[0]!);
  fireEvent.change(within(family).getByRole("combobox",{name:"Expense category"}),{target:{value:"party"}});
  fireEvent.change(within(family).getByRole("spinbutton",{name:"Actual amount paid (JOD)"}),{target:{value:"145"}});
  fireEvent.click(within(family).getByRole("button",{name:"Confirm paid expense"}));
  await waitFor(()=>expect(within(family).queryByText("Sophia's birthday · Gift")).not.toBeInTheDocument());
  expect(within(family).getByText("230 JOD")).toBeInTheDocument();
  expect(readLocal<MoneyState>("money",money).expenses).toHaveLength(1);
  expect(readLocal<MoneyState>("money",money).savingsGoals).toBeUndefined();
 });
 it("counts family-only dated items as a financial commitment without treating it as a savings target or paid expense",()=>{
  const noRent={...money,commitments:[],cashOnHand:500};
  const snapshot=getMoneyOverview(noRent,new Date(2026,10,19,12),[plan]);
  expect(snapshot.hasBillSchedule).toBe(true);
  expect(snapshot.forecast.upcomingBills).toBe(120);
  expect(snapshot.cashAfterBills).toBe(380);
  expect(snapshot.month.spent).toBe(0);
  expect(noRent.expenses).toHaveLength(0);
 });
});
