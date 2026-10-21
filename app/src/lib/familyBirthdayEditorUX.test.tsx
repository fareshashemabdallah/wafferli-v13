import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {Space} from "@/routes/space";
import type {Member} from "./money";

vi.mock("@tanstack/react-router",()=>({
 createFileRoute:()=> (options:unknown)=>options,
 Link:({to,children,...rest}:{to:string;children:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...rest}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({
 AppShell:({children,title}:{children:ReactNode;title:string})=><main><h1>{title}</h1>{children}</main>,
 Notice:({children}:{children:ReactNode})=><div>{children}</div>,
 PilotBadge:({children}:{children:ReactNode})=><span>{children}</span>
}));
vi.mock("@/components/FamilyPreferences",()=>({FamilyPreferences:()=>null}));
vi.mock("@/components/FamilyBasicsQuickInput",()=>({FamilyBasicsQuickInput:()=>null}));
vi.mock("@/components/LocalExpensePrivacyReview",()=>({LocalExpensePrivacyReview:()=>null}));
vi.mock("@/components/FamilyTasksPanel",()=>({FamilyTasksPanel:()=>null}));

beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
describe("iPhone-safe birthday choices and optional age precision",()=>{
 it("creates a child's full birthday from 3 selectors without requiring a typed dash",()=>{
  render(<I18nProvider><Space/></I18nProvider>);
  const box=document.getElementById("household-members")!;
  fireEvent.click(within(box).getByRole("button",{name:"Add"}));
  fireEvent.change(within(box).getByLabelText("Name"),{target:{value:"Child Example"}});
  fireEvent.change(within(box).getByLabelText("Role"),{target:{value:"child"}});
  expect(within(box).queryByPlaceholderText("MM-DD")).not.toBeInTheDocument();
  fireEvent.change(within(box).getByRole("combobox",{name:"Birth month"}),{target:{value:"10"}});
  fireEvent.change(within(box).getByRole("combobox",{name:"Birth day"}),{target:{value:"15"}});
  fireEvent.change(within(box).getByRole("combobox",{name:"Optional birth year"}),{target:{value:"2025"}});
  expect(within(box).getByText(/Calculated age today:/)).toBeInTheDocument();
  fireEvent.click(within(box).getByRole("button",{name:"Save"}));
  const saved=JSON.parse(localStorage.getItem("wafferli.v13.members")??"[]") as Member[];
  expect(saved.find(m=>m.name==="Child Example")).toMatchObject({
   role:"child",birthday:"2025-10-15",birthdayMonthDay:"10-15"
  });
  const child=saved.find(m=>m.name==="Child Example")!;
  expect(child.ageYears).toBeUndefined();
  expect(within(box).getByText("Child Example")).toBeInTheDocument();
 });
 it("allows month/day-only birthdays for families who do not wish to provide age",()=>{
  render(<I18nProvider><Space/></I18nProvider>);
  const box=document.getElementById("household-members")!;
  fireEvent.click(within(box).getByRole("button",{name:"Add"}));
  fireEvent.change(within(box).getByLabelText("Name"),{target:{value:"Private Birthday"}});
  fireEvent.change(within(box).getByRole("combobox",{name:"Birth month"}),{target:{value:"02"}});
  fireEvent.change(within(box).getByRole("combobox",{name:"Birth day"}),{target:{value:"17"}});
  fireEvent.click(within(box).getByRole("button",{name:"Save"}));
  const saved=JSON.parse(localStorage.getItem("wafferli.v13.members")??"[]") as Member[];
  expect(saved.find(m=>m.name==="Private Birthday")).toMatchObject({birthdayMonthDay:"02-17"});
  expect(saved.find(m=>m.name==="Private Birthday")?.birthday).toBeUndefined();
 });
});
