import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {FamilyActivityExplorer} from "@/components/FamilyActivityExplorer";
import {findWeekendPlaces} from "./weekendPlaceSearch";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({AppShell:({children}:{children:ReactNode})=><div>{children}</div>}));
vi.mock("./weekendPlaceSearch",async(importOriginal)=>{
 const actual=await importOriginal<typeof import("./weekendPlaceSearch")>();
 return {...actual,findWeekendPlaces:vi.fn(async()=>({places:[{
  id:"node/12",name:"Children's Museum",category:"museum" as const,osmUrl:"https://www.openstreetmap.org/node/12",
  lat:31.95,lon:35.91}],checkedAt:Date.now(),stale:false}))};
});
const renderExplorer=(onShowAffordability=vi.fn())=>render(<I18nProvider><FamilyActivityExplorer onShowAffordability={onShowAffordability}/></I18nProvider>);
beforeEach(()=>{localStorage.clear();vi.clearAllMocks()});
afterEach(()=>{cleanup();localStorage.clear()});
describe("family discovery before financial entry",()=>{
 it("shows age-based discovery without opening the map, asking for salary or saving anything",()=>{
  renderExplorer();
  expect(screen.getByRole("heading",{name:"What can your family enjoy?"})).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"All my children"})).toHaveAttribute("aria-pressed","true");
  expect(screen.getByText(/No real child ages saved yet/)).toBeInTheDocument();
  expect(findWeekendPlaces).not.toHaveBeenCalled();
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
  expect(screen.queryByLabelText("Cash and accessible bank balance today (JOD)")).not.toBeInTheDocument();
 });
 it("explicitly opts in to legacy money review",()=>{
  const callback=vi.fn();
  renderExplorer(callback);
  fireEvent.click(screen.getByText("Optional: Check an outing against my finances"));
  fireEvent.click(screen.getByRole("button",{name:"Open the optional affordability review"}));
  expect(callback).toHaveBeenCalledTimes(1);
  expect(findWeekendPlaces).not.toHaveBeenCalled();
 });
 it("saves a mapped activity as a tentative dated family plan without booking or payment",async()=>{
  renderExplorer();
  fireEvent.click(screen.getByRole("button",{name:"Show mapped places"}));
  expect(await screen.findByText("Children's Museum")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Consider this place"}));
  fireEvent.change(screen.getByLabelText("Tentative date (optional)"),{target:{value:"2026-10-23"}});
  fireEvent.change(screen.getByLabelText("Your estimated family total (JOD)"),{target:{value:"25"}});
  fireEvent.click(screen.getByRole("button",{name:"Save to Family Plans"}));
  await waitFor(()=>{
   const raw=localStorage.getItem("wafferli.v13.familyPlans");
   expect(raw).not.toBeNull();
   const plans=JSON.parse(raw!) as Array<Record<string,unknown>>;
   expect(plans).toHaveLength(1);
   expect(plans[0]).toMatchObject({kind:"outing",status:"planning",date:"2026-10-23",budgetJod:25});
   expect(plans[0]).not.toHaveProperty("actualJod");
   expect(plans[0]).not.toHaveProperty("expenseId");
  });
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
  expect(screen.getByText(/No payment, bill or confirmed booking was created/)).toBeInTheDocument();
 });
});
