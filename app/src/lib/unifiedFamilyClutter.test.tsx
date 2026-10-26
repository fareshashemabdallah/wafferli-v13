import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,within} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {AppShell} from "@/components/AppShell";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,activeOptions:_,children,...props}:{to:string;activeOptions?:unknown;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
 <a href={to} {...props}>{children}</a>
}));
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
describe("one Dabberna navigation and no retired feature entry points",()=>{
 it("keeps Today, Money, Family Finds and Family as primary destinations with contextual Ask",()=>{
  render(<I18nProvider><AppShell title="Our Plans"><p>Saved plan details</p></AppShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs)expect(within(nav).getAllByRole("link")).toHaveLength(4);
  expect(screen.getByRole("heading",{level:1,name:"Our Plans"})).toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Ask Dabberna anywhere"})).toHaveAttribute("href","/advisor");
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("offers About & Privacy but no shopping, outings, product finding or circles links in either overflow menu",()=>{
  render(<I18nProvider><AppShell><p>Family content</p></AppShell></I18nProvider>);
  const details=document.querySelectorAll("details");
  expect([...details].some(x=>x.textContent?.includes("About & privacy"))).toBe(true);
  const mobile=screen.getByLabelText("More features").closest("details");
  const desktop=[...details].find(x=>x.textContent?.includes("About & privacy")&&x!==mobile);
  expect(mobile?.querySelectorAll('a[href="/about"]')).toHaveLength(1);
  expect(desktop?.querySelectorAll('a[href="/about"]')).toHaveLength(1);
  for(const link of Array.from(document.querySelectorAll("a"))){
   const href=link.getAttribute("href")??"";
   expect(href).not.toMatch(/^\/(?:explore|community|experience|vote|together)(?:\/|$)/);
  }
 });
});
