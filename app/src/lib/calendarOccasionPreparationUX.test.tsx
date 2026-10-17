import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {OccasionPreparationSection} from "@/components/OccasionPreparationSection";
import {sampleMoney} from "@/lib/money";
import type {MomentOccurrence} from "@/lib/familyCalendar";

vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a {...props} href={to}>{children}</a>
}));
const occasion:MomentOccurrence={
 id:"member-birthday:sophia",title:"Sophia's birthday",date:"2019-02-17",
 occursOn:"2027-02-17",annual:true,kind:"birthday"
};
const read=(name:string)=>JSON.parse(localStorage.getItem("wafferli.v13."+name)??"null");
const draw=()=>render(<I18nProvider><OccasionPreparationSection event={occasion}/></I18nProvider>);
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});

describe("calendar-integrated occasion preparation",()=>{
 it("reuses one existing calendar occasion and plan, records no expenses or savings, and creates tasks once",async()=>{
  const financial=sampleMoney();
  localStorage.setItem("wafferli.v13.money",JSON.stringify(financial));
  draw();
  fireEvent.click(await screen.findByRole("button",{name:"Prepare this occasion"}));
  await waitFor(()=>expect(read("familyPlans")).toHaveLength(1));
  const firstId=read("familyPlans")[0].id;
  await screen.findByLabelText("Gift (JOD)");
  fireEvent.change(screen.getByLabelText("Gift (JOD)"),{target:{value:"120"}});
  fireEvent.change(screen.getByLabelText("Gift idea or description (optional)"),{target:{value:"Science kit"}});
  fireEvent.change(screen.getByLabelText("Celebration / activity (JOD)"),{target:{value:"200"}});
  fireEvent.click(screen.getByRole("button",{name:"Cake, decorations & other costs"}));
  fireEvent.change(screen.getByLabelText("Cake, decorations & extras (JOD)"),{target:{value:"30"}});
  const dates=screen.getAllByLabelText("Needed / payable by");
  fireEvent.change(dates[0]!,{target:{value:"2026-11-20"}});
  fireEvent.change(dates[1]!,{target:{value:"2027-02-03"}});
  fireEvent.change(dates[2]!,{target:{value:"2027-01-15"}});
  fireEvent.click(screen.getByRole("button",{name:"Save occasion costs"}));
  await waitFor(()=>expect(read("familyPlans")[0].occasionPreparation?.gift.amountJod).toBe(120));
  const plan=read("familyPlans")[0];
  expect(read("familyPlans")).toHaveLength(1);
  expect(plan).toMatchObject({id:firstId,kind:"occasion",date:"2027-02-17",
   budgetJod:350,occasionPreparation:{gift:{description:"Science kit",dueDate:"2026-11-20"},celebration:{amountJod:200},extras:{amountJod:30}}});
  expect(read("money")).toEqual(financial);
  expect(read("occasionPlans")).toBeNull();
  expect(read("familyTasks")).toBeNull();
  expect(screen.getByText("Planned occasion cost")).toBeInTheDocument();
  expect(screen.getByText(/Sample budgets cannot support advice/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Add / align preparation tasks"}));
  await waitFor(()=>expect(read("familyTasks")).toHaveLength(3));
  expect(read("familyTasks").every((x:{planId:string})=>x.planId===firstId)).toBe(true);
  expect(read("money")).toEqual(financial);
 });
 it("updates task dates only after a second explicit parent action",async()=>{
  const existing={id:"plan1",title:"Sophia's birthday",kind:"occasion",status:"planning",
   date:"2027-02-17",sourceRef:"occasion:member-birthday:sophia@2027",
   createdAt:"2026-10-10T00:00:00Z",updatedAt:"2026-10-10T00:00:00Z",
   occasionPreparation:{
    gift:{description:"Science kit",amountJod:120,dueDate:"2026-11-20"},
    celebration:{amountJod:200,dueDate:"2027-02-03"},
    extras:{amountJod:0,dueDate:"2027-02-17"}
   }};
  localStorage.setItem("wafferli.v13.familyPlans",JSON.stringify([existing]));
  const oldTask={id:"occasion-gift-plan1",planId:"plan1",title:"Arrange gift",dueDate:"2026-11-20",
   priority:"normal",status:"open",createdAt:"2026-10-10T00:00:00Z",updatedAt:"2026-10-10T00:00:00Z"};
  localStorage.setItem("wafferli.v13.familyTasks",JSON.stringify([oldTask]));
  draw();
  const dates=await screen.findAllByLabelText("Needed / payable by");
  fireEvent.change(dates[0]!,{target:{value:"2026-12-20"}});
  fireEvent.click(screen.getByRole("button",{name:"Save occasion costs"}));
  await waitFor(()=>expect(read("familyPlans")[0].occasionPreparation.gift.dueDate).toBe("2026-12-20"));
  expect(read("familyTasks")[0].dueDate).toBe("2026-11-20");
  fireEvent.click(screen.getByRole("button",{name:"Add / align preparation tasks"}));
  await waitFor(()=>expect(read("familyTasks").find((x:{id:string})=>x.id==="occasion-gift-plan1").dueDate).toBe("2026-12-20"));
  expect(read("familyTasks").filter((x:{id:string})=>x.id==="occasion-gift-plan1")).toHaveLength(1);
 });
 it("preserves the real budget and plan if browser persistence fails",async()=>{
  const original={id:"plan1",title:"Sophia's birthday",kind:"occasion",status:"planning",
   date:"2027-02-17",sourceRef:"occasion:member-birthday:sophia@2027",budgetJod:400,
   createdAt:"2026-10-10T00:00:00Z",updatedAt:"2026-10-10T00:00:00Z"};
  localStorage.setItem("wafferli.v13.familyPlans",JSON.stringify([original]));
  draw();
  fireEvent.change(await screen.findByLabelText("Gift (JOD)"),{target:{value:"300"}});
  const native=Storage.prototype.setItem;
  vi.spyOn(Storage.prototype,"setItem").mockImplementation(function(this:Storage,key,value){
   if(key==="wafferli.v13.familyPlans")throw new DOMException("Quota","QuotaExceededError");
   return native.call(this,key,value);
  });
  fireEvent.click(screen.getByRole("button",{name:"Save occasion costs"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save in this browser.");
  expect(read("familyPlans")[0]).toEqual(original);
  expect(read("money")).toBeNull();
 });
});
