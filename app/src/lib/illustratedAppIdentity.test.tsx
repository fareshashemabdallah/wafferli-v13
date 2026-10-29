import {afterEach,beforeEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {readFileSync} from "node:fs";
import {I18nProvider} from "./i18n";
import {AppWelcome,shouldShowWelcome,WELCOME_SEEN_KEY} from "@/components/AppWelcome";

const asset=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
beforeEach(()=>{localStorage.clear();window.history.replaceState({},"","/")});
afterEach(()=>{cleanup();localStorage.clear();window.history.replaceState({},"","/")});
describe("Illustrated installed app identity",()=>{
 it("uses the same friendly robot for the real PWA icon and in-app brand",()=>{
  const icon=asset("../../public/app-icon.svg");
  const manifest=JSON.parse(asset("../../public/manifest.webmanifest"));
  expect(icon).toContain("Dabberna friendly robot");
  expect(manifest.id).toBe("/wafferli-v13/");
  expect(manifest.icons.some((x:{src:string})=>x.src==="app-icon.svg")).toBe(true);
  expect(manifest.icons.some((x:{src:string})=>x.src==="apple-touch-icon.png")).toBe(true);
  expect(asset("../components/Logo.tsx")).toContain('app-icon.svg');
 });
 it("offers a deliberate first-launch welcome without touching family records",()=>{
  window.history.replaceState({},"","/?welcome=1");
  expect(shouldShowWelcome()).toBe(true);
  const next=()=>localStorage.setItem("intro-opened","true");
  render(<I18nProvider><AppWelcome onContinue={next}/></I18nProvider>);
  expect(screen.getByRole("img",{name:/Illustration of parents/})).toHaveClass("object-contain");
  expect(screen.getByRole("button",{name:"Let's get started"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Let's get started"}));
  expect(localStorage.getItem("intro-opened")).toBe("true");
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("does not repeat the welcome for returning families, but permits explicit preview",()=>{
  localStorage.setItem("wafferli.v13."+WELCOME_SEEN_KEY,"true");
  window.history.replaceState({},"","/?welcome=1");
  expect(shouldShowWelcome()).toBe(false);
  window.history.replaceState({},"","/?welcome=preview");
  expect(shouldShowWelcome()).toBe(true);
 });
});