import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,waitFor} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {LandingDesignPreview} from "@/components/LandingDesignPreview";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
const draw=()=>render(<I18nProvider><LandingDesignPreview/></I18nProvider>);
describe("Dabberna landing design test preview",()=>{
 it("renders the new artistic layout with functional feature links and a way back",()=>{
  draw();
  expect(screen.getByRole("img",{name:/Cartoon mother and father/})).toHaveAttribute("src",expect.stringContaining("landing-family-characters.avif"));
  expect(screen.getByRole("heading",{name:/A calmer, brighter tomorrow for your family/})).toBeInTheDocument();
  expect(screen.getByRole("navigation",{name:"Explore family features"}).querySelectorAll("a")).toHaveLength(6);
  expect(screen.getAllByRole("link",{name:/Ask Dabberna/}).some(x=>x.getAttribute("href")==="/advisor")).toBe(true);
  expect(screen.getAllByRole("link",{name:/Current homepage|Back to current home/}).some(x=>x.getAttribute("href")?.endsWith("#/"))).toBe(true);
 });
 it("keeps unentered financial and occasion data empty, rather than using demo figures",async()=>{
  draw();
  await waitFor(()=>expect(screen.getByText(/Enter your household finances once/)).toBeInTheDocument());
  expect(screen.queryByText("3,420 JOD")).not.toBeInTheDocument();
  expect(screen.queryByText("Faris - Football Training")).not.toBeInTheDocument();
  expect(screen.queryByText("1,650 JOD")).not.toBeInTheDocument();
 });
 it("shows existing fixed/variable/periodic categories rather than a fake mockup amount",async()=>{
  localStorage.setItem("wafferli.v13.money",JSON.stringify({
   demo:false,income:2400,categories:[
    {id:"housing",name:"Housing",type:"fixed",planned:650},
    {id:"food",name:"Groceries",type:"variable",planned:320},
    {id:"school",name:"School",type:"periodic",planned:140}
   ],expenses:[]
  }));
  draw();
  await waitFor(()=>expect(screen.getAllByText("1,110 JOD").length).toBeGreaterThan(0));
  expect(screen.getByText("Fixed expenses")).toBeInTheDocument();
  expect(screen.getByText("Variable expenses")).toBeInTheDocument();
  expect(screen.getByText("Periodic expenses")).toBeInTheDocument();
  expect(screen.getByText("650 JOD")).toBeInTheDocument();
 });
});
