import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {AppShell} from "@/components/AppShell";
import {FamilyStarterCard} from "@/components/FamilyStarterCard";
import {FamilyNextActions} from "@/components/FamilyNextActions";
import {GuidedFamilyAdvisor} from "@/components/GuidedFamilyAdvisor";
import {sampleMoney} from "@/lib/money";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,activeOptions:_,...props}:{to:string;children?:ReactNode;activeOptions?:unknown}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
beforeEach(()=>{window.localStorage.clear();vi.restoreAllMocks()});
afterEach(()=>{cleanup();window.localStorage.clear();vi.restoreAllMocks()});
const draw=(view:ReactNode)=>render(<I18nProvider>{view}</I18nProvider>);
const event={id:"school-gala",title:"School celebration",date:"2026-10-20",kind:"school",annual:false};
describe("Dabberna advice-first parent experience",()=>{
 it("shows all four connected family pillars while keeping settings and records reachable",()=>{
  draw(<AppShell><p>Family briefing</p></AppShell>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs){
   expect(within(nav).getAllByRole("link").map(x=>x.getAttribute("href"))).toEqual(["/","/money","/family","/advisor"]);
  }
  expect(screen.getAllByRole("link",{name:/Family & settings/}).length).toBeGreaterThan(0);
  expect(screen.getByText("Family briefing")).toBeInTheDocument();
 });
 it("does not require the parent to fill forms or enter sample financial records before asking for help",()=>{
  draw(<FamilyStarterCard/>);
  expect(screen.getByText("A few details help me do more for you")).toBeInTheDocument();
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Ask without setting up"})).toHaveAttribute("href","/advisor");
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("shows a plain-language monthly planning result after exactly three numbers, keeping all other data",async()=>{
  window.localStorage.setItem("wafferli.v13.familyCalendar",JSON.stringify([event]));
  vi.spyOn(window,"confirm").mockReturnValue(true);
  draw(<FamilyStarterCard/>);
  fireEvent.click(screen.getByRole("button",{name:/Add three numbers/}));
  fireEvent.change(screen.getByLabelText("Monthly income (JOD)"),{target:{value:"1500"}});
  fireEvent.change(screen.getByLabelText("Expected monthly expenses (JOD)"),{target:{value:"1100"}});
  fireEvent.change(screen.getByLabelText("Savings goal (JOD)"),{target:{value:"200"}});
  fireEvent.click(screen.getByRole("button",{name:"Show my first useful result"}));
  expect(await screen.findByText("You have room left in your monthly plan")).toBeInTheDocument();
  expect(screen.getByText(/200.00 JOD is still unassigned/)).toBeInTheDocument();
  const m=JSON.parse(window.localStorage.getItem("wafferli.v13.money")||"null");
  expect(m.demo).toBe(false);
  expect(m.income).toBe(1500);
  expect(m.expenses).toEqual([]);
  expect(JSON.parse(window.localStorage.getItem("wafferli.v13.familyCalendar")||"[]")).toEqual([event]);
 });
 it("creates one approved plan from an existing family event without another date form or expense",async()=>{
  window.localStorage.setItem("wafferli.v13.familyCalendar",JSON.stringify([event]));
  draw(<FamilyNextActions/>);
  expect(await screen.findByText("School celebration")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Prepare a plan from this date/}));
  expect(await screen.findByRole("link",{name:/Open existing plan/})).toBeInTheDocument();
  const plans=JSON.parse(window.localStorage.getItem("wafferli.v13.familyPlans")||"[]");
  expect(plans).toHaveLength(1);
  expect(plans[0]).toMatchObject({
   title:"School celebration",date:"2026-10-20",kind:"occasion",
   sourceRef:"occasion:school-gala@2026",status:"planning"
  });
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
  expect(window.localStorage.getItem("wafferli.v13.familyCalendar")).toBe(JSON.stringify([event]));
 });
 it("recognizes an already linked occasion plan and avoids asking to create another one",async()=>{
  window.localStorage.setItem("wafferli.v13.familyCalendar",JSON.stringify([event]));
  const existing={id:"already",title:event.title,date:event.date,kind:"occasion",status:"planning",
   sourceRef:"occasion:school-gala@2026",createdAt:"2026-10-15T10:00:00Z",updatedAt:"2026-10-15T10:00:00Z"};
  window.localStorage.setItem("wafferli.v13.familyPlans",JSON.stringify([existing]));
  draw(<FamilyNextActions/>);
  expect(await screen.findByRole("link",{name:/Open existing plan/})).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:/Prepare a plan from this date/})).not.toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem("wafferli.v13.familyPlans")||"[]")).toEqual([existing]);
 });
 it("makes question entry primary and advanced forms optional, without pretending live AI",()=>{
  draw(<GuidedFamilyAdvisor/>);
  expect(screen.getByRole("textbox",{name:"Or type your question"})).toBeInTheDocument();
  expect(screen.getByText(/connected generative AI is not active/)).toBeInTheDocument();
  expect(screen.getByText("Suggested questions & amount check (optional)")).toBeInTheDocument();
  const details=screen.getByText("Suggested questions & amount check (optional)").closest("details");
  expect(details).not.toHaveAttribute("open");
  expect(screen.getByRole("button",{name:"Ask"})).toBeDisabled();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
});
