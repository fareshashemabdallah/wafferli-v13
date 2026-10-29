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
 it("keeps weekly games inside Today without adding a new family workspace or saving child activity data",async()=>{
  put("members",[{id:"kid-3",name:"Child A",role:"child",ageGroup:"",prefs:"",ageYears:3},
   {id:"kid-5",name:"Child B",role:"child",ageGroup:"",prefs:"",ageYears:5}]);
  const before=localStorage.getItem("wafferli.v13.members");
  draw();
  const play=await screen.findByRole("region",{name:"This week's play"});
  expect(play.querySelectorAll('button[aria-expanded]')).toHaveLength(3);
  expect(play.querySelectorAll('svg[data-testid^="weekly-game-art-"]')).toHaveLength(3);
  expect(play).toHaveTextContent("Helps with");
  expect(screen.getAllByRole("region",{name:"Money at a glance"})).toHaveLength(1);
  fireEvent.click(play.querySelector('button[aria-expanded]')!);
  expect(play.querySelector('[aria-label="Game instructions"]')).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Why it matters"})).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.members")).toBe(before);
  expect(localStorage.getItem("wafferli.v13.playProgress")).toBeNull();
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("does not embed What Parents Say in Today; it has its own main destination",()=>{
  draw();
  expect(screen.queryByTestId("today-parents-say")).not.toBeInTheDocument();
  expect(screen.queryByRole("link",{name:/Explore What Parents Say/})).not.toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Family briefing"})).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.parentsSayReviews")).toBeNull();
 });
 it("renders the family artwork and exactly one family briefing, never the four money focus modes",async()=>{
  draw();
  expect(screen.getByRole("img",{name:"Illustrated family together"})).toHaveAttribute("src",expect.stringContaining("landing-family-characters.avif"));
  // Regression: a tall absolutely positioned image clipped above and below the old shallow hero.
  const hero=screen.getByLabelText("Dabberna family greeting");
  const illustration=screen.getByRole("img",{name:"Illustrated family together"});
  expect(hero.className).toContain("grid");
  expect(hero.className).toContain("min-h-[158px]");
  expect(illustration.className).toContain("object-contain");
  expect(illustration.className).toContain("max-h-[136px]");
  expect(illustration.className).not.toContain("absolute");
  expect(illustration.className).not.toContain("object-cover");

  expect(screen.getByRole("region",{name:"Family briefing"})).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Open my private weekly money story"})).not.toBeInTheDocument();
  expect(screen.queryByText("Understand, protect and prepare—so we can live well together.")).not.toBeInTheDocument();
  expect(screen.queryByText("More family options (optional)")).not.toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Quick family actions"})).toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Money at a glance"})).not.toHaveTextContent("••••");
  expect(screen.queryByRole("button",{name:/Show private amounts|Hide private amounts/})).not.toBeInTheDocument();
 });
 it("never presents invented sample currency or urgency without real saved records",async()=>{
  draw();
  await waitFor(()=>expect(screen.getByRole("region",{name:"Family briefing"})).toHaveTextContent("Nothing urgent in your saved family records."));
  expect(screen.queryByRole("region",{name:"No urgent next action"})).not.toBeInTheDocument();
  expect(screen.queryByTestId("today-one-action")).not.toBeInTheDocument();
  expect(screen.queryByText("Sophia's birthday")).not.toBeInTheDocument();
  expect(screen.queryByText("70 JOD")).not.toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Money at a glance"})).toHaveTextContent("Sample Money amounts are examples only");
 });
 it("shows saved gift plan amounts without requiring a reveal action",async()=>{
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
  expect(action).toHaveTextContent("Planned gift: 70 JOD");
  expect(action).toHaveTextContent("Not paid");
  expect(screen.getByText("Why this step?").closest("details")).not.toHaveAttribute("open");
  const continueLink=screen.getByRole("link",{name:/Compare gift options/});
  expect(continueLink).toHaveAttribute("href","/plans");
  fireEvent.click(continueLink);
  expect(JSON.parse(localStorage.getItem("wafferli.v13.activeFamilyPlanId")??"null")).toBe("plan1");
  expect(localStorage.getItem("wafferli.v13.money")).toContain('"expenses":[]');
  expect(screen.queryByRole("button",{name:/Show private amounts|Hide private amounts/})).not.toBeInTheDocument();
  expect(action).toHaveTextContent("70 JOD");
 });
 it("presents essential shortfalls with visible recorded amounts",async()=>{
  const money={...emptyRealMoney(),income:400,incomeKnown:true,categories:[
   {id:"rent",name:"Sensitive essential",type:"fixed" as const,planned:800,priority:"essential" as const}]};
  put("money",money);
  draw();
  const action=await screen.findByTestId("today-one-action");
  expect(action).toHaveTextContent("Review your family's money picture");
  expect(screen.getByRole("link",{name:/Review essentials and options/})).toHaveAttribute("href","/money");
  expect(screen.getByRole("region",{name:"Money at a glance"})).not.toHaveTextContent("••••");
 });
});
