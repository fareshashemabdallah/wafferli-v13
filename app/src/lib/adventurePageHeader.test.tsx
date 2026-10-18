import {describe,expect,it,afterEach} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {adventureChapter,AdventurePageHeader} from "@/components/AdventurePageHeader";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {vi} from "vitest";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props} href={to}>{children}</a>
}));
afterEach(cleanup);

describe("the same family adventure world on every inner page",()=>{
 it("assigns real places to spending, shopping, outings, family, dates and questions",()=>{
  expect(adventureChapter("/money").place).toBe("home");
  expect(adventureChapter("/plans").place).toBe("moments");
  expect(adventureChapter("/calendar").place).toBe("moments");
  expect(adventureChapter("/family").place).toBe("park");
  expect(adventureChapter("/explore/weekend").place).toBe("park");
  expect(adventureChapter("/explore/smartbuy").place).toBe("market");
  expect(adventureChapter("/explore/market").place).toBe("market");
  expect(adventureChapter("/advisor").place).toBe("home");
 });
 it("shows an accessible world location and a working onward path, not a decorative dead end",()=>{
  render(<I18nProvider><AdventurePageHeader path="/calendar" title="Family Calendar"/></I18nProvider>);
  expect(screen.getByRole("banner",{name:"Adventure location"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Family Calendar",level:1})).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/My world/})).toHaveAttribute("href","/");
  expect(screen.getByRole("link",{name:/Our plans/})).toHaveAttribute("href","/plans");
  expect(screen.getByRole("img",{name:"Illustrated cake, presents and celebration"})).toBeInTheDocument();
 });
 it("never substitutes a made-up shopping offer or fake money snapshot",()=>{
  render(<I18nProvider><AdventurePageHeader path="/explore/smartbuy"/></I18nProvider>);
  expect(screen.getByRole("heading",{name:"Smart Shopping"})).toBeInTheDocument();
  expect(screen.queryByText(/JOD/)).not.toBeInTheDocument();
 });
});
