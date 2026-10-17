import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {IllustratedFamilyHome} from "@/components/IllustratedFamilyHome";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,activeOptions:_,...props}:{to:string;children?:ReactNode;activeOptions?:unknown}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/TodayFamilyBrief",()=>({TodayFamilyBrief:()=> <p>Local priority signals</p>}));
vi.mock("@/components/FamilyStarterCard",()=>({FamilyStarterCard:()=> <p>Optional family setup</p>}));
vi.mock("@/components/FamilySetupCard",()=>({FamilySetupCard:()=> <p>Preferences</p>}));
vi.mock("@/components/FamilyWeather",()=>({FamilyWeather:()=> <p>Family weather</p>}));
vi.mock("@/components/SpendingBreakdownCard",()=>({SpendingBreakdownCard:()=> <p>Detailed category view</p>}));
vi.mock("@/components/QuickExpenseCard",()=>({QuickExpenseCard:()=> <p>Quick expense tool</p>}));
beforeEach(()=>{localStorage.clear();});
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
function draw(){return render(<I18nProvider><IllustratedFamilyHome/></I18nProvider>);}
describe("illustrated family homepage",()=>{
 it("renders the six real live cards and illustration with uncovered-haired mother",async()=>{
  draw();
  expect(screen.getByRole("img",{name:/mother with long uncovered hair/})).toHaveAttribute("src",expect.stringContaining("family-hero.svg"));
  for(const title of ["Today","Ask Dabberna","Our Plans","Money & Bills","Shopping & Wishlist","Family Calendar"]){
   expect(screen.getByRole("heading",{name:title})).toBeInTheDocument();
  }
  expect(screen.getByRole("link",{name:/Explore the options/})).toHaveAttribute("href","/explore/weekend");
  expect(screen.queryByText("2,450 JOD")).not.toBeInTheDocument();
  expect(screen.queryByText(/Yes, based on your current budget/)).not.toBeInTheDocument();
  await waitFor(()=>expect(screen.getByText(/Your actual household figures are not set yet/)).toBeInTheDocument());
 });
 it("uses the parent's stored categories and shopping needs, not mockup numbers or dates",async()=>{
  localStorage.setItem("wafferli.v13.money",JSON.stringify({
   demo:false,income:2500,savingsPct:10,
   categories:[{id:"rent",name:"Rent",type:"fixed",planned:900},
    {id:"food",name:"Groceries",type:"variable",planned:300},
    {id:"school",name:"School",type:"periodic",planned:100}],
   expenses:[]
  }));
  localStorage.setItem("wafferli.v13.shopping",JSON.stringify([
   {id:"x",name:"Laundry detergent",qty:2,price:3,done:false}
  ]));
  draw();
  await waitFor(()=>expect(screen.getByText("1,300 JOD")).toBeInTheDocument());
  expect(screen.getByText("Fixed expenses")).toBeInTheDocument();
  expect(screen.getByText("Variable expenses")).toBeInTheDocument();
  expect(screen.getByText("Periodic expenses")).toBeInTheDocument();
  expect(screen.getByText("Laundry detergent")).toBeInTheDocument();
  expect(screen.getByText(/Planned versus recorded is not cash available/)).toBeInTheDocument();
 });
 it("answers a question in-page and retains the source-based action",async()=>{
  draw();
  const input=screen.getByRole("textbox",{name:"Ask about your family"});
  fireEvent.change(input,{target:{value:"How are our savings goals?"}});
  await waitFor(()=>expect(screen.getByRole("button",{name:"Ask Dabberna"})).toBeEnabled());
  fireEvent.click(screen.getByRole("button",{name:"Ask Dabberna"}));
  await waitFor(()=>expect(screen.getByText("How are our savings goals?")).toBeInTheDocument());
  expect(screen.getByText(/guided local advice/i)).toBeInTheDocument();
 });
});
