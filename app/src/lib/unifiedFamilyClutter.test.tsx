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
 it("keeps five independent top-level destinations with contextual Ask",()=>{
  render(<I18nProvider><AppShell title="Our Plans"><p>Saved plan details</p></AppShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs){
   const links=within(nav).getAllByRole("link");
   expect(links).toHaveLength(5);
   expect(links.map(link=>link.getAttribute("href"))).toEqual(["/","/money","/what-parents-say","/finds","/family"]);
  }
  expect(screen.getByRole("heading",{level:1,name:"Our Plans"})).toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Ask Dabberna anywhere"})).toHaveAttribute("href","/advisor");
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("highlights What Parents Say itself, not Family, when its route opens",()=>{
  window.location.hash="#/what-parents-say";
  try{
   render(<I18nProvider><AppShell title="What Parents Say"><p>Our reviews</p></AppShell></I18nProvider>);
   const navs=screen.getAllByRole("navigation",{name:"Main"});
   for(const nav of navs){
    expect(within(nav).getByRole("link",{name:/What Parents Say|Parents Say/})).toHaveAttribute("aria-current","page");
    expect(within(nav).getByRole("link",{name:"Family"})).not.toHaveAttribute("aria-current");
   }
  }finally{window.location.hash="";}
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
