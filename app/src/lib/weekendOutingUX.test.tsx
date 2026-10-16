import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {WeekendOutingExperience} from "@/components/WeekendOutingExperience";
import {sampleMoney} from "@/lib/money";
import {localToday,futureDate} from "@/lib/cashflow";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({
 AppShell:({children,title}:{children:ReactNode;title?:string})=>
  <main><h1>{title}</h1>{children}</main>
}));
beforeEach(()=>{window.localStorage.clear();vi.restoreAllMocks()});
afterEach(()=>{cleanup();window.localStorage.clear();vi.restoreAllMocks()});
const draw=()=>render(<I18nProvider><WeekendOutingExperience/></I18nProvider>);
const real=()=>({...sampleMoney(),demo:false,income:2000,savingsTargetAmount:200,
 categories:[
  {id:"rent",name:"Rent",type:"fixed" as const,planned:330},
  {id:"food",name:"Groceries",type:"variable" as const,planned:55},
  {id:"out",name:"Family outings",type:"variable" as const,planned:100}
 ],expenses:[],cashOnHand:650,cashReserve:200,cashUpdatedAt:localToday(),
 commitments:[{id:"bill",name:"School",amount:330,frequency:"once" as const,
  dueDate:futureDate(localToday(),1),categoryId:"rent"}],
 incomeSources:[{id:"salary",name:"Salary",amount:2000,frequency:"monthly" as const,
  nextDate:futureDate(localToday(),15),shared:true}]
});
describe("one question -> one honest answer -> real activities",()=>{
 it("does not show a spendable amount for a demo household; offers discovery anyway",async()=>{
  draw();
  expect(await screen.findByText("Start with your family's actual monthly plan")).toBeInTheDocument();
  expect(screen.queryByText(/Suggested TOTAL outing planning ceiling/)).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Review one missing detail/})).toHaveAttribute("href","/money");
  expect(screen.getByRole("button",{name:"Show real mapped places"})).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("shows a backed planning cap and current record assumptions, not verified affordability",async()=>{
  const original=JSON.stringify(real());
  window.localStorage.setItem("wafferli.v13.money",original);
  draw();
  expect(await screen.findByText("A modest outing may fit your recorded plan")).toBeInTheDocument();
  expect(screen.getByText("Suggested TOTAL outing planning ceiling—not available cash")).toBeInTheDocument();
  expect(screen.getByText(/This is a cautious estimate/)).toBeInTheDocument();
  fireEvent.click(screen.getByText("Why this planning amount?"));
  expect(screen.getByText(/Remaining planned essentials/)).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Use .* in an outing plan/})).toHaveAttribute("href","/explore/together");
  expect(window.localStorage.getItem("wafferli.v13.money")).toBe(original);
 });
 it("asks for one actual cash balance rather than altering bank numbers silently",async()=>{
  const input={...real(),cashOnHand:null};
  window.localStorage.setItem("wafferli.v13.money",JSON.stringify(input));
  draw();
  expect(await screen.findByText("One thing is missing: today's cash balance")).toBeInTheDocument();
  expect(screen.queryByText(/Suggested TOTAL outing planning ceiling/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Cash and accessible bank balance today (JOD)"),{
   target:{value:"650"}
  });
  fireEvent.click(screen.getByRole("button",{name:"Save & reassess"}));
  expect(await screen.findByText("A modest outing may fit your recorded plan")).toBeInTheDocument();
  const saved=JSON.parse(window.localStorage.getItem("wafferli.v13.money")||"{}");
  expect(saved.cashOnHand).toBe(650);
  expect(saved.cashUpdatedAt).toBe(localToday());
  expect(saved.expenses).toEqual([]);
 });
 it("only fetches public mapped sources on request, and never invents price data",async()=>{
  vi.spyOn(globalThis,"fetch").mockResolvedValue({ok:true,json:async()=>({elements:[
   {id:55,type:"node",lat:31.95,lon:35.91,tags:{name:"City Park",leisure:"park"}}
  ]})} as Response);
  draw();
  expect(globalThis.fetch).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button",{name:"Show real mapped places"}));
  expect(await screen.findByText("City Park")).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Map source/})).toHaveAttribute("href","https://www.openstreetmap.org/node/55");
  expect(screen.getByText(/Price, child admission, opening hours and travel distance unverified/)).toBeInTheDocument();
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
 });
});
