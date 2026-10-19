import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,within} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {AppShell} from "@/components/AppShell";
import {ShoppingExperienceShell} from "@/components/ShoppingExperienceShell";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,activeOptions:_,children,...props}:{to:string;activeOptions?:unknown;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
 <a href={to} {...props}>{children}</a>
}));
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
describe("one Dabberna navigation, no automatic link clutter",()=>{
 it("uses one shared four-destination navigation and hides specialist tools until requested",()=>{
  render(<I18nProvider><AppShell title="Our Plans"><p>Saved plan details</p></AppShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs){
   expect(within(nav).getAllByRole("link")).toHaveLength(4);
  }
  expect(screen.getByText("Other tools").closest("details")).not.toHaveAttribute("open");
  expect(screen.queryByRole("navigation",{name:"Related family actions"})).not.toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Discover"})).not.toBeInTheDocument();
  expect(screen.getByRole("heading",{level:1,name:"Our Plans"})).toBeInTheDocument();
  expect(screen.getByText("Saved plan details")).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("keeps Shopping discoverable on both desktop and mobile without a fifth main tab",()=>{
  render(<I18nProvider><AppShell><p>Family content</p></AppShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs)expect(within(nav).queryByRole("link",{name:"Shopping & Wishlist"})).not.toBeInTheDocument();
  expect(screen.getByText("Other tools").closest("details")).not.toHaveAttribute("open");
  const more=screen.getByText("Other tools").closest("details");
  expect(more?.querySelector('a[href="/explore/smartbuy"]')).toBeTruthy();
  const mobileMore=screen.getByLabelText("More features").closest("details");
  expect(mobileMore?.querySelector('a[href="/explore/smartbuy"]')).toBeTruthy();
 });
 it("shares exactly the same primary destinations in Shopping",()=>{
  render(<I18nProvider><ShoppingExperienceShell><p>Wishlist data</p></ShoppingExperienceShell></I18nProvider>);
  const [desktop,mobile]=screen.getAllByRole("navigation",{name:"Main"}) as [HTMLElement,HTMLElement];
  const paths=(node:HTMLElement)=>Array.from(node.querySelectorAll("a")).map(a=>a.getAttribute("href"));
  expect(paths(desktop)).toEqual(paths(mobile));
  expect(paths(desktop)).toEqual(["/","/money","/advisor","/family"]);
  expect(screen.queryByRole("navigation",{name:"Related family actions"})).not.toBeInTheDocument();
 });
});
