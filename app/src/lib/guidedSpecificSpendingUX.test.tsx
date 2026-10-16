import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {GuidedFamilyAdvisor} from "@/components/GuidedFamilyAdvisor";
import {I18nProvider} from "@/lib/i18n";
import {sampleMoney} from "@/lib/money";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});

describe("parent's one-field spending check",()=>{
 it("shows a direct entry with a clear limitation, not a false connected-AI claim",async()=>{
  render(<I18nProvider><GuidedFamilyAdvisor/></I18nProvider>);
  fireEvent.click(screen.getByText("Suggested questions & amount check (optional)"));
  const field=await screen.findByRole("spinbutton",{name:"Proposed spending amount JOD"});
  expect(field).toHaveAttribute("type","number");
  expect(screen.getByText(/without recording a payment/)).toBeInTheDocument();
  fireEvent.change(field,{target:{value:"40"}});
  fireEvent.click(screen.getByRole("button",{name:/Check amount/}));
  expect(await screen.findByText("We need a few more real figures")).toBeInTheDocument();
  expect(screen.getByText(/Demo finances cannot be used/)).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("uses entered real numbers while preserving the original financial record",async()=>{
  const real={...sampleMoney(),demo:false,income:2000,cashOnHand:1000,
   cashReserve:300,cashUpdatedAt:"2026-10-16",
   commitments:[{id:"due",name:"School",frequency:"once" as const,amount:300,dueDate:"2026-10-20"}],
   incomeSources:[{id:"income",name:"Salary",frequency:"monthly" as const,amount:2000,nextDate:"2026-10-30",shared:true}]
  };
  const serialized=JSON.stringify(real);
  window.localStorage.setItem("wafferli.v13.money",serialized);
  render(<I18nProvider><GuidedFamilyAdvisor/></I18nProvider>);
  fireEvent.click(screen.getByText("Suggested questions & amount check (optional)"));
  const input=await screen.findByRole("spinbutton",{name:"Proposed spending amount JOD"});
  fireEvent.change(input,{target:{value:"650"}});
  fireEvent.click(screen.getByRole("button",{name:/Check amount/}));
  expect(await screen.findByText("This cost may put your finances under pressure")).toBeInTheDocument();
  expect(screen.getByText(/650\.00 JOD/)).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBe(serialized);
  expect(window.localStorage.getItem("wafferli.v13.familyPlans")).toBeNull();
 });
});
