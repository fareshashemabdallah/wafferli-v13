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
const destinations=["/","/money","/family","/explore","/explore/smartbuy"];
describe("one canonical Dabberna navigation, no duplicated tools",()=>{
 it("shows five categories, contextual Ask and no tools drawer",()=>{
  render(<I18nProvider><AppShell title="Our Plans"><p>Saved plan details</p></AppShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs)expect(within(nav).getAllByRole("link").map(x=>x.getAttribute("href"))).toEqual(destinations);
  expect(screen.queryByText("Other tools")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("More features")).not.toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Our Plans",level:1})).toBeInTheDocument();
  expect(screen.getByText("Saved plan details")).toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("has the same destinations inside Shopping and keeps Ask available",()=>{
  render(<I18nProvider><ShoppingExperienceShell><p>Wishlist data</p></ShoppingExperienceShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  for(const nav of navs)expect(within(nav).getAllByRole("link").map(x=>x.getAttribute("href"))).toEqual(destinations);
  expect(screen.getByRole("link",{name:"Ask Dabberna anywhere"})).toHaveAttribute("href","/advisor");
  expect(screen.queryByRole("navigation",{name:"Related family actions"})).not.toBeInTheDocument();
 });
});