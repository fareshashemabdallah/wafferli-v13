import {describe,expect,it} from "vitest";
import {homeSnapshot} from "./homeSnapshot";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "./money";
import type {FamilyMoment} from "./familyCalendar";
import type {FamilyTask} from "./familyTasks";
import type {FamilyPlan} from "./familyPlans";
import type {WishlistItem} from "./familyWishlist";

const now=new Date(2026,9,17,12);
const real:MoneyState={...sampleMoney(),demo:false,income:3200,
 categories:[
  {id:"rent",name:"Rent",type:"fixed",planned:1000},
  {id:"food",name:"Groceries",type:"variable",planned:400},
  {id:"school",name:"School",type:"periodic",planned:200}
 ],
 expenses:[{id:"e1",date:"2026-10-16",categoryId:"food",amount:72,shared:false,status:"paid"}],
 commitments:[{id:"electric",name:"Electricity",amount:48,frequency:"monthly",dueDate:"2026-10-19"}]
};
const members:Member[]=[...sampleMembers(),{
 id:"daughter",name:"Laila",role:"child",ageGroup:"3–5",prefs:"",birthday:"2021-10-20"
}];
const moments:FamilyMoment[]=[{id:"m",title:"Family event",date:"2026-10-21",kind:"activity",annual:false}];
const tasks:FamilyTask[]=[{
 id:"t",title:"Buy school supplies",dueDate:"2026-10-18",createdAt:"2026-10-10T12:00:00Z",
 updatedAt:"2026-10-10T12:00:00Z",priority:"normal",status:"open"
}];
const plans:FamilyPlan[]=[{
 id:"p",title:"Weekend outing",kind:"outing",status:"planning",date:"2026-10-23",
 createdAt:"2026-10-10T12:00:00Z",updatedAt:"2026-10-10T12:00:00Z"
}];
const wishlist:WishlistItem[]=[{
 id:"w",name:"Birthday gift for Laila",kind:"gift",status:"considering",
 createdAt:"2026-10-16T12:00:00Z",updatedAt:"2026-10-16T12:00:00Z",prices:[]
}];
const input=()=>({money:real,members,moments,plans,tasks,wishlist,
 basket:[{id:"a",name:"Milk",qty:1,price:2,done:false},
 {id:"sample",name:"Bread (sample)",qty:1,price:1,done:false}],now});
describe("illustrated homepage uses actual family data instead of mockup values",()=>{
 it("never displays demo household cash or sample people as real saved finances",()=>{
  const view=homeSnapshot({...input(),money:sampleMoney(),members:sampleMembers(),
   moments:[],tasks:[],plans:[],wishlist:[],basket:[]});
  expect(view.budget).toBeNull();
  expect(view.agenda).toHaveLength(0);
  expect(view.plans).toHaveLength(0);
  expect(view.shopping).toHaveLength(0);
 });
 it("retains fixed, variable and periodic expense categories with recorded figures",()=>{
  const view=homeSnapshot(input());
  expect(view.budget?.plannedJod).toBe(1600);
  expect(view.budget?.recordedJod).toBe(72);
  expect(view.budget?.groups.map(g=>g.plannedJod)).toEqual([1000,400,200,0]);
  expect(view.budget?.groups[1]?.lines[0]?.name).toBe("Groceries");
 });
 it("combines task, unpaid bill and personal occasions but never invents a payment",()=>{
  const view=homeSnapshot(input());
  expect(view.agenda.map(a=>a.title)).toEqual([
   "Buy school supplies","Electricity","Laila's birthday","Family event"
  ]);
  expect(view.agenda.find(a=>a.title==="Electricity")?.destination).toBe("/money");
  expect(view.plans.some(p=>p.title==="Weekend outing")).toBe(true);
  expect(view.plans.some(p=>p.title==="Laila's birthday")).toBe(true);
  const billConfirmed={...real,commitments:[{...real.commitments![0]!,paidDates:["2026-10-19"]}]};
  expect(homeSnapshot({...input(),money:billConfirmed}).agenda.some(a=>a.kind==="bill")).toBe(false);
 });
 it("keeps annual birthdays from a real family profile, not the sample child",()=>{
  const view=homeSnapshot(input());
  expect(view.plans.filter(p=>p.title.includes("birthday")).length).toBe(1);
  expect(view.plans.some(p=>p.title.includes("Child (sample)"))).toBe(false);
 });
 it("only shows actual shopping entries, excluding fake sample basket items",()=>{
  const view=homeSnapshot(input());
  expect(view.shopping.map(item=>item.title)).toEqual(["Milk","Birthday gift for Laila"]);
 });
 it("does not mutate any saved finance, task, plan, or family records",()=>{
  const inputData=input(),saved=JSON.stringify(inputData);
  homeSnapshot(inputData);
  expect(JSON.stringify(inputData)).toBe(saved);
 });
});
