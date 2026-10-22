import {useState} from "react";
import {afterEach,beforeEach,describe,it,expect} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";

const sample=():MoneyState=>({
 ...emptyRealMoney(),categories:[
  {id:"g",name:"Groceries",type:"variable",planned:1200,spendingRole:"necessary"},
  {id:"n",name:"Nanny",type:"fixed",planned:400,spendingRole:"committed"},
  {id:"out",name:"Family outings",type:"variable",planned:400,spendingRole:"flexible"}
 ],expenses:[{id:"paid",date:"2026-10-20",categoryId:"g",amount:120,shared:false,status:"paid"}]
});
function App(){
 const [state,setState]=useState(sample());
 return <I18nProvider>
  <FamilyMoneyRhythm state={state} setState={setState} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/>
  <output data-testid="saved-group-state">{JSON.stringify(state)}</output>
 </I18nProvider>;
}
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear()});
describe("Three family spending groups on one Money page",()=>{
 it("shows committed, necessary, flexible in vertical order with unchanged saved amounts",()=>{
  render(<App/>);
  const sections=["committed","necessary","flexible"].map(id=>screen.getByTestId("spending-group-"+id));
  expect(sections[0]).toHaveTextContent("Nanny");
  expect(sections[1]).toHaveTextContent("Groceries");
  expect(sections[2]).toHaveTextContent("Family outings");
  expect(sections[0]!.compareDocumentPosition(sections[1]!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(sections[1]!.compareDocumentPosition(sections[2]!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(sections[2]).toHaveTextContent("Allowance left");
  expect(sections[0]).toHaveTextContent("No linked due dates yet");
  expect(screen.getByTestId("saved-group-state")).toHaveTextContent('"amount":120');
 });
 it("changes a category role and frequency without changing any expense or creating a bill",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-picture-groceries"));
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  const dialog=screen.getByRole("dialog",{name:"Edit family category"});
  fireEvent.click(within(dialog).getByLabelText(/Flexible · we choose what to spend/));
  fireEvent.change(within(dialog).getByLabelText(/How often is this expense expected/),{target:{value:"yearly"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save category"}));
  expect(screen.getByTestId("spending-group-flexible")).toHaveTextContent("Groceries");
  expect(screen.getByTestId("spending-group-necessary")).not.toHaveTextContent("Groceries");
  const output=screen.getByTestId("saved-group-state");
  expect(output).toHaveTextContent('"spendingRole":"flexible"');
  expect(output).toHaveTextContent('"expectedCadence":"yearly"');
  expect(output).toHaveTextContent('"amount":120');
  expect(output).toHaveTextContent('"commitments":[]');
 });
});
