import {useState} from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {I18nProvider} from "./i18n";
import {SpendingDiscoveries} from "@/components/SpendingDiscoveries";
import {QuickExpenseEntry} from "@/components/QuickExpenseEntry";
import {localToday} from "./cashflow";
import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";
const today=localToday();
function fixture():MoneyState{return {...emptyRealMoney(),cashOnHand:300,
 categories:[{id:"out",name:"Eating out",type:"variable",planned:180}],
 expenses:[
  {id:"a",date:today,categoryId:"out",amount:12,status:"paid",shared:false,purpose:"food-delivery"},
  {id:"b",date:today,categoryId:"out",amount:9,status:"paid",shared:false,purpose:"food-delivery"},
  {id:"c",date:today,categoryId:"out",amount:11,status:"paid",shared:false,purpose:"food-delivery"},
  {id:"d",date:today,categoryId:"out",amount:13,status:"paid",shared:false,purpose:"food-delivery"},
  {id:"e",date:today,categoryId:"out",amount:20,status:"paid",shared:false}
 ]};}
function App(){
 const [state,setState]=useState(fixture());
 return <I18nProvider>
  <SpendingDiscoveries state={state} setState={setState} onStartReal={()=>{}} onRecordExpense={()=>{}}/>
  <output data-testid="ledger">{JSON.stringify(state.expenses)}</output>
  <output data-testid="targets">{JSON.stringify(state.spendingDiscoveryTargets??{})}</output>
 </I18nProvider>;
}
function Entry(){
 const [state,setState]=useState<MoneyState>({...fixture(),expenses:[]});
 const [closed,setClosed]=useState(false);
 return <I18nProvider>
  {!closed&&<QuickExpenseEntry state={state} setState={setState} onClose={()=>setClosed(true)} onHistory={()=>{}}/>}
  <output data-testid="entry-state">{JSON.stringify(state)}</output>
 </I18nProvider>;
}
beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();window.localStorage.clear();});
describe("Spending discoveries user journey",()=>{

 it("keeps the discovery visible in demo mode with clearly marked example figures",()=>{
  const onStart=vi.fn(),onExpense=vi.fn();
  const state={...fixture(),demo:true};
  render(<I18nProvider><SpendingDiscoveries state={state} setState={()=>{}}
   onStartReal={onStart} onRecordExpense={onExpense}/></I18nProvider>);
  expect(screen.getByTestId("money-spending-discoveries")).toBeInTheDocument();
  expect(screen.getByText("Spending Discoveries")).toBeInTheDocument();
  expect(screen.getByText("Example only · not your spending")).toBeInTheDocument();
  expect(screen.getByText(/sample orders/)).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Choose a spending target"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Use my own figures"}));
  expect(onStart).toHaveBeenCalledOnce();
  expect(onExpense).not.toHaveBeenCalled();
 });
 it("keeps an informative empty state with zero or one paid expense, without fabricated findings",()=>{
  const onExpense=vi.fn();
  const sample=fixture();
  const make=(expenses:MoneyState["expenses"])=><I18nProvider><SpendingDiscoveries
   state={{...sample,expenses}} setState={()=>{}} onStartReal={()=>{}} onRecordExpense={onExpense}/></I18nProvider>;
  const {rerender}=render(make([]));
  expect(screen.getByTestId("money-spending-discoveries")).toBeInTheDocument();
  expect(screen.getByText(/No overlooked spending pattern spotted yet/)).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Choose a spending target"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Record an expense"}));
  expect(onExpense).toHaveBeenCalledOnce();
  rerender(make([sample.expenses[0]!]));
  expect(screen.getByText(/No overlooked spending pattern spotted yet/)).toBeInTheDocument();
  expect(screen.queryByText(/Example only/)).not.toBeInTheDocument();
 });
 it("shows a distinct delivery subtotal and saves a target without changing expense or budget records",()=>{
  render(<App/>);
  expect(screen.getByTestId("money-spending-discoveries")).toBeInTheDocument();
  expect(screen.getAllByText("Food delivery").length).toBeGreaterThan(0);
  const before=screen.getByTestId("ledger").textContent;
  fireEvent.click(screen.getByRole("button",{name:"Choose a spending target"}));
  fireEvent.change(screen.getByLabelText("Monthly spending target in JOD"),{target:{value:"15"}});
  fireEvent.click(screen.getByRole("button",{name:"Save target"}));
  expect(screen.getByTestId("targets")).toHaveTextContent('"food-delivery":15');
  expect(screen.getByTestId("ledger").textContent).toBe(before);
  expect(screen.getByText(/above target so far/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Adjust my target"}));
  fireEvent.click(screen.getByRole("button",{name:"Remove target"}));
  expect(screen.getByTestId("targets")).toHaveTextContent("{}");
 });
 it("records an explicitly tagged paid delivery exactly once without deducting cash",()=>{
  render(<Entry/>);
  const dialog=screen.getByRole("dialog",{name:"Quick add expense"});
  fireEvent.change(screen.getByLabelText("Amount · JOD"),{target:{value:"12.50"}});
  fireEvent.click(screen.getByLabelText("Food delivery (optional)"));
  fireEvent.click(screen.getByRole("button",{name:"Save expense"}));
  const saved=JSON.parse(screen.getByTestId("entry-state").textContent??"{}") as MoneyState;
  expect(saved.expenses).toHaveLength(1);
  expect(saved.expenses[0]).toMatchObject({amount:12.5,purpose:"food-delivery",status:"paid"});
  expect(saved.cashOnHand).toBe(300);
 });
});
