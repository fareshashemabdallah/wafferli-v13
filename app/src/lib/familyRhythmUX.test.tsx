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
 it("uses three main areas with Ask available throughout",()=>{
  expect(familyDestinations.map(x=>x.to)).toEqual(["/","/money","/family"]);
  expect(familyDestinations.map(x=>x.shortEn)).toEqual(["Today","Money","Family"]);
 });
 it("gives Money, Decide, Calendar and About the same compact title treatment",()=>{
  for(const route of ["/money","/advisor","/calendar","/about"]){
   const {unmount}=render(<I18nProvider><RhythmPageHeader path={route} title="Chapter title"/></I18nProvider>);
   expect(screen.getByRole("heading",{name:"Chapter title",level:1})).toBeInTheDocument();
   expect(screen.getByRole("link",{name:"Today's story"})).toHaveAttribute("href","/");
   expect(screen.queryByText("Another path")).not.toBeInTheDocument();
   unmount();
  }
 });
 it("asks one grounded question first and keeps other methods collapsed and consent gated",()=>{
  render(<I18nProvider><Advisor/></I18nProvider>);
  expect(screen.getByTestId("guided-method")).toBeInTheDocument();
  const summary=screen.getByText("Optional: compare different ways forward");
  expect(summary.closest("details")).not.toHaveAttribute("open");
  expect(screen.getByTestId("decision-method")).toBeInTheDocument();
  expect(screen.queryByTestId("connected-method")).not.toBeInTheDocument();
 });
});
