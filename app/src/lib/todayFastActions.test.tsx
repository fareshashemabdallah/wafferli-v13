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
 it("offers only the two approved Today quick actions",async()=>{
  const ask=vi.fn();draw(ask);
  expect(screen.getByRole("region",{name:"Quick family actions"})).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Add expense"})).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Add shopping item"})).not.toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.shopping")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Jump to Ask Dabberna"}));
  expect(ask).toHaveBeenCalledOnce();
  expect(screen.queryByRole("link",{name:"Ask Dabberna"})).not.toBeInTheDocument();
 });
 it("records an expense once and updates Today recorded-month figure from the same local Money key",async()=>{
  localStorage.setItem("wafferli.v13.money",JSON.stringify(realMoney()));
  draw();
  await waitFor(()=>expect(screen.getByRole("button",{name:"Add expense"})).toBeEnabled());
  fireEvent.click(screen.getByRole("button",{name:"Add expense"}));
  fireEvent.change(screen.getByLabelText("Amount (JOD)"),{target:{value:"15.50"}});
  fireEvent.change(screen.getByLabelText("Category"),{target:{value:"groc"}});
  fireEvent.click(screen.getByRole("button",{name:"Save expense"}));
  await screen.findByText("Expense recorded once");
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
