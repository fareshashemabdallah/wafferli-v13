import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {FamilyCommitmentsPanel} from "@/components/FamilyCommitmentsPanel";
import {readLocal,useLocalState,writeLocal} from "@/lib/storage";
import {emptyRealMoney} from "@/lib/moneyOverview";
import type {MoneyState} from "@/lib/money";
import type {FamilyPlan} from "@/lib/familyPlans";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
const plan:FamilyPlan={
 id:"birthday-plan",title:"Sophia's birthday",kind:"occasion",status:"planning",
 date:"2027-02-17",createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-01T00:00:00.000Z",
 occasionPreparation:{
  gift:{description:"Science kit",amountJod:120,dueDate:"2026-11-20"},
  celebration:{amountJod:200,dueDate:"2027-02-03"},
  extras:{amountJod:30,dueDate:"2027-02-10"}
 }};
const actual:MoneyState={
 ...emptyRealMoney(),income:1200,categories:[{id:"fun",name:"Family fun",type:"variable",planned:150}]
};
const View=()=>{
 const [money]=useLocalState<MoneyState>("money",actual);
 return <FamilyCommitmentsPanel money={money}/>;
};
beforeEach(()=>{localStorage.clear();writeLocal("familyPlans",[plan]);writeLocal("money",actual)});
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
describe("Our Money auto-linked family commitments",()=>{
 it("shows and reconciles the existing saved occasion without storing planned expenses or savings",async()=>{
  render(<I18nProvider><View/></I18nProvider>);
  expect(await screen.findByRole("region",{name:"Upcoming family commitments"})).toBeInTheDocument();
  expect(screen.getByText("350 JOD")).toBeInTheDocument();
  expect(screen.getByText("Sophia's birthday · Gift")).toBeInTheDocument();
  expect(readLocal<MoneyState>("money",actual).expenses).toHaveLength(0);
  fireEvent.click(screen.getAllByRole("button",{name:"I paid this"})[0]!);
  fireEvent.change(screen.getByRole("combobox",{name:"Expense category"}),{target:{value:"fun"}});
  fireEvent.change(screen.getByRole("spinbutton",{name:"Actual amount paid (JOD)"}),{target:{value:"125"}});
  fireEvent.click(screen.getByRole("button",{name:"Confirm paid expense"}));
  await waitFor(()=>expect(screen.getByText("230 JOD")).toBeInTheDocument());
  expect(readLocal<MoneyState>("money",actual).expenses).toMatchObject([{
   amount:125,sourcePlanId:"birthday-plan",sourceOccasionCost:"gift",status:"paid",categoryId:"fun"
  }]);
  expect(readLocal<MoneyState>("money",actual).cashOnHand).toBeNull();
  expect(readLocal<MoneyState>("money",actual).savingsGoals).toBeUndefined();
  expect(screen.getAllByText("Paid")).toHaveLength(1);
  expect(screen.getAllByRole("button",{name:"I paid this"})).toHaveLength(2);
  const changed:FamilyPlan={...plan,occasionPreparation:{...plan.occasionPreparation!,
   celebration:{...plan.occasionPreparation!.celebration,amountJod:250}}};
  writeLocal("familyPlans",[changed]);
  await waitFor(()=>expect(screen.getByText("280 JOD")).toBeInTheDocument());
  expect(readLocal<MoneyState>("money",actual).expenses).toHaveLength(1);
 });
});
