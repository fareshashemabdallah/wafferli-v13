import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {OccasionPreparationSection} from "@/components/OccasionPreparationSection";
import {sampleMoney} from "@/lib/money";
import type {MomentOccurrence} from "@/lib/familyCalendar";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=><a href={to} {...props}>{children}</a>
}));
const event:MomentOccurrence={id:"member-birthday:sophia",title:"Sophia's birthday",kind:"birthday",
 date:"2027-02-17",occursOn:"2027-02-17",annual:true};
const put=(key:string,value:unknown)=>localStorage.setItem("wafferli.v13."+key,JSON.stringify(value));
const get=<T,>(key:string):T=>JSON.parse(localStorage.getItem("wafferli.v13."+key)??"null") as T;
const draw=()=>render(<I18nProvider><OccasionPreparationSection event={event}/></I18nProvider>);
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
describe("Existing Calendar → Plans occasion integration",()=>{
 it("creates exactly one linked occasion plan from the calendar date, not a parallel record",async()=>{
  draw();
  const btn=await screen.findByRole("button",{name:"Prepare this occasion"});
  fireEvent.click(btn);
  await screen.findByRole("heading",{name:"Gift, celebration & preparation"});
  const saved=get<Array<{id:string;sourceRef:string;date:string}>>("familyPlans");
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({sourceRef:"occasion:member-birthday:sophia@2027",date:event.occursOn});
  expect(localStorage.getItem("wafferli.v13.familyCalendar")).toBeNull();
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
  cleanup();
  draw();
  await screen.findByRole("heading",{name:"Gift, celebration & preparation"});
  expect(get<Array<unknown>>("familyPlans")).toHaveLength(1);
 });
 it("saves gift and celebration amounts on the SAME plan without writing expenses, and creates each preparation task once",async()=>{
  const money={...sampleMoney(),demo:false,expenses:[]};
  put("money",money);
  draw();
  fireEvent.click(await screen.findByRole("button",{name:"Prepare this occasion"}));
  await screen.findByRole("heading",{name:"Gift, celebration & preparation"});
  fireEvent.change(screen.getByRole("spinbutton",{name:"Gift (JOD)"}),{target:{value:"120"}});
  fireEvent.change(screen.getByRole("spinbutton",{name:"Celebration / activity (JOD)"}),{target:{value:"200"}});
  fireEvent.change(screen.getByRole("textbox",{name:"Gift idea or description (optional)"}),{target:{value:"Science kit"}});
  fireEvent.click(screen.getByRole("button",{name:"Cake, decorations & other costs"}));
  fireEvent.change(screen.getByRole("spinbutton",{name:"Cake, decorations & extras (JOD)"}),{target:{value:"30"}});
  fireEvent.click(screen.getByRole("button",{name:"Save occasion costs"}));
  expect(await screen.findByText(/Saved to this existing occasion plan/)).toBeInTheDocument();
  const plans=get<Array<{id:string;budgetJod:number;occasionPreparation:{gift:{amountJod:number;description:string};celebration:{amountJod:number};extras:{amountJod:number}}}>>("familyPlans");
  expect(plans).toHaveLength(1);
  expect(plans[0]).toMatchObject({budgetJod:350,occasionPreparation:{
   gift:{amountJod:120,description:"Science kit"},celebration:{amountJod:200},extras:{amountJod:30}
  }});
  expect(get("money")).toEqual(money);
  expect(localStorage.getItem("wafferli.v13.familyTasks")).toBeNull();
  fireEvent.click(await screen.findByRole("button",{name:"Add / align preparation tasks"}));
  await waitFor(()=>expect(screen.getAllByRole("checkbox")).toHaveLength(3));
  const tasks=get<Array<{id:string;planId:string;status:string}>>("familyTasks");
  expect(tasks).toHaveLength(3);
  expect(tasks.every(x=>x.planId===plans[0]!.id)).toBe(true);
  expect(screen.queryByRole("button",{name:"Add / align preparation tasks"})).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("checkbox")[0]!);
  await waitFor(()=>expect(get<Array<{status:string}>>("familyTasks").filter(x=>x.status==="done")).toHaveLength(1));
  expect(get("money")).toEqual(money);
 });
 it("shows unavailable financial advice instead of pretending demo data establishes affordability",async()=>{
  draw();
  fireEvent.click(await screen.findByRole("button",{name:"Prepare this occasion"}));
  await screen.findByRole("heading",{name:"Gift, celebration & preparation"});
  fireEvent.change(screen.getByRole("spinbutton",{name:"Gift (JOD)"}),{target:{value:"100"}});
  fireEvent.click(screen.getByRole("button",{name:"Save occasion costs"}));
  expect(await screen.findByText(/sample data cannot support recommendations/)).toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Review My Money"})).toHaveAttribute("href","/money");
 });
});
