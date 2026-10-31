import {describe,expect,it} from "vitest";
import {buildSpendingDiscoveries,discoveryTargetValid} from "./spendingDiscoveries";
import {sampleMoney,type Expense,type MoneyState} from "./money";
const expense=(id:string,date:string,amount:number,categoryId:string,extra:Partial<Expense>={}):Expense=>
 ({id,date,amount,categoryId,shared:false,status:"paid",...extra});
const state=():MoneyState=>({...sampleMoney(),demo:false,expenses:[],
 categories:[
  {id:"restaurant",name:"Restaurants",type:"variable",planned:300},
  {id:"rent",name:"Rent",type:"fixed",planned:500},
  {id:"school",name:"School Tuition",type:"periodic",planned:800},
  {id:"insurance",name:"Parents insurance",type:"fixed",planned:600},
  {id:"groceries",name:"Groceries",type:"variable",planned:400,priority:"essential"},
  {id:"travel",name:"Travel ticket",type:"periodic",planned:600},
 ]});
const month="2026-10";
describe("Spending discoveries focus on behaviour, not big bills",()=>{
 it("never treats demonstration records as a real discovery",()=>{
  expect(buildSpendingDiscoveries(sampleMoney(),month).visible).toEqual([]);
 });
 it("does not call the screenshot's tuition, insurance, groceries or travel ticket a savings discovery",()=>{
  const s=state();
  s.expenses=[
   expense("tuition","2026-10-02",800,"school"),
   expense("insurance","2026-10-03",620,"insurance"),
   expense("groceries","2026-10-04",400,"groceries"),
   expense("ticket","2026-10-05",900,"travel")];
  const view=buildSpendingDiscoveries(s,month);
  expect(view.paidCount).toBe(4);
  expect(view.totalRecordedJod).toBe(2720);
  expect(view.visible).toEqual([]);
 });
 it("finds eight delivery orders and counts each transaction only once",()=>{
  const s=state();
  s.expenses=[
   ...Array.from({length:8},(_,i)=>expense("del-"+i,"2026-10-"+String(i+1).padStart(2,"0"),12,"restaurant",
    i%2?{purpose:"food-delivery"}:{note:"Food delivery"})),
   expense("sit-down","2026-10-20",40,"restaurant"),
   expense("tuition","2026-10-21",800,"school")];
  const before=JSON.stringify(s);
  const view=buildSpendingDiscoveries(s,month);
  expect(view.totalRecordedJod).toBe(936);
  expect(view.paidCount).toBe(10);
  expect(view.visible[0]).toMatchObject({
   key:"food-delivery",kind:"food-delivery",signal:"repeated",
   count:8,amountJod:96,averageJod:12,twoFewerJod:24
  });
  expect(view.visible.some(g=>g.key==="category:school")).toBe(false);
  expect(JSON.stringify(s)).toBe(before);
 });
 it("makes no discovery from a one-off discretionary purchase or two small orders",()=>{
  const s=state();
  s.expenses=[expense("a","2026-10-01",400,"restaurant"),
   expense("b","2026-10-02",8,"restaurant",{purpose:"food-delivery"}),
   expense("c","2026-10-04",10,"restaurant",{purpose:"food-delivery"})];
  expect(buildSpendingDiscoveries(s,month).visible).toEqual([]);
 });
 it("detects repeated restaurant purchases and a supported rise versus the prior month",()=>{
  const s=state();
  s.expenses=[expense("a","2026-09-01",20,"restaurant"),expense("b","2026-09-10",20,"restaurant"),
   expense("c","2026-10-01",40,"restaurant"),expense("d","2026-10-05",40,"restaurant"),
   expense("e","2026-10-10",40,"restaurant")];
  expect(buildSpendingDiscoveries(s,month).visible[0]).toMatchObject({
   signal:"increase",previousMonthJod:40,previousCount:2,increaseJod:80,amountJod:120,count:3
  });
  s.expenses=s.expenses.filter(x=>x.id!=="b");
  expect(buildSpendingDiscoveries(s,month).visible).toEqual([]);
  s.expenses=[1,2,3,4].map(i=>expense(String(i),"2026-10-0"+i,15,"restaurant"));
  expect(buildSpendingDiscoveries(s,month).visible[0]).toMatchObject({signal:"repeated",count:4,amountJod:60});
 });
 it("respects explicit protected priorities and excluded paid bills",()=>{
  const s=state();
  s.categories[0]={...s.categories[0]!,priority:"protected"};
  s.expenses=Array.from({length:8},(_,i)=>expense("del-"+i,"2026-10-"+String(i+1).padStart(2,"0"),12,"restaurant",{purpose:"food-delivery"}));
  expect(buildSpendingDiscoveries(s,month).visible).toEqual([]);
  s.categories[0]={...s.categories[0]!,priority:"flexible"};
  s.expenses=s.expenses.map(x=>({...x,billId:"bill123"}));
  expect(buildSpendingDiscoveries(s,month).visible).toEqual([]);
 });
 it("keeps previously set optional targets without changing the expense ledger",()=>{
  const s=state();
  s.spendingDiscoveryTargets={"category:restaurant":75,"category:school":500};
  s.expenses=[expense("a","2026-10-03",20,"restaurant"),
   expense("b","2026-10-04",800,"school"),
   expense("c","2026-10-05",10,"uncategorized"),
   expense("d","2026-10-09",200,"restaurant",{status:"planned"})];
  const before=JSON.stringify(s);
  const view=buildSpendingDiscoveries(s,month);
  expect(view.totalRecordedJod).toBe(830);
  expect(view.visible).toMatchObject([{key:"category:restaurant",signal:"target",targetJod:75}]);
  expect(JSON.stringify(s)).toBe(before);
 });
 it("rejects invalid months and unrealistic targets",()=>{
  expect(buildSpendingDiscoveries(state(),"2026-13").visible).toEqual([]);
  expect(discoveryTargetValid(72)).toBe(true);
  expect(discoveryTargetValid(0)).toBe(true);
  expect(discoveryTargetValid(-1)).toBe(false);
  expect(discoveryTargetValid(1.001)).toBe(false);
  expect(discoveryTargetValid(Number.NaN)).toBe(false);
 });
});