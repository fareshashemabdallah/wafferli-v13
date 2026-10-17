import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {TodayQuickActions} from "@/components/TodayQuickActions";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {useLocalState,writeLocal} from "@/lib/storage";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
 <a href={to} {...props}>{children}</a>
}));
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
const draw=(ask=vi.fn())=>render(<I18nProvider><TodayQuickActions onAsk={ask}/></I18nProvider>);
const realMoney=():MoneyState=>({...sampleMoney(),demo:false,expenses:[]});
describe("Today speed actions without another navigation layer",()=>{
 it("reveals three immediate tasks without requiring a new page",async()=>{
  const ask=vi.fn();draw(ask);
  expect(screen.getByRole("region",{name:"Quick family actions"})).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Add expense"})).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Add shopping item"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Ask Dabberna"}));
  expect(ask).toHaveBeenCalledOnce();
  expect(screen.queryByRole("link",{name:"Ask Dabberna"})).not.toBeInTheDocument();
 });
 it("saves a real shopping need to the existing family basket, with no invented price",async()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Add shopping item"}));
  fireEvent.change(screen.getByRole("textbox",{name:"What do you need?"}),{target:{value:"Milk"}});
  fireEvent.click(screen.getByRole("button",{name:"Save item"}));
  await screen.findByText("Saved to your family basket.");
  expect(screen.getByText("1 shopping items open")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("wafferli.v13.shopping")??"[]")).toEqual([
   expect.objectContaining({name:"Milk",qty:1,price:0,done:false})
  ]);
  fireEvent.change(screen.getByRole("textbox",{name:"What do you need?"}),{target:{value:"milk"}});
  fireEvent.click(screen.getByRole("button",{name:"Save item"}));
  expect(screen.getByRole("alert")).toHaveTextContent("already on your open shopping list");
  expect(JSON.parse(localStorage.getItem("wafferli.v13.shopping")??"[]")).toHaveLength(1);
 });
 it("records an expense once and updates Today recorded-month figure from the same local Money key",async()=>{
  localStorage.setItem("wafferli.v13.money",JSON.stringify(realMoney()));
  draw();
  await screen.findByText("Recorded this month: 0 JOD · 0 shopping items open");
  fireEvent.click(screen.getByRole("button",{name:"Add expense"}));
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"15.50"}});
  fireEvent.change(screen.getByLabelText("Category"),{target:{value:"groc"}});
  fireEvent.click(screen.getByRole("button",{name:"Save expense"}));
  await screen.findByText("Expense recorded once");
  await waitFor(()=>expect(screen.getByText("Recorded this month: 15.5 JOD · 0 shopping items open")).toBeInTheDocument());
  const saved=JSON.parse(localStorage.getItem("wafferli.v13.money")??"{}") as MoneyState;
  expect(saved.expenses).toHaveLength(1);
  expect(saved.expenses[0]).toMatchObject({amount:15.5,status:"paid",shared:false});
 });
 it("uses real data only and does not record expenses on demo money",async()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Add expense"}));
  await screen.findByText(/cannot record real spending while Money contains example figures/i);
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
});
function TwoReaders(){
 const [a,setA]=useLocalState("sharedCounter",0);
 const [b]=useLocalState("sharedCounter",0);
 return <div><span data-testid="reader-a">{a}</span><span data-testid="reader-b">{b}</span>
  <button type="button" onClick={()=>setA(x=>x+1)}>Increment</button></div>;
}
describe("local family data coherence",()=>{
 it("updates separately mounted subscribers in the same tab",async()=>{
  render(<TwoReaders/>);
  fireEvent.click(screen.getByRole("button",{name:"Increment"}));
  await waitFor(()=>expect(screen.getByTestId("reader-b")).toHaveTextContent("1"));
  expect(screen.getByTestId("reader-a")).toHaveTextContent("1");
  expect(localStorage.getItem("wafferli.v13.sharedCounter")).toBe("1");
 });
 it("exposes only the changed key, not private financial values, through the sync event",async()=>{
  let detail:unknown;
  const callback=(e:Event)=>{detail=(e as CustomEvent).detail};
  window.addEventListener("dabberna:local-data-updated",callback);
  try{
   expect(writeLocal("money",{income:2468})).toBe(true);
   await waitFor(()=>expect(detail).toBe("money"));
   expect(JSON.stringify(detail)).not.toContain("2468");
  }finally{window.removeEventListener("dabberna:local-data-updated",callback)}
 });
});
