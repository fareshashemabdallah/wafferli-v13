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
 it("offers Edit amount & classification visibly on the category card, without first opening cost details",()=>{
  render(<App/>);
  const tiles=screen.getByTestId("unique-category-cards");
  const edit=within(tiles).getByRole("button",{name:"Edit amount & classification for Nanny"});
  expect(edit).toBeVisible();
  expect(screen.queryByTestId("unified-category-details")).not.toBeInTheDocument();
  fireEvent.click(edit);
  const dialog=screen.getByRole("dialog",{name:"Edit family category"});
  expect(within(dialog).getByLabelText("Usual monthly allowance (JOD)")).toHaveValue(400);
  expect(within(dialog).getByLabelText("Category spending classification")).toHaveValue("");
  fireEvent.change(within(dialog).getByLabelText("Category spending classification"),{target:{value:"committed"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save category"}));
  expect(screen.getByTestId("spending-group-committed")).toHaveTextContent("Nanny");
  const money=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(money.categories.find(c=>c.id==="n")).toMatchObject({planned:400,remainderRole:"committed"});
  expect(money.budgetItems).toHaveLength(3);
  expect(money.expenses).toHaveLength(1);
 });
 it("lets parents classify Nanny without any subcategory, then change or clear it",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-custom-n"));
  fireEvent.click(screen.getByRole("button",{name:"Edit amount & classification"}));
  let dialog=screen.getByRole("dialog",{name:"Edit family category"});
  const classification=within(dialog).getByLabelText("Category spending classification");
  expect(classification).toHaveValue("");
  fireEvent.change(classification,{target:{value:"committed"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save category"}));
  expect(screen.getByTestId("spending-group-committed")).toHaveTextContent("General category costs (no subcategory)");
  expect(screen.getByTestId("spending-group-committed")).toHaveTextContent("Nanny");
  expect(screen.queryByTestId("spending-unassigned")?.textContent??"").not.toContain("Nanny");
  let state=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(state.categories.find(c=>c.id==="n")?.remainderRole).toBe("committed");
  expect(state.budgetItems).toHaveLength(3);
  fireEvent.click(screen.getByTestId("category-custom-n"));
  // Click again if the category panel was already open.
  if(!screen.queryByTestId("unified-category-details"))fireEvent.click(screen.getByTestId("category-custom-n"));
  fireEvent.click(screen.getByRole("button",{name:"Edit amount & classification"}));
  dialog=screen.getByRole("dialog",{name:"Edit family category"});
  fireEvent.change(within(dialog).getByLabelText("Category spending classification"),{target:{value:"flexible"}});
  fireEvent.click(within(dialog).getByRole("button",{name:"Save category"}));
  expect(screen.getByTestId("spending-group-flexible")).toHaveTextContent("Nanny");
  state=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(state.budgetItems).toHaveLength(3);
  expect(state.expenses).toHaveLength(1);
 });
 it("classifies Groceries or Nanny right inside the expanded category, without finding Edit or adding a subcategory",()=>{
  render(<App/>);
  const before=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  fireEvent.click(screen.getByTestId("category-custom-n"));
  const details=screen.getByTestId("unified-category-details");
  const inline=within(details).getByTestId("category-inline-classification");
  const select=within(inline).getByRole("combobox",{name:"Category spending classification"});
  expect(select).toHaveValue("");
  fireEvent.change(select,{target:{value:"committed"}});
  expect(within(screen.getByTestId("spending-group-committed")).getByText("General category costs (no subcategory)")).toBeInTheDocument();
  const after=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(after.categories.find(c=>c.id==="n")?.remainderRole).toBe("committed");
  expect(after.budgetItems).toEqual(before.budgetItems);
  expect(after.expenses).toEqual(before.expenses);
  expect(after.commitments).toEqual(before.commitments);
 });
 it("a category with detailed cost lines shows a cushion but no second classification selector",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-custom-car"));
  const details=screen.getByTestId("unified-category-details");
  expect(within(details).queryByRole("combobox",{name:"Category spending classification"})).not.toBeInTheDocument();
  expect(within(details).getByTestId("category-monthly-cushion")).toHaveTextContent("No other classification needed");
  expect(within(details).getByRole("button",{name:"Edit category amount"})).toBeInTheDocument();
  expect(screen.getByTestId("spending-group-committed")).toHaveTextContent("Instalment");
  expect(screen.getByTestId("spending-group-necessary")).toHaveTextContent("Fuel");
  const saved=JSON.parse(screen.getByTestId("saved-group-state").textContent??"{}") as MoneyState;
  expect(saved.categories.find(c=>c.id==="car")?.remainderRole).toBeUndefined();
 });
 it("Utilities with five classified lines and 95 JOD spare displays it as a cushion, not a classification task",()=>{
  function Utilities(){
   const base=sample();
   const [state,setState]=useState<MoneyState>({...base,
    categories:[{id:"util",name:"Utilities",planned:500,type:"variable"}],
    budgetItems:[
     {id:"water",categoryId:"util",name:"Water",amountJod:150,frequency:"monthly",enabled:true,spendingRole:"necessary",behaviour:"variable",priority:"essential"},
     {id:"electric",categoryId:"util",name:"Electricity",amountJod:150,frequency:"monthly",enabled:true,spendingRole:"necessary",behaviour:"variable",priority:"essential"},
     {id:"internet",categoryId:"util",name:"Internet",amountJod:35,frequency:"monthly",enabled:true,spendingRole:"committed",behaviour:"fixed",priority:"essential"},
     {id:"building",categoryId:"util",name:"Building",amountJod:50,frequency:"monthly",enabled:true,spendingRole:"committed",behaviour:"fixed",priority:"essential"},
     {id:"phone",categoryId:"util",name:"Phone",amountJod:20,frequency:"monthly",enabled:true,spendingRole:"committed",behaviour:"fixed",priority:"essential"}
    ],expenses:[]});
   return <I18nProvider><FamilyMoneyRhythm state={state} setState={setState} onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/></I18nProvider>;
  }
  render(<Utilities/>);
  expect(screen.getByTestId("spending-unassigned")).toHaveTextContent("Monthly budget cushion");
  expect(screen.getByTestId("spending-unassigned")).toHaveTextContent("95 JOD");
  expect(screen.getByTestId("spending-unassigned")).not.toHaveTextContent("Still to split within categories");
  fireEvent.click(screen.getByRole("button",{name:/Utilities · Costs and payments/}));
  const details=screen.getByTestId("unified-category-details");
  expect(within(details).getByTestId("category-monthly-cushion")).toHaveTextContent("95 JOD");
  expect(within(details).queryByTestId("category-inline-classification")).not.toBeInTheDocument();
  fireEvent.click(within(details).getByRole("button",{name:"Edit category amount"}));
  const dialog=screen.getByRole("dialog",{name:"Edit family category"});
  expect(within(dialog).queryByRole("combobox",{name:"Category spending classification"})).not.toBeInTheDocument();
  expect(within(dialog).getByTestId("editor-category-cushion")).toHaveTextContent("already classified");
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
