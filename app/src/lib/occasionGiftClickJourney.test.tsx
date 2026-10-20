import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,fireEvent,waitFor} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "./i18n";
import {emptyRealMoney} from "./moneyOverview";
import {SmartBuy} from "@/routes/explore.smartbuy";
import type {FamilyPlan} from "./familyPlans";

vi.mock("@tanstack/react-router",()=>({
 createFileRoute:()=> (options:unknown)=>options,
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({AppShell:({children}:{children:ReactNode})=><main>{children}</main>,Notice:()=>null}));
vi.mock("@/components/ShoppingReferenceDashboard",()=>({ShoppingReferenceDashboard:()=>null}));
vi.mock("@/components/PlanContextBanner",()=>({PlanContextBanner:()=>null}));
vi.mock("@/components/FamilyWishlistPanel",()=>({FamilyWishlistPanel:()=>null}));

const put=(key:string,value:unknown)=>localStorage.setItem("wafferli.v13."+key,JSON.stringify(value));
const get=<T,>(key:string):T=>JSON.parse(localStorage.getItem("wafferli.v13."+key)??"null") as T;
const occasion:FamilyPlan={
 id:"gift-plan-1",title:"Sophia birthday",kind:"occasion",status:"planning",
 sourceRef:"occasion:member-birthday:sophia@2026",date:"2026-11-12",
 createdAt:"2026-10-20T08:00:00.000Z",updatedAt:"2026-10-20T08:00:00.000Z",
 occasionPreparation:{
  gift:{description:"Science kit",amountJod:70,dueDate:"2026-11-05"},
  celebration:{amountJod:25,dueDate:"2026-11-10"},
  extras:{amountJod:5,dueDate:"2026-11-12"}
 }
};
beforeEach(()=>{
 localStorage.clear();vi.spyOn(window,"confirm").mockReturnValue(true);
 put("money",emptyRealMoney());put("familyPlans",[occasion]);put("activeFamilyPlanId","gift-plan-1");
});
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear();});
const draw=()=>render(<I18nProvider><SmartBuy/></I18nProvider>);
describe("birthday gift click continuity",()=>{
 it("moves a seller choice onto one existing occasion plan, then records exactly one private paid expense",async()=>{
  put("smartbuy",{product:"Science kit",budget:"70",alts:[
   {id:"quote1",store:"Family Shop",price:"45",extra:"3",verified:false},
   {id:"quote2",store:"Gift Store",price:"55",extra:"0",verified:false}
  ]});
  draw();
  expect(screen.getByRole("region",{name:"Occasion gift purchase journey"})).toHaveTextContent("Sophia birthday");
  fireEvent.click(screen.getAllByRole("button",{name:"Save this seller option for the birthday gift"})[0]!);
  await waitFor(()=>expect(get<FamilyPlan[]>("familyPlans")[0]!.occasionPreparation?.gift.selectedQuote)
   .toMatchObject({productName:"Science kit",store:"Family Shop",totalJod:48,checkedByParent:false}));
  expect(get<{expenses:unknown[]}>("money").expenses).toHaveLength(0);
  expect(get<FamilyPlan[]>("familyPlans")).toHaveLength(1);
  expect(screen.getByRole("spinbutton",{name:"Actual paid amount (JOD)"})).toHaveValue(48);
  fireEvent.change(screen.getByRole("spinbutton",{name:"Actual paid amount (JOD)"}),{target:{value:"46"}});
  fireEvent.click(screen.getByRole("button",{name:"Confirm paid gift and update Money"}));
  await waitFor(()=>expect(get<{expenses:Array<{amount:number;sourceOccasionCost?:string;shared:boolean}>}>("money").expenses)
   .toEqual([expect.objectContaining({amount:46,sourceOccasionCost:"gift",shared:false})]));
  expect(screen.getByText("This gift payment is already in Money. It cannot be recorded twice.")).toBeInTheDocument();
  expect(get<FamilyPlan[]>("familyPlans")[0]!.occasionPreparation?.gift.selectedQuote?.totalJod).toBe(48);
  expect(get<{cashOnHand:number|null}>("money").cashOnHand).toBeNull();
 });
 it("does not accidentally attach another product's seller quotes to the birthday",()=>{
  put("smartbuy",{product:"Office chair",budget:"200",alts:[{id:"other",store:"Furniture",price:"150",extra:"0",verified:false}]});
  draw();
  expect(screen.getByText(/Your saved comparison is for another product/)).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Save this seller option for the birthday gift"})).not.toBeInTheDocument();
  expect(get<FamilyPlan[]>("familyPlans")[0]!.occasionPreparation?.gift.selectedQuote).toBeUndefined();
  expect(get<{product:string}>("smartbuy").product).toBe("Office chair");
 });
 it("changes to the birthday gift only with permission, without altering existing family data",async()=>{
  put("smartbuy",{product:"Office chair",budget:"250",alts:[{id:"original",store:"Store",price:"140",extra:"0",verified:false}]});
  draw();
  expect(get<{product:string;alts:unknown[]}>("smartbuy").alts).toHaveLength(1);
  const action=screen.getByRole("button",{name:"Switch comparison to this gift"});
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  fireEvent.click(action);
  expect(get<{product:string}>("smartbuy").product).toBe("Office chair");
  fireEvent.click(action);
  await waitFor(()=>expect(get<{product:string;budget:string;alts:unknown[]}>("smartbuy")).toMatchObject({
   product:"Science kit",budget:"70",alts:[]
  }));
  expect(get<FamilyPlan[]>("familyPlans")).toEqual([occasion]);
  expect(get<{expenses:unknown[]}>("money").expenses).toHaveLength(0);
 });
 it("starts with comparison, not an unrelated wishlist hero, and keeps optional shopping collapsed",async()=>{
  put("smartbuy",{product:"",budget:"",alts:[]});
  draw();
  await waitFor(()=>expect(get<{product:string}>("smartbuy").product).toBe("Science kit"));
  const comparison=screen.getByText("Compare seller prices for this gift").closest("details");
  expect(comparison).toHaveProperty("open",true);
  const optional=screen.getByText("Other shopping and wishlists (optional)").closest("details");
  expect(optional).toHaveProperty("open",false);
  const gift=screen.getByRole("region",{name:"Occasion gift purchase journey"});
  expect(gift.compareDocumentPosition(comparison)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.queryByRole("button",{name:"Use saved gift name for comparison"})).not.toBeInTheDocument();
 });
 it("reuses saved gift name without wiping previous comparison records",async()=>{
  put("smartbuy",{product:"",budget:"",alts:[]});
  draw();
  await waitFor(()=>expect(get<{product:string;alts:unknown[]}>("smartbuy")).toMatchObject({product:"Science kit",alts:[]}));
  expect(get<FamilyPlan[]>("familyPlans")).toHaveLength(1);
  expect(get<{expenses:unknown[]}>("money").expenses).toHaveLength(0);
 });
});
