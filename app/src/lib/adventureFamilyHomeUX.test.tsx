import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,fireEvent,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {AdventureFamilyHome} from "@/components/AdventureFamilyHome";
import {emptyRealMoney} from "./moneyOverview";
import {dateKey,shiftDays} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";
vi.mock("@tanstack/react-router",()=>({
 useNavigate:()=>vi.fn(),
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear()});
const put=(key:string,value:unknown)=>localStorage.setItem("wafferli.v13."+key,JSON.stringify(value));
const draw=()=>render(<I18nProvider><AdventureFamilyHome/></I18nProvider>);
describe("Calm contextual Today redesign",()=>{
 it("renders the family artwork and exactly one family briefing, never the four money focus modes",async()=>{
  draw();
  expect(screen.getByRole("img",{name:"Illustrated family together"})).toHaveAttribute("src",expect.stringContaining("landing-family-characters.avif"));
  expect(screen.getByRole("region",{name:"Family briefing"})).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Open my private weekly money story"})).not.toBeInTheDocument();
  expect(screen.queryByText("Understand, protect and prepare—so we can live well together.")).not.toBeInTheDocument();
  expect(screen.queryByText("More family options (optional)")).not.toBeInTheDocument();
  expect(screen.queryByRole("region",{name:"Quick family actions"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("This week & money · optional details"));
  expect(screen.getByRole("region",{name:"Money at a glance"})).toHaveTextContent("••••");
 });
 it("never presents invented sample currency or urgency without real saved records",async()=>{
  draw();
  await waitFor(()=>expect(screen.getByRole("region",{name:"No urgent next action"})).toBeInTheDocument());
  expect(screen.queryByTestId("today-one-action")).not.toBeInTheDocument();
  expect(screen.queryByText("Sophia's birthday")).not.toBeInTheDocument();
  expect(screen.queryByText("70 JOD")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("This week & money · optional details"));
  expect(screen.getByRole("region",{name:"Money at a glance"})).not.toHaveTextContent("1,200 JOD");
  expect(screen.getByRole("region",{name:"Money at a glance"})).toHaveTextContent("Only sample money is saved");
 });
 it("offers one optional family idea on an empty profile and passes only a short category intent",async()=>{
  draw();
  await waitFor(()=>expect(screen.getByRole("region",{name:"No urgent next action"})).toBeInTheDocument());
  expect(screen.getByText("How about time outdoors?")).toBeInTheDocument();
  const idea=screen.getByRole("link",{name:/Find ideas without setup/});
  expect(idea).toHaveAttribute("href","/explore");
  fireEvent.click(idea);
  const intent=JSON.parse(localStorage.getItem("wafferli.v13.oneTapDiscoverIntent")??"null");
  expect(intent).toMatchObject({kind:"park"});
  expect(Object.keys(intent).sort()).toEqual(["kind","requestedAt"]);
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
  expect(localStorage.getItem("wafferli.v13.members")).toBeNull();
 });
 it("reuses the exact birthday gift plan with one click and only reveals private amounts on request",async()=>{
  const date=dateKey(shiftDays(new Date(),6));
  const sourceRef="occasion:bday@"+date.slice(0,4);
  const plan:FamilyPlan={id:"plan1",title:"Family birthday",kind:"occasion",status:"planning",
   createdAt:"2026-10-01T10:00:00.000Z",updatedAt:"2026-10-01T10:00:00.000Z",
   date,sourceRef,occasionPreparation:{gift:{description:"Science kit",amountJod:70,dueDate:date},
    celebration:{amountJod:0,dueDate:date},extras:{amountJod:0,dueDate:date}}};
  put("money",emptyRealMoney());
  put("familyCalendar",[{id:"bday",title:"Birthday from calendar",kind:"birthday",date,annual:false}]);
  put("familyPlans",[plan]);
  draw();
  const action=await screen.findByTestId("today-one-action");
  expect(action).toHaveTextContent("Birthday from calendar");
  expect(action).toHaveTextContent("Planned gift: Hidden");
  const continueLink=screen.getByRole("link",{name:/Compare gift options/});
  expect(continueLink).toHaveAttribute("href","/explore/smartbuy");
  fireEvent.click(continueLink);
  expect(JSON.parse(localStorage.getItem("wafferli.v13.activeFamilyPlanId")??"null")).toBe("plan1");
  expect(localStorage.getItem("wafferli.v13.money")).toContain('"expenses":[]');
  fireEvent.click(screen.getByText("This week & money · optional details"));
  fireEvent.click(screen.getByRole("button",{name:"Show private amounts"}));
  expect(action).toHaveTextContent("70 JOD");
  expect(screen.getByRole("button",{name:"Hide private amounts"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Hide private amounts"}));
  expect(action).toHaveTextContent("Planned gift: Hidden");
 });
 it("presents essential shortfalls as the main task without exposing money amounts",async()=>{
  const money={...emptyRealMoney(),income:400,incomeKnown:true,categories:[
   {id:"rent",name:"Sensitive essential",type:"fixed" as const,planned:800,priority:"essential" as const}]};
  put("money",money);
  draw();
  const action=await screen.findByTestId("today-one-action");
  expect(action).toHaveTextContent("Review your family's money picture");
  expect(screen.getByRole("link",{name:/Review essentials and options/})).toHaveAttribute("href","/money");
  fireEvent.click(screen.getByText("This week & money · optional details"));
  expect(screen.getByRole("region",{name:"Money at a glance"})).toHaveTextContent("••••");
 });
});
