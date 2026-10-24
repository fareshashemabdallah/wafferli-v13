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
describe("one Dabberna navigation, no automatic link clutter",()=>{
 it("uses three primary destinations and no unfinished feature menu",()=>{
  render(<I18nProvider><AppShell title="Our Plans"><p>Saved plan details</p></AppShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs){
   expect(within(nav).getAllByRole("link")).toHaveLength(3);
  }
  expect(screen.queryByText("Other tools")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("More features")).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation",{name:"Related family actions"})).not.toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Discover"})).not.toBeInTheDocument();
  expect(screen.getByRole("heading",{level:1,name:"Our Plans"})).toBeInTheDocument();
  expect(screen.getByText("Saved plan details")).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("keeps Privacy available without retaining shopping, outing or circles links",()=>{
  render(<I18nProvider><AppShell><p>Family content</p></AppShell></I18nProvider>);
  expect(screen.getAllByRole("link",{name:"About & privacy"})).toHaveLength(2);
  for(const href of ["/explore/smartbuy","/explore/weekend","/explore/market",
    "/explore/shopping","/community"]){
   expect(document.querySelector('a[href="'+href+'"]')).toBeNull();
  }
 });
 it("keeps exactly the same three destinations on desktop and mobile",()=>{
  render(<I18nProvider><AppShell><p>Family data</p></AppShell></I18nProvider>);
  const [desktop,mobile]=screen.getAllByRole("navigation",{name:"Main"}) as [HTMLElement,HTMLElement];
  const paths=(node:HTMLElement)=>Array.from(node.querySelectorAll("a")).map(a=>a.getAttribute("href"));
  expect(paths(desktop)).toEqual(paths(mobile));
  expect(paths(desktop)).toEqual(["/","/money","/family"]);
  expect(screen.getByRole("link",{name:"Ask Dabberna anywhere"})).toHaveAttribute("href","/advisor");
  expect(screen.queryByRole("navigation",{name:"Related family actions"})).not.toBeInTheDocument();
 });
});
