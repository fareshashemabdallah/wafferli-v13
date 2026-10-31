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
const dateKey=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const inDays=(days:number)=>{const date=new Date();date.setDate(date.getDate()+days);return dateKey(date);};

describe("Family Life: one upcoming action and four direct destinations",()=>{
 it("opens the existing calendar, plans and tasks without duplicate tabs or writes",()=>{
  draw();
  expect(screen.getByRole("heading",{level:1,name:"Family"})).toBeInTheDocument();
  expect(screen.getByTestId("family-simple-hub")).toBeInTheDocument();
  expect(screen.queryByRole("navigation",{name:"Family Life sections"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Special moments/}));
  expect(screen.getByTestId("embedded-calendar")).toHaveAttribute("data-embedded","true");
  fireEvent.click(screen.getByRole("button",{name:"Family home"}));
  fireEvent.click(screen.getByRole("button",{name:/Our plans/}));
  expect(screen.getByTestId("embedded-plans")).toHaveAttribute("data-embedded","true");
  fireEvent.click(screen.getByRole("button",{name:"Family home"}));
  fireEvent.click(screen.getByRole("button",{name:/Family tasks/}));
  expect(screen.getByTestId("embedded-tasks")).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.familyCalendar")).toBeNull();
  expect(localStorage.getItem("wafferli.v13.familyPlans")).toBeNull();
 });
 it("shows one real upcoming moment while keeping saved profiles and plans unchanged",async()=>{
  localStorage.setItem("wafferli.v13.members",JSON.stringify([...sampleMembers(),{
   id:"parent-1",name:"Mira",role:"adult",ageGroup:"30–44",prefs:""
  }]));
  const date=inDays(2);
  const event={id:"event1",title:"School recital",date,kind:"school",annual:false};
  const trip={id:"trip1",title:"Visit grandparents",date,kind:"outing",status:"planning",
   createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  localStorage.setItem("wafferli.v13.familyCalendar",JSON.stringify([event]));
  localStorage.setItem("wafferli.v13.familyPlans",JSON.stringify([trip]));
  draw();
  await waitFor(()=>expect(screen.getByText("School recital")).toBeInTheDocument());
  expect(screen.queryByText("Partner (sample)")).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Family members Profiles and preferences/})).toHaveAttribute("href","/space");
  fireEvent.click(screen.getByRole("button",{name:"Prepare this moment"}));
  expect(screen.getByTestId("embedded-calendar")).toHaveAttribute("data-focus",date);
  expect(localStorage.getItem("wafferli.v13.familyPlans")).toBe(JSON.stringify([trip]));
  fireEvent.click(screen.getByRole("button",{name:"Family home"}));
  fireEvent.click(screen.getByRole("button",{name:/Our plans/}));
  expect(screen.getByTestId("embedded-plans")).toBeInTheDocument();
 });
 it("uses the corrected birthday and does not rewrite the linked plan or calendar",async()=>{
  const oldDate=inDays(3),newDate=inDays(8);
  localStorage.setItem("wafferli.v13.members",JSON.stringify([
   {id:"child-1",name:"Sophie",role:"child",ageGroup:"",prefs:"",birthdayMonthDay:newDate.slice(5)}
  ]));
  const stale={id:"gift-1",kind:"occasion",title:"Sophia's birthday",status:"planning",
   date:oldDate,sourceRef:"occasion:member-birthday:child-1@"+newDate.slice(0,4),
   budgetJod:85,createdAt:"2026-01-01T12:00:00Z",updatedAt:"2026-01-01T12:00:00Z"};
  localStorage.setItem("wafferli.v13.familyPlans",JSON.stringify([stale]));
  draw();
  await waitFor(()=>expect(screen.getByText("Sophie's birthday")).toBeInTheDocument());
  expect(screen.queryByText("Sophia's birthday")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Prepare this moment"}));
  expect(screen.getByTestId("embedded-calendar")).toHaveAttribute("data-focus",newDate);
  expect(localStorage.getItem("wafferli.v13.familyPlans")).toBe(JSON.stringify([stale]));
  expect(localStorage.getItem("wafferli.v13.familyCalendar")).toBeNull();
 });
 it("keeps celebrations through the real calendar, without retired experience menus",()=>{
  draw();
  expect(screen.queryByText("More family experiences")).not.toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Outings"})).not.toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Family & Friends Circles"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Special moments/}));
  expect(screen.getByTestId("embedded-calendar")).toBeInTheDocument();
 });
});
