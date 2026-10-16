import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {About} from "@/routes/about";
import {Explore} from "@/routes/explore.index";
import {Advisor} from "@/routes/advisor";

vi.mock("@tanstack/react-router",()=>({
 createFileRoute:()=> (options:unknown)=>options,
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
vi.mock("@/components/AppShell",()=>({
 AppShell:({children,title}:{children:ReactNode;title?:string})=><main><h1>{title}</h1>{children}</main>
}));
vi.mock("@/components/LocalDataControls",()=>({
 LocalDataControls:()=><p>Private data backup and restore</p>
}));
vi.mock("@/components/PrivateVaultPanel",()=>({
 PrivateVaultPanel:()=><p>Private vault control</p>
}));
vi.mock("@/components/GuidedFamilyAdvisor",()=>({
 GuidedFamilyAdvisor:()=><p>Ask one family question</p>
}));
vi.mock("@/components/LiveFamilyAdvisor",()=>({
 LiveFamilyAdvisor:()=><p>Secure live AI if activated</p>
}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear()});
const draw=(component:ReactNode)=>render(<I18nProvider>{component}</I18nProvider>);
describe("remove distractions, not parent decision support",()=>{
 it("About shows real consumer capabilities and backup instead of commercial or merchant mockups",()=>{
  draw(<About/>);
  expect(screen.getByText("Family support, not more forms")).toBeInTheDocument();
  expect(screen.getByText("Private data backup and restore")).toBeInTheDocument();
  expect(screen.getByText("Private vault control")).toBeInTheDocument();
  expect(screen.queryByText(/Free and Dabberna Plus — future concept/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Fictional merchant and offer-review workflow/)).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Ask Dabberna/})).toHaveAttribute("href","/advisor");
 });
 it("Discover helps pick practical family outcomes but doesn't promote social networks",()=>{
  draw(<Explore/>);
  expect(screen.getByRole("link",{name:/A family outing/})).toHaveAttribute("href","/explore/weekend");
  expect(screen.getByRole("link",{name:/Find a product/})).toHaveAttribute("href","/explore/market");
  expect(screen.getByRole("link",{name:/My shopping list/})).toHaveAttribute("href","/explore/shopping");
  expect(screen.queryByRole("link",{name:/Family & Friends Circles/})).not.toBeInTheDocument();
  expect(screen.queryByRole("link",{name:/Community experiences/})).not.toBeInTheDocument();
 });
 it("Advisor has just one amount checker in the guided experience, not a second full form",()=>{
  draw(<Advisor/>);
  expect(screen.getByText("Ask one family question")).toBeInTheDocument();
  expect(screen.queryByText("Check a specific purchase amount (optional)")).not.toBeInTheDocument();
  expect(screen.queryByText("Ask people you trust (optional)")).not.toBeInTheDocument();
  expect(screen.queryByText("About live AI (not activated yet)")).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Find an item from Jordan sellers/})).toHaveAttribute("href","/explore/market");
 });
});
