import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {FamilyMoneyJourneyCard} from "@/components/FamilyMoneyJourneyCard";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=><a href={to} {...props}>{children}</a>
}));
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear()});
function view(){return render(<I18nProvider><FamilyMoneyJourneyCard/></I18nProvider>);}
describe("BabyCenter-inspired weekly money story UX",()=>{
 it("keeps financial details hidden by default, including on a shared screen",async()=>{
  localStorage.setItem("wafferli.v13.money",JSON.stringify({demo:false,income:300,savingsPct:0,
   incomeKnown:true,categories:[{id:"r",name:"Sensitive Rent Category",type:"fixed",planned:500,priority:"essential"}],expenses:[]}));
  view();
  await waitFor(()=>expect(screen.getByRole("button",{name:/Open my private weekly money story/})).toBeEnabled());
  expect(screen.queryByText(/Essential spending is not fully classified/)).not.toBeInTheDocument();
  expect(screen.queryByTestId("family-money-journey-details")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Open my private weekly money story/}));
  expect(screen.getByTestId("family-money-journey-details")).toBeInTheDocument();
  expect(screen.getByText(/Your entered essential costs are higher than income/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Hide my private money story/}));
  expect(screen.queryByText(/Your entered essential costs are higher than income/)).not.toBeInTheDocument();
 });
 it("does not require income and records a weekly read without marking any bill paid",async()=>{
  view();
  const open=screen.getByRole("button",{name:/Open my private weekly money story/});
  await waitFor(()=>expect(open).toBeEnabled());
  fireEvent.click(open);
  expect(screen.getByText(/No income disclosure, savings target or complete setup/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Mark check-in as read"}));
  await waitFor(()=>{
   const raw=localStorage.getItem("wafferli.v13.familyPreferences");
   expect(raw).toBeTruthy();
   const settings=JSON.parse(raw!);
   expect(settings.moneyJourneyLastReviewedWeek).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("lets a parent select a care dimension without creating a new bill or expense",async()=>{
  view();
  const open=screen.getByRole("button",{name:/Open my private weekly money story/});
  await waitFor(()=>expect(open).toBeEnabled());
  fireEvent.click(open);
  fireEvent.click(screen.getByRole("button",{name:"Live & grow"}));
  await waitFor(()=>{
   const prefs=JSON.parse(localStorage.getItem("wafferli.v13.familyPreferences")!);
   expect(prefs.moneyJourneyFocus).toBe("live");
  });
  expect(screen.getByRole("button",{name:"Live & grow"})).toHaveAttribute("aria-pressed","true");
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
});
