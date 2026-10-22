import {useState} from "react";
import {afterEach,beforeEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {FamilyMoneyRhythm} from "@/components/FamilyMoneyRhythm";
import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";
function start():MoneyState{
 return {...emptyRealMoney(),cashOnHand:null,categories:[],
   expenses:[],commitments:[],incomeSources:[]};
}
function App({initial=start()}:{initial?:MoneyState}){
 const [money,setMoney]=useState(initial);
 return <I18nProvider><FamilyMoneyRhythm state={money} setState={setMoney}
  onBills={()=>{}} onSpending={()=>{}} onCategories={()=>{}}/>
  <output data-testid="money-records">{JSON.stringify(money)}</output></I18nProvider>;
}
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();});
describe("direct category editing in the pictured Family Money Map",()=>{
 it("first-time groceries opens name and monthly amount directly, then card updates",()=>{
  render(<App/>);
  expect(screen.getByTestId("category-picture-groceries")).toHaveTextContent("Not entered");
  fireEvent.click(screen.getByTestId("category-picture-groceries"));
  const dlg=screen.getByRole("dialog",{name:"Add family category"});
  expect(within(dlg).getByLabelText("Category name")).toHaveValue("Groceries");
  fireEvent.change(within(dlg).getByLabelText("Usual monthly allowance (JOD)"),{target:{value:"400"}});
  fireEvent.click(within(dlg).getByRole("button",{name:"Save category"}));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByTestId("category-picture-groceries")).toHaveTextContent("Groceries");
  expect(screen.getByTestId("money-records")).toHaveTextContent('"planned":400');
  expect(screen.getByTestId("money-records")).toHaveTextContent('"expenses":[]');
 });
 it("renames an existing category and edits amount without losing history, then reopens same image",()=>{
  const original:MoneyState={...start(),categories:[{id:"groc",name:"Groceries",type:"variable",planned:300}],
   expenses:[{id:"paid",categoryId:"groc",date:"2026-10-19",amount:25,status:"paid",shared:false}],
   categoryMonthlyPlans:{"2026-12":{groc:370}}};
  render(<App initial={original}/>);
  fireEvent.click(screen.getByTestId("category-picture-groceries"));
  expect(screen.getByTestId("unified-category-details")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  let dlg=screen.getByRole("dialog",{name:"Edit family category"});
  fireEvent.change(within(dlg).getByLabelText("Category name"),{target:{value:"Supermarket"}});
  fireEvent.change(within(dlg).getByLabelText("Usual monthly allowance (JOD)"),{target:{value:"330"}});
  fireEvent.click(within(dlg).getByRole("button",{name:"Save category"}));
  const records=screen.getByTestId("money-records");
  expect(records).toHaveTextContent('"name":"Supermarket"');
  expect(records).toHaveTextContent('"categoryId":"groc"');
  expect(records).toHaveTextContent('"2026-12":{"groc":370}');
  expect(screen.getByTestId("category-picture-groceries")).toHaveTextContent("Supermarket");
  fireEvent.click(screen.getByTestId("category-picture-groceries"));
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  dlg=screen.getByRole("dialog",{name:"Edit family category"});
  expect(within(dlg).getByLabelText("Category name")).toHaveValue("Supermarket");
  expect(within(dlg).getByLabelText("Usual monthly allowance (JOD)")).toHaveValue(330);
 });
 it("adds a custom school fees category as an independent illustrated tile and allows edits",()=>{
  render(<App/>);
  fireEvent.click(screen.getAllByRole("button",{name:/Add category/})[0]!);
  const dlg=screen.getByRole("dialog",{name:"Add family category"});
  fireEvent.change(within(dlg).getByLabelText("Category name"),{target:{value:"School Fees"}});
  fireEvent.change(within(dlg).getByLabelText("Usual monthly allowance (JOD)"),{target:{value:"220"}});
  fireEvent.click(within(dlg).getByRole("button",{name:"Save category"}));
  const records=JSON.parse(screen.getByTestId("money-records").textContent||"{}") as MoneyState;
  expect(records.categories).toHaveLength(1);
  expect(records.categories[0]).toMatchObject({name:"School Fees",planned:220,visualGroup:"custom"});
  const tile=screen.getByTestId("category-custom-"+records.categories[0]!.id);
  expect(tile).toHaveTextContent("School Fees");
  fireEvent.click(tile);
  fireEvent.click(screen.getByRole("button",{name:"Edit category amount"}));
  expect(within(screen.getByRole("dialog",{name:"Edit family category"})).getByLabelText("Category name")).toHaveValue("School Fees");
 });
 it("blocks duplicate names rather than creating a second category",()=>{
  render(<App/>);
  fireEvent.click(screen.getByTestId("category-picture-groceries"));
  fireEvent.change(screen.getByLabelText("Usual monthly allowance (JOD)"),{target:{value:"100"}});
  fireEvent.click(screen.getByRole("button",{name:"Save category"}));
  fireEvent.click(screen.getAllByRole("button",{name:/Add category/})[0]!);
  fireEvent.change(screen.getByLabelText("Category name"),{target:{value:"Groceries"}});
  fireEvent.change(screen.getByLabelText("Usual monthly allowance (JOD)"),{target:{value:"300"}});
  fireEvent.click(screen.getByRole("button",{name:"Save category"}));
  expect(screen.getByRole("alert")).toHaveTextContent("already exists");
  const records=JSON.parse(screen.getByTestId("money-records").textContent||"{}") as MoneyState;
  expect(records.categories).toHaveLength(1);
 });
});
