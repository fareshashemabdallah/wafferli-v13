import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "./i18n";
import {MoneyOverviewPanel} from "@/components/MoneyOverviewPanel";
import {sampleMoney} from "./money";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});

describe("Review or edit expense categories navigation",()=>{
 it("places the opened category editor immediately after the review button and ahead of itemized details",async()=>{
  const onManageCategories=vi.fn();
  render(<I18nProvider>
   <MoneyOverviewPanel state={{...sampleMoney(),demo:false}} setState={vi.fn()} goTo={vi.fn()}
    onManageCategories={onManageCategories}
    budgetManagement={<section data-testid="expense-category-editor">Category controls</section>}/>
  </I18nProvider>);
  const button=await screen.findByRole("button",{name:"Review or edit expense categories"});
  const breakdown=screen.getByRole("region",{name:"Fixed and variable spending breakdown"});
  const editor=screen.getByTestId("expense-category-editor");
  const builder=screen.getByRole("region",{name:"Build household budget"});
  expect(breakdown.compareDocumentPosition(editor)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(editor.compareDocumentPosition(builder)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(button);
  expect(onManageCategories).toHaveBeenCalledOnce();
 });
});
