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
describe("A family-first Money page using the same classified financial records",()=>{
 it("keeps classified spending visible in one compact dashboard without repeating all cost lines",()=>{
  render(<App/>);
  const mix=screen.getByTestId("money-spending-mix");
  expect(mix).toHaveTextContent("Committed");
  expect(mix).toHaveTextContent("Necessary, variable");
  expect(mix).toHaveTextContent("Budget cushions");
  expect(screen.queryByText("What each cost means for our money")).not.toBeInTheDocument();
  expect(screen.queryByTestId("spending-group-committed")).not.toBeInTheDocument();
  expect(screen.queryByText("More planning tools (optional)")).not.toBeInTheDocument();
  expect(screen.getByTestId("money-category-preview").children).toHaveLength(2);
  expect(screen.queryByRole("button",{name:/View all categories/})).not.toBeInTheDocument();
 });
 it("opens only the selected category and exposes budget, spent and the two primary actions",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-custom-car"));
  const details=screen.getByTestId("unified-category-details");
  expect(details).toHaveTextContent("Car");
  expect(details).toHaveTextContent("Monthly budget");
  expect(details).toHaveTextContent("Spent");
  expect(details).toHaveTextContent("Remaining");
  expect(within(details).getAllByRole("button",{name:"Record spending"})[0]!).toBeInTheDocument();
  expect(within(details).getByRole("button",{name:"Edit budget"})).toBeInTheDocument();
  expect(screen.queryByText("More planning tools (optional)")).not.toBeInTheDocument();
  expect(screen.queryByTestId("category-custom-n")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Back to categories/}));
  expect(screen.getByTestId("category-custom-n")).toBeInTheDocument();
 });
 it("classifies a category without adding a separate line or financial entry",()=>{
  render(<App/>);
  const before=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  fireEvent.click(screen.getByTestId("category-custom-n"));
  fireEvent.click(within(screen.getByTestId("unified-category-details")).getByRole("button",{name:"Edit budget"}));
  const dlg=screen.getByRole("dialog",{name:"Edit family category"});
  fireEvent.change(within(dlg).getByLabelText("Category spending classification"),{target:{value:"committed"}});
  fireEvent.click(within(dlg).getByRole("button",{name:"Save category"}));
  const after=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(after.categories.find(c=>c.id==="n")?.remainderRole).toBe("committed");
  expect(after.budgetItems).toEqual(before.budgetItems);
  expect(after.expenses).toEqual(before.expenses);
  expect(after.commitments).toEqual(before.commitments);
  expect(screen.getByTestId("mix-stat-committed")).toHaveTextContent("750 JOD");
 });
 it("edits a detailed cost line without losing other category data or paid transactions",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-custom-car"));
  fireEvent.click(within(screen.getByTestId("unified-category-details")).getByText(/Budget breakdown/));
  const details=screen.getByTestId("unified-category-details");
  fireEvent.click(within(details).getAllByRole("button",{name:"Edit"})[0]!);
  const form=screen.getByRole("form",{name:"Add subcategory"});
  expect(within(form).getByLabelText("Spending behaviour")).toHaveValue("committed");
  fireEvent.change(within(form).getByLabelText("Spending behaviour"),{target:{value:"flexible"}});
  fireEvent.click(within(form).getByRole("button",{name:"Save changes"}));
  const json=screen.getByTestId("saved-group-state").textContent??"";
  expect(json).toContain('"spendingRole":"flexible"');
  expect(json).toContain('"amount":90');
  expect(json).toContain('"planned":700');
 });
});
