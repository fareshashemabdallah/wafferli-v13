import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {RhythmPageHeader} from "@/components/RhythmPageHeader";
import {Advisor} from "@/routes/advisor";
import {familyDestinations} from "./familyNavigation";
vi.mock("@tanstack/react-router",()=>({
 createFileRoute:()=>()=>({}),
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=><a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({AppShell:({title,children}:{title?:string;children:ReactNode})=><main><h1>{title}</h1>{children}</main>}));
vi.mock("@/components/SixPillarDecisionStudio",()=>({SixPillarDecisionStudio:()=> <section data-testid="decision-method">Local decisions</section>}));
vi.mock("@/components/GuidedFamilyAdvisor",()=>({GuidedFamilyAdvisor:()=> <section data-testid="guided-method">Specific question</section>}));
vi.mock("@/components/LiveFamilyAdvisor",()=>({LiveFamilyAdvisor:()=> <section data-testid="connected-method">Consented AI</section>}));
vi.mock("@/lib/liveAiClient",()=>({LIVE_AI_UI_ENABLED:false}));
afterEach(cleanup);
describe("Dabberna one rhythm across pages",()=>{
 it("uses the same four main chapters with no duplicate route",()=>{
  expect(familyDestinations.map(x=>x.to)).toEqual(["/","/money","/advisor","/family"]);
  expect(familyDestinations.map(x=>x.shortEn)).toEqual(["Today","Money","Decide","Plans"]);
 });
 it("gives Money, Decide, Calendar and shopping the same compact title treatment",()=>{
  for(const route of ["/money","/advisor","/calendar","/explore/smartbuy"]){
   const {unmount}=render(<I18nProvider><RhythmPageHeader path={route} title="Chapter title"/></I18nProvider>);
   expect(screen.getByRole("heading",{name:"Chapter title",level:1})).toBeInTheDocument();
   expect(screen.getByRole("link",{name:"Today's story"})).toHaveAttribute("href","/");
   expect(screen.queryByText("Another path")).not.toBeInTheDocument();
   unmount();
  }
 });
 it("shows only one advisor method, not simultaneous overlapping assistants",()=>{
  render(<I18nProvider><Advisor/></I18nProvider>);
  expect(screen.getByTestId("decision-method")).toBeInTheDocument();
  expect(screen.queryByTestId("guided-method")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Ask about my records"}));
  expect(screen.getByTestId("guided-method")).toBeInTheDocument();
  expect(screen.queryByTestId("decision-method")).not.toBeInTheDocument();
  expect(screen.queryByTestId("connected-method")).not.toBeInTheDocument();
 });
});
