import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {SmartBuy} from "@/routes/explore.smartbuy";

vi.mock("@tanstack/react-router",()=>({
 createFileRoute:()=> (options:unknown)=>options,
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({
 AppShell:({children}:{children:ReactNode})=><main>{children}</main>,
 Notice:()=>null
}));
vi.mock("@/components/PlanContextBanner",()=>({PlanContextBanner:()=>null}));
vi.mock("@/components/MerchantQuoteDraft",()=>({MerchantQuoteDraft:()=> <p>Merchant quote tools</p>}));
vi.mock("@/components/PrivateOfferWorkspace",()=>({PrivateOfferWorkspace:()=> <p>Private offer tools</p>}));
vi.mock("@/components/FamilyWishlistPanel",()=>({FamilyWishlistPanel:()=> <p>Wishlist tools</p>}));
beforeEach(()=>{window.localStorage.clear();vi.spyOn(window,"confirm").mockReturnValue(true);});
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});
const draw=()=>render(<I18nProvider><SmartBuy/></I18nProvider>);

describe("simple buying journey",()=>{
 it("answers which entered store costs less, without making purchases",async()=>{
  draw();
  const stores=screen.getAllByRole("textbox",{name:"Store"});
  const prices=screen.getAllByRole("textbox",{name:"Price"});
  const delivery=screen.getAllByRole("textbox",{name:"Delivery or travel"});
  expect(screen.getByText("Enter prices from two different stores to get an answer")).toBeInTheDocument();
  fireEvent.change(stores[0]!,{target:{value:"Family Store"}});
  fireEvent.change(prices[0]!,{target:{value:"21"}});
  fireEvent.change(delivery[0]!,{target:{value:"3"}});
  fireEvent.change(stores[1]!,{target:{value:"Local Shop"}});
  fireEvent.change(prices[1]!,{target:{value:"18"}});
  fireEvent.change(delivery[1]!,{target:{value:"1"}});
  await screen.findByText("Lower entered total: Local Shop");
  expect(screen.getByText(/Lower than Family Store by/)).toHaveTextContent("5 JOD");
  expect(screen.getByText(/not verified retailer offers or guaranteed savings/)).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });

 it("offers an everyday basket link and keeps advanced tools initially folded",()=>{
  draw();
  expect(screen.getByRole("link",{name:/Open My Basket/})).toHaveAttribute("href","/explore/shopping");
  const advanced=screen.getByText("Advanced: quote drafts, offers & photos (optional)").closest("details");
  const wish=screen.getByText("Plan future purchases & wishlist (optional)").closest("details");
  expect(advanced).toHaveProperty("open",false);
  expect(wish).toHaveProperty("open",false);
  expect(screen.getByText(/Prices are entered by you/)).toBeInTheDocument();
 });
 it("reuses only the parent's basket product name, never the entered price",async()=>{
  window.localStorage.setItem("wafferli.v13.shopping",JSON.stringify([
   {id:"a",name:"Laundry detergent",price:2.75,qty:2,done:false},
   {id:"b",name:"Bread (sample)",price:100,qty:1,done:false}
  ]));
  draw();
  const dropdown=await screen.findByRole("combobox",{name:"Item from My Basket"});
  expect(dropdown).toHaveTextContent("Laundry detergent");
  expect(dropdown).not.toHaveTextContent("Bread (sample)");
  fireEvent.change(dropdown,{target:{value:"Laundry detergent"}});
  await waitFor(()=>{
   const saved=JSON.parse(window.localStorage.getItem("wafferli.v13.smartbuy")??"{}") as {
    product:string;budget:string;alts:Array<{price:string}>
   };
   expect(saved.product).toBe("Laundry detergent");
   expect(saved.alts.every(o=>o.price==="")).toBe(true);
  });
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("resets only the comparison after confirmation, not the parent's shopping list",async()=>{
  window.localStorage.setItem("wafferli.v13.shopping",JSON.stringify([{id:"real",name:"Desk",qty:1,price:55,done:false}]));
  window.localStorage.setItem("wafferli.v13.smartbuy",JSON.stringify({
   product:"Chair",budget:"100",alts:[{id:"a",store:"Store A",price:"44",extra:"2",verified:false}]
  }));
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Start another comparison"}));
  await waitFor(()=>{
   const data=JSON.parse(window.localStorage.getItem("wafferli.v13.smartbuy")??"{}") as {
    product:string;budget:string;alts:Array<{price:string}>
   };
   expect(data.product).toBe("");
   expect(data.budget).toBe("");
   expect(data.alts).toHaveLength(2);
  });
  expect(window.localStorage.getItem("wafferli.v13.shopping")).toContain("Desk");
 });
});
