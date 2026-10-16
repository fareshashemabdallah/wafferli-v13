import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {ReactNode,AnchorHTMLAttributes} from "react";
import {I18nProvider} from "./i18n";
import {writeLocal,useLocalState} from "./storage";
import {AppShell} from "@/components/AppShell";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,activeOptions:_,children,...props}:{
  to:string;activeOptions?:unknown;children?:ReactNode
 } & AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props} href={to}>{children}</a>
}));

const Counter=()=>{
 const [n,setN,ready]=useLocalState("test-amount",0);
 return <><p>Count: {n}</p><button disabled={!ready} onClick={()=>setN(x=>x+1)}>Save change</button></>;
};
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});

describe("browser storage failure UX",()=>{
 it("warns when storage is full and preserves previous displayed value",async()=>{
  render(<I18nProvider><AppShell><Counter/></AppShell></I18nProvider>);
  const stub=vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw Error("quota exceeded");});
  fireEvent.click(screen.getByRole("button",{name:"Save change"}));
  expect(screen.getByText("Count: 0")).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent("Your changes could not be saved");
  expect(window.localStorage.getItem("wafferli.v13.test-amount")).toBeNull();
  stub.mockRestore();
  fireEvent.click(screen.getByRole("button",{name:"Dismiss save warning"}));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Save change"}));
  expect(screen.getByText("Count: 1")).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.test-amount")).toBe("1");
 });
 it("reports direct failed writes rather than silently claiming success",()=>{
  const bad=vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw Error("blocked");});
  expect(writeLocal("family", {names:["test"]})).toBe(false);
  bad.mockRestore();
  expect(writeLocal("family", {names:["test"]})).toBe(true);
 });
});
