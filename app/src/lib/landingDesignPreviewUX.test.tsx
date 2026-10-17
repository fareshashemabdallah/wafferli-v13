import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {LandingDesignPreview} from "@/components/LandingDesignPreview";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
beforeEach(()=>{window.localStorage.clear()});
afterEach(()=>{cleanup();window.localStorage.clear();vi.restoreAllMocks()});
const draw=()=>render(<I18nProvider><LandingDesignPreview/></I18nProvider>);

describe("opt-in illustrated landing experience",()=>{
 it("contains the approved illustrated family, six real feature links and current-home escape",()=>{
  draw();
  const image=screen.getByRole("img",{name:/Cartoon mother and father smiling/});
  expect(image).toHaveAttribute("src",expect.stringContaining("landing-family-characters.avif"));
  expect(screen.getByRole("heading",{name:/A calmer, brighter tomorrow for your family/})).toBeInTheDocument();
  const nav=screen.getByRole("navigation",{name:"Explore family features"});
  const features=[...nav.querySelectorAll("a")];
  expect(features).toHaveLength(6);
  expect(features[0]?.getAttribute("href")?.endsWith("#/")).toBe(true);
  expect(features[2]).toHaveAttribute("href","/explore/smartbuy");
  expect(screen.getByRole("link",{name:"Dabberna home"}).getAttribute("href")?.endsWith("#/")).toBe(true);
  expect(screen.getAllByRole("link",{name:/Ask Dabberna/}).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("link",{name:/Back to current home|Current homepage/}).length).toBeGreaterThan(0);
  expect(screen.queryByText("1,250 JOD")).not.toBeInTheDocument();
  expect(screen.queryByText("$1,250")).not.toBeInTheDocument();
 });
 it("opens the mobile menu with real destination links",()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Menu"}));
  const mobile=screen.getByRole("navigation",{name:"Mobile menu"});
  expect(mobile.querySelectorAll("a")).toHaveLength(4);
  expect(mobile.querySelector('a[href="/plans"]')).toBeTruthy();
 });
 it("keeps demo finance figures out of the new family page",async()=>{
  draw();
  expect(await screen.findByText(/Enter your household finances once/)).toBeInTheDocument();
  expect(screen.queryByText(/Planned minus recorded is not available cash/)).not.toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("reads fixed, variable and periodic amounts already stored by the user",async()=>{
  window.localStorage.setItem("wafferli.v13.money",JSON.stringify({
   demo:false,income:2600,savingsPct:5,expenses:[],
   categories:[
    {id:"rent",name:"Rent",type:"fixed",planned:800},
    {id:"groceries",name:"Groceries",type:"variable",planned:300},
    {id:"school",name:"School",type:"periodic",planned:125}
   ]
  }));
  draw();
  await waitFor(()=>expect(screen.getAllByText("1,225 JOD").length).toBeGreaterThan(0));
  expect(screen.getByText("Fixed expenses")).toBeInTheDocument();
  expect(screen.getByText("Variable expenses")).toBeInTheDocument();
  expect(screen.getByText("Periodic expenses")).toBeInTheDocument();
  expect(screen.getByText(/Planned minus recorded is not available cash/)).toBeInTheDocument();
 });
 it("switches to Arabic without changes to household data",async()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Switch language"}));
  expect(screen.getByRole("heading",{name:/بكرا/})).toBeInTheDocument();
  expect(screen.getByText("معاينة اختبار للتصميم", {exact:false})).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
});
