import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,fireEvent} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {AdventureFamilyHome} from "@/components/AdventureFamilyHome";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/TodayFamilyBrief",()=>({TodayFamilyBrief:()=> <span>Family brief</span>}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear()});
const renderWorld=()=>render(<I18nProvider><AdventureFamilyHome/></I18nProvider>);
describe("The Dabberna family adventure world",()=>{
 it("keeps the entire family portrait in its own mobile area below the greeting",()=>{
  renderWorld();
  const hero=screen.getByRole("region",{name:"Welcome to your family adventure"});
  const greeting=screen.getByTestId("adventure-family-greeting");
  const portraits=screen.getByTestId("adventure-family-portrait-area");
  const image=screen.getByRole("img",{name:"Cartoon family with two parents and children"});
  expect(hero).toHaveClass("adventure-family-hero");
  expect(greeting.parentElement).toBe(hero);
  expect(portraits.parentElement).toBe(hero);
  expect(greeting).toHaveClass("adventure-family-hero__greeting");
  expect(portraits).toHaveClass("adventure-family-hero__art");
  expect(portraits).toContainElement(image);
  expect(greeting).not.toContainElement(image);
  expect(greeting.compareDocumentPosition(portraits)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText("How can our money care for our family?")).toBeInTheDocument();
  expect(screen.getByText("Understand, protect and prepare—so we can live well together.")).toBeInTheDocument();
 });
 it("opens the three parent questions and retains calendar and advisor links",()=>{
  renderWorld();
  expect(screen.getByRole("heading",{name:/Dabberna/})).toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Welcome to your family adventure"})).toBeInTheDocument();
  for(const [name,route] of [
   ["Find something to enjoy","/explore/weekend"],
   ["Choose what to buy","/explore/smartbuy"],
   ["Prepare a family moment","/calendar"]
  ] as const)expect(screen.getByRole("link",{name:new RegExp(name)})).toHaveAttribute("href",route);
  expect(screen.queryByRole("link",{name:"Ask Dabberna"})).not.toBeInTheDocument();
  expect(screen.getByRole("img",{name:"Cartoon family with two parents and children"})).toHaveAttribute("src",expect.stringContaining("landing-family-characters.avif"));
  expect(screen.queryByText("1,200 JOD")).not.toBeInTheDocument();
  expect(screen.getByRole("region",{name:"Your family\u0027s money story"})).toBeInTheDocument();
  expect(screen.queryByText("FAMILY ACTIVITY IDEAS")).not.toBeInTheDocument();
 });
 it("shows recorded family data only in its optional private update area",()=>{
  localStorage.setItem("wafferli.v13.money",JSON.stringify({
   demo:false,income:1700,savingsPct:0,categories:[{id:"groc",name:"Groceries",type:"variable",planned:280}],
   expenses:[{id:"actual",date:new Date().toISOString().slice(0,7)+"-02",categoryId:"groc",amount:15,shared:false,status:"paid"}]
  }));
  renderWorld();
  expect(screen.getByText(/15 JOD in paid entries/).closest("details")).not.toHaveAttribute("open");
  fireEvent.click(screen.getByText("A little update from your family world (optional)"));
  expect(screen.getByText(/paid entries this month/).closest("details")).toHaveAttribute("open");
 });
});
