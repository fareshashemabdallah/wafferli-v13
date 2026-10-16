import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {MarketDiscovery} from "@/routes/explore.market";
import {FamilyChoiceHome} from "@/components/FamilyChoiceHome";
import {sampleMoney} from "@/lib/money";

vi.mock("@tanstack/react-router",()=>({
 createFileRoute:()=> (options:unknown)=>options,
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({
 AppShell:({children,title}:{children:ReactNode;title?:string})=><main><h1>{title}</h1>{children}</main>
}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});
const wrap=(children:ReactNode)=>render(<I18nProvider>{children}</I18nProvider>);

describe("three parent outcomes and retailer-backed discovery",()=>{
 it("asks three ordinary family questions before demanding a form",()=>{
  wrap(<FamilyChoiceHome/>);
  expect(screen.getByText("How is my family doing financially?")).toBeInTheDocument();
  expect(screen.getByText("What can we enjoy together?")).toBeInTheDocument();
  expect(screen.getByText("What should I buy, and where?")).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Find products online/})).toHaveAttribute("href","/explore/market");
  expect(screen.getByText(/Start with three numbers/)).toBeInTheDocument();
  expect(screen.getByText(/in-app live prices require a connected source/)).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("shows a specific useful budget margin from previously entered figures",()=>{
  const parent={...sampleMoney(),demo:false,income:1200,savingsTargetAmount:200,
   categories:[{id:"home",name:"Household",type:"fixed" as const,planned:850}],expenses:[]};
  window.localStorage.setItem("wafferli.v13.money",JSON.stringify(parent));
  wrap(<FamilyChoiceHome/>);
  expect(screen.getByText(/Unallocated this month:/)).toHaveTextContent("150 JOD");
  expect(screen.getByText("A planning result, not confirmed spendable bank cash.")).toBeInTheDocument();
 });
 it("lets parents search verified retailer DOMAINS without inventing price figures",async()=>{
  wrap(<MarketDiscovery/>);
  expect(screen.getByText(/Retailer discovery works now/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("What would you like to buy?"),{target:{value:"baby shampoo 500ml"}});
  fireEvent.click(screen.getByRole("button",{name:"Find seller prices"}));
  expect(await screen.findByText("See current store listings")).toBeInTheDocument();
  expect(screen.getByText("Cozmo")).toBeInTheDocument();
  expect(screen.getByText("HyperMax")).toBeInTheDocument();
  expect(screen.getByText("Leaders Center")).toBeInTheDocument();
  expect(screen.getByText("SmartBuy Jordan")).toBeInTheDocument();
  const links=screen.getAllByRole("link",{name:"Find matching items"});
  expect(links).toHaveLength(4);
  expect(links[0]?.getAttribute("href")).toContain("site%3Acozmo.jo");
  expect(screen.queryByText(/Best market price/)).not.toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("does not search on private contact information or automatically upload household details",async()=>{
  wrap(<MarketDiscovery/>);
  fireEvent.change(screen.getByLabelText("What would you like to buy?"),{target:{value:"parent@example.com"}});
  fireEvent.click(screen.getByRole("button",{name:"Find seller prices"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Enter a product name only");
  expect(screen.queryByText("See current store listings")).not.toBeInTheDocument();
 });
});
