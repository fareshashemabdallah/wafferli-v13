import {useState} from "react";
import {afterEach,beforeEach,describe,it,expect} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";
const sample=():MoneyState=>({
 ...emptyRealMoney(),categories:[
  {id:"car",name:"Car",type:"variable",planned:700,visualGroup:"custom",visualIcon:"fuel"},
  {id:"n",name:"Nanny",type:"fixed",planned:400,visualGroup:"custom",visualIcon:"household"}
 ],budgetItems:[
  {id:"loan",categoryId:"car",name:"Instalment",enabled:true,amountJod:350,frequency:"monthly",
   spendingRole:"committed",behaviour:"fixed",priority:"essential"},
  {id:"fuel",categoryId:"car",name:"Fuel",enabled:true,amountJod:250,frequency:"monthly",
   spendingRole:"necessary",behaviour:"variable",priority:"essential"},
  {id:"maint",categoryId:"car",name:"Maintenance",enabled:true,amountJod:1200,frequency:"yearly",
   spendingRole:"necessary",behaviour:"variable",priority:"essential"}
 ],expenses:[{id:"paid",date:"2026-10-20",categoryId:"car",budgetItemId:"fuel",amount:90,shared:false,status:"paid"}]
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
describe("Expense-line nature inside a single illustrated family category",()=>{
 it("shows exactly one Car card while its Instalment and Fuel lines appear in different groups",()=>{
  render(<App/>);
  const groups=["committed","necessary","flexible"].map(g=>screen.getByTestId("spending-group-"+g));
  expect(groups[0]).toHaveTextContent("Car");
  expect(groups[0]).toHaveTextContent("Instalment");
  expect(groups[1]).toHaveTextContent("Fuel");
  expect(groups[1]).toHaveTextContent("Maintenance");
  expect(groups[2]).not.toHaveTextContent("Car");
  expect(groups[0]!.compareDocumentPosition(groups[1]!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(within(screen.getByTestId("unique-category-cards")).getAllByText("Car")).toHaveLength(1);
  expect(screen.getByTestId("spending-unassigned")).toHaveTextContent("Nanny");
  expect(screen.getByTestId("saved-group-state")).toHaveTextContent('"amount":90');
 });
 it("lets parents classify Nanny without any subcategory, then change or clear it",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-custom-n"));
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  let dialog=screen.getByRole("dialog",{name:"Edit family category"});
  const classification=within(dialog).getByLabelText("Category spending classification");
  expect(classification).toHaveValue("");
  fireEvent.change(classification,{target:{value:"committed"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save category"}));
  expect(screen.getByTestId("spending-group-committed")).toHaveTextContent("General category costs (no subcategory)");
  expect(screen.getByTestId("spending-group-committed")).toHaveTextContent("Nanny");
  expect(screen.getByTestId("spending-unassigned")).not.toHaveTextContent("Nanny");
  let state=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(state.categories.find(c=>c.id==="n")?.remainderRole).toBe("committed");
  expect(state.budgetItems).toHaveLength(3);
  fireEvent.click(screen.getByTestId("category-custom-n"));
  // Click again if the category panel was already open.
  if(!screen.queryByTestId("unified-category-details"))fireEvent.click(screen.getByTestId("category-custom-n"));
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  dialog=screen.getByRole("dialog",{name:"Edit family category"});
  fireEvent.change(within(dialog).getByLabelText("Category spending classification"),{target:{value:"flexible"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save category"}));
  expect(screen.getByTestId("spending-group-flexible")).toHaveTextContent("Nanny");
  state=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(state.budgetItems).toHaveLength(3);
  expect(state.expenses).toHaveLength(1);
 });
 it("edits a line from necessary to flexible without changing parent category or payment history",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-custom-car"));
  fireEvent.click(within(screen.getByTestId("unified-category-details")).getAllByRole("button",{name:"Edit"})[0]!);
  const form=screen.getByRole("form",{name:"Add subcategory"});
  expect(within(form).getByLabelText("Spending behaviour")).toHaveValue("committed");
  fireEvent.change(within(form).getByLabelText("Spending behaviour"),{target:{value:"flexible"}});
  fireEvent.click(within(form).getByRole("button",{name:"Save changes"}));
  expect(screen.getByTestId("spending-group-flexible")).toHaveTextContent("Instalment");
  const output=screen.getByTestId("saved-group-state");
  expect(output).toHaveTextContent('"spendingRole":"flexible"');
  expect(output).toHaveTextContent('"amount":90');
  expect(output).toHaveTextContent('"planned":700');
 });
});
