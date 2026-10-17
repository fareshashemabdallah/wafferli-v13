import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {FamilyLifePage} from "@/routes/family";
import {sampleMembers} from "@/lib/money";

vi.mock("@tanstack/react-router",()=>({
 createFileRoute:()=>()=>({}),
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({
 AppShell:({children,title}:{children:ReactNode;title?:string})=><main><h1>{title}</h1>{children}</main>
}));
vi.mock("@/routes/plans",()=>({
 PlansWorkspace:({embedded}:{embedded?:boolean})=><section data-testid="embedded-plans" data-embedded={String(embedded)}>Real saved plans workspace</section>
}));
vi.mock("@/routes/calendar",()=>({
 FamilyCalendarWorkspace:({embedded,focusDate}:{embedded?:boolean;focusDate?:string})=><section data-testid="embedded-calendar" data-embedded={String(embedded)} data-focus={focusDate??""}>Real calendar workspace</section>
}));
vi.mock("@/components/FamilyTasksPanel",()=>({
 FamilyTasksPanel:()=> <section data-testid="embedded-tasks">Real family task editor</section>
}));
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
const draw=()=>render(<I18nProvider><FamilyLifePage/></I18nProvider>);

describe("Family Life: one pillar with all existing family functionality",()=>{
 it("offers one accessible in-page workspace for Calendar, Plans and Responsibilities",async()=>{
  draw();
  expect(screen.getByRole("heading",{level:1,name:"Family Life"})).toBeInTheDocument();
  const nav=screen.getByRole("navigation",{name:"Family Life sections"});
  expect(nav.querySelectorAll("button")).toHaveLength(4);
  fireEvent.click(screen.getByRole("button",{name:"Calendar"}));
  expect(screen.getByTestId("embedded-calendar")).toHaveAttribute("data-embedded","true");
  expect(screen.queryByTestId("embedded-plans")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Plans & activities"}));
  expect(screen.getByTestId("embedded-plans")).toHaveAttribute("data-embedded","true");
  fireEvent.click(screen.getByRole("button",{name:"Responsibilities"}));
  expect(screen.getByTestId("embedded-tasks")).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.familyCalendar")).toBeNull();
  expect(localStorage.getItem("wafferli.v13.familyPlans")).toBeNull();
 });
 it("uses actual saved profiles, dates and plans without showing sample family as real",async()=>{
  localStorage.setItem("wafferli.v13.members",JSON.stringify([...sampleMembers(),{
   id:"parent-1",name:"Mira",role:"adult",ageGroup:"30–44",prefs:""}]));
  const date=new Date();date.setDate(date.getDate()+2);
  const localDate=[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
  localStorage.setItem("wafferli.v13.familyCalendar",JSON.stringify([
   {id:"event1",title:"School recital",date:localDate,kind:"school",annual:false}
  ]));
  localStorage.setItem("wafferli.v13.familyPlans",JSON.stringify([
   {id:"trip1",title:"Visit grandparents",date:localDate,kind:"outing",status:"planning",
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
  ]));
  draw();
  await waitFor(()=>expect(screen.getByText("School recital")).toBeInTheDocument());
  expect(screen.getByText("Visit grandparents")).toBeInTheDocument();
  expect(screen.queryByText("Partner (sample)")).not.toBeInTheDocument();
  expect(screen.getByText("Family members").previousElementSibling).toHaveTextContent("1");
  expect(screen.getByRole("link",{name:"Manage family members"})).toHaveAttribute("href","/space");
  fireEvent.click(screen.getByRole("button",{name:"Prepare School recital"}));
  expect(screen.getByTestId("embedded-calendar")).toHaveAttribute("data-focus",localDate);
  expect(screen.queryByTestId("embedded-plans")).not.toBeInTheDocument();
 });
 it("keeps specialist family experiences available but not as extra global tabs",()=>{
  draw();
  fireEvent.click(screen.getByText("More family experiences"));
  expect(screen.getByRole("link",{name:"Outings"})).toHaveAttribute("href","/explore/weekend");
  expect(screen.getByRole("link",{name:"Celebrations"})).toHaveAttribute("href","/occasions");
  expect(screen.getByRole("link",{name:"Family & Friends Circles"})).toHaveAttribute("href","/community");
 });
});
