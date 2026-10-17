import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {FocusedFamilyHome} from "@/components/FocusedFamilyHome";
import {dateKey,shiftDays} from "@/lib/familyCalendar";
import {sampleMoney,type MoneyState} from "@/lib/money";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,activeOptions:_,...props}:{to:string;children?:ReactNode;activeOptions?:unknown}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
 <a {...props} href={to}>{children}</a>
}));
vi.mock("@/components/TodayFamilyBrief",()=>({
 TodayFamilyBrief:({compact}:{compact?:boolean})=><section data-testid="single-priority" data-compact={String(compact)}>One saved-data priority when relevant</section>
}));
vi.mock("@/components/FamilyWeather",()=>({
 FamilyWeather:({compact}:{compact?:boolean})=><section data-testid="tiny-weather" data-compact={String(compact)}>Weather only when enabled</section>
}));
const put=(key:string,data:unknown)=>localStorage.setItem("wafferli.v13."+key,JSON.stringify(data));
const draw=()=>render(<I18nProvider><FocusedFamilyHome/></I18nProvider>);
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
describe("20-second Dabberna parent home",()=>{
 it("shows the illustrated welcome only for genuinely new households and keeps fast actions accessible",async()=>{
  draw();
  await screen.findByRole("region",{name:"Welcome to Dabberna"});
  expect(screen.getByRole("img",{name:"Friendly cartoon illustration of a family"})).toHaveAttribute("src",expect.stringContaining("family-hero-cartoon.avif"));
  expect(screen.getByRole("region",{name:"Quick family actions"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Start my day"}));
  await waitFor(()=>expect(screen.queryByRole("region",{name:"Welcome to Dabberna"})).not.toBeInTheDocument());
  expect(JSON.parse(localStorage.getItem("wafferli.v13.focusedTodayWelcomeDone")??"false")).toBe(true);
  expect(screen.queryByText("Our Plans")).not.toBeInTheDocument();
  expect(screen.queryByText("Shopping & Wishlist")).not.toBeInTheDocument();
 });
 it("skips the welcome for households with real saved finances, dates and lists, and shows recorded data",async()=>{
  const now=new Date();
  const money:MoneyState={...sampleMoney(),demo:false,expenses:[{
   id:"paid",date:dateKey(now),categoryId:"groc",amount:21.5,shared:false,status:"paid"
  }]};
  put("money",money);
  put("familyCalendar",[{id:"school",title:"School recital",date:dateKey(shiftDays(now,3)),kind:"school",annual:false}]);
  put("shopping",[{id:"milk",name:"Milk",price:0,qty:1,done:false}]);
  draw();
  await waitFor(()=>expect(screen.queryByRole("region",{name:"Welcome to Dabberna"})).not.toBeInTheDocument());
  expect(screen.getByText("21.5 JOD")).toBeInTheDocument();
  expect(screen.getByText("School recital")).toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Financial picture"})).toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Next family occasion"})).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/See this date/})).toHaveAttribute("href","/calendar");
  expect(screen.getByTestId("single-priority")).toHaveAttribute("data-compact","true");
  expect(screen.queryByText("Fixed expenses")).not.toBeInTheDocument();
  expect(screen.queryByText("Detailed category view")).not.toBeInTheDocument();
 });
 it("keeps a discreet finance empty state instead of exposing sample household figures",async()=>{
  draw();
  await screen.findByText(/Your real monthly figures are not set up yet/);
  expect(screen.queryByText("1,200 JOD")).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Set up my money/})).toHaveAttribute("href","/money");
  expect(screen.queryByRole("region",{name:"Next family occasion"})).not.toBeInTheDocument();
 });
 it("opens an in-page guided question using real saved context, without navigating",async()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Jump to Ask Dabberna"}));
  fireEvent.change(screen.getByRole("textbox",{name:"Ask about your family"}),{
   target:{value:"How are our savings goals?"}
  });
  fireEvent.click(screen.getByRole("button",{name:"Get family guidance"}));
  await waitFor(()=>expect(screen.getByText("How are our savings goals?")).toBeInTheDocument());
  expect(screen.getByText(/not connected generative AI/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Add shopping item"}));
  expect(screen.queryByRole("region",{name:"Ask your family question"})).not.toBeInTheDocument();
 });
 it("respects the parent's opt-out of family weather",async()=>{
  put("familyPreferences",{weather:false,lifestyle:false,financeTips:false,billReminders:false,shoppingTips:false,notificationFrequency:"off",city:"Amman",distanceKm:15,outingLimit:50});
  draw();
  await screen.findByRole("region",{name:"Quick family actions"});
  expect(screen.queryByTestId("tiny-weather")).not.toBeInTheDocument();
 });
});
