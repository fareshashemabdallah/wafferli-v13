import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "@/lib/i18n";
import {AppShell} from "@/components/AppShell";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,activeOptions:_,children,...props}:{
  to:string;activeOptions?:unknown;children?:ReactNode
 } & AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props} href={to}>{children}</a>
}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});
describe("keyboard navigation and bilingual accessibility",()=>{
 it("puts a focusable skip link before any navigation and targets exactly one main landmark",()=>{
  const {container}=render(<I18nProvider><AppShell title="Family finances">Content</AppShell></I18nProvider>);
  const skip=screen.getByRole("link",{name:"Skip to main content"});
  const main=screen.getByRole("main");
  expect(skip).toHaveAttribute("href","#dabberna-main-content");
  expect(main).toHaveAttribute("id","dabberna-main-content");
  expect(main).toHaveAttribute("tabindex","-1");
  expect(container.querySelector("div")?.firstElementChild).toBe(skip);
  skip.focus();expect(document.activeElement).toBe(skip);
  main.focus();expect(document.activeElement).toBe(main);
 });
 it("has visible keyboard focus classes on both desktop and mobile navigation",()=>{
  render(<I18nProvider><AppShell title="Family">Content</AppShell></I18nProvider>);
  const nav=screen.getAllByRole("navigation",{name:"Main"});
  expect(nav).toHaveLength(2);
  const links=nav.flatMap(n=>Array.from(n.querySelectorAll("a")));
  expect(links).toHaveLength(10);
  for(const link of links)expect(link.className).toContain("focus-visible:ring-2");
 });
 it("updates the skip wording for Arabic without changing saved finances",()=>{
  render(<I18nProvider><AppShell title="عائلتي">المحتوى</AppShell></I18nProvider>);
  fireEvent.click(screen.getAllByRole("button",{name:"Switch to Arabic"})[0]!);
  expect(screen.getByRole("link",{name:"انتقل إلى المحتوى الرئيسي"})).toHaveAttribute("href","#dabberna-main-content");
  expect(document.documentElement.dir).toBe("rtl");
  expect(screen.getAllByRole("navigation",{name:"التنقل الرئيسي"})).toHaveLength(2);
  expect(screen.getAllByRole("link",{name:"الصفحة الرئيسية لدبّرنا"})).toHaveLength(2);
  expect(screen.getAllByRole("navigation",{name:"Main"})).toHaveLength(0);
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("gives both brand links visible focus and legible mobile navigation labels",()=>{
  render(<I18nProvider><AppShell title="Family">Content</AppShell></I18nProvider>);
  for(const link of screen.getAllByRole("link",{name:"Dabberna home"})){
   expect(link.className).toContain("focus-visible:ring-2");
  }
  const nav=screen.getAllByRole("navigation",{name:"Main"})[1]!;
  for(const link of nav.querySelectorAll("a")){
   expect(link.className).toContain("text-xs");
   expect(link.className).toContain("min-h-14");
  }
 });

});
