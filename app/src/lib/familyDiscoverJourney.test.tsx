import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {FamilyDiscoverHome} from "@/components/FamilyDiscoverHome";
import {findWeekendPlaces,type WeekendPlace} from "./weekendPlaceSearch";

const garden:WeekendPlace={id:"node/332",name:"Sample Garden",category:"park",
 lat:31.95,lon:35.91,osmUrl:"https://www.openstreetmap.org/node/332"};
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
 <a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({
 AppShell:({children,title}:{children:ReactNode;title?:string})=><main><h1>{title}</h1>{children}</main>
}));
vi.mock("@/components/ShareFamilyExperience",()=>({ShareFamilyExperience:()=>null}));
vi.mock("./weekendPlaceSearch",async original=>{
 const a=await original<typeof import("./weekendPlaceSearch")>();
 return {...a,findWeekendPlaces:vi.fn(async ()=>({places:[garden],checkedAt:Date.now(),stale:false}))};
});
vi.mock("@/lib/community",()=>({
 communityDb:{rpc:vi.fn(async ()=>({data:[],error:null}))},
 itemKey:(type:string,name:string,city:string)=>[type,name.toLowerCase(),city.toLowerCase()].join("|")
}));
afterEach(()=>{cleanup();localStorage.clear();vi.clearAllMocks();});
describe("one complete parent discovery-to-Family journey",()=>{
 it("starts without onboarding, explains review evidence, and saves one outing without payment",async()=>{
  render(<I18nProvider><FamilyDiscoverHome/></I18nProvider>);
  expect(screen.getByText("Less searching. More living.")).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.familyPlans")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Find family experiences"}));
  expect(await screen.findByText("Sample Garden")).toBeInTheDocument();
  expect(findWeekendPlaces).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:/Sample Garden/}));
  expect(await screen.findByText(/No firsthand parent experiences/)).toBeInTheDocument();
  const dateInput=screen.getByLabelText("When? (optional)");
  fireEvent.change(dateInput,{target:{value:"2026-11-04"}});
  fireEvent.change(screen.getByLabelText("Expected total JOD (optional)"),{target:{value:"35"}});
  await waitFor(()=>expect(screen.getByText(/Insufficient verified household/)).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button",{name:"Keep this in Family"}));
  await waitFor(()=>{
   const saved=JSON.parse(localStorage.getItem("wafferli.v13.familyPlans")??"[]");
   expect(saved).toHaveLength(1);
   expect(saved[0]).toMatchObject({title:"Sample Garden",kind:"outing",date:"2026-11-04",budgetJod:35,status:"decided"});
  });
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
  expect(screen.getByText(/Nothing booked or paid/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Continue this family plan"}));
  const plans=JSON.parse(localStorage.getItem("wafferli.v13.familyPlans")??"[]");
  expect(plans).toHaveLength(1);
 });
});
