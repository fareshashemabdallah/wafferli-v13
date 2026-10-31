import {describe,expect,it} from "vitest";
import {buildSpendingDiscoveries,discoveryTargetValid} from "./spendingDiscoveries";
import {sampleMoney,type Expense,type MoneyState} from "./money";
const expense=(id:string,date:string,amount:number,categoryId:string,extra:Partial<Expense>={}):Expense=>
 ({id,date,amount,categoryId,shared:false,status:"paid",...extra});
const state=():MoneyState=>({...sampleMoney(),demo:false,expenses:[],
 categories:[{id:"restaurant",name:"Restaurants",type:"variable",planned:300},
 {id:"rent",name:"Rent",type:"fixed",planned:500}]});
describe("spending discoveries",()=>{
 it("never presents demo figures as personal discoveries",()=>{
  const result=buildSpendingDiscoveries(sampleMoney(),"2026-10");
  expect(result.visible).toEqual([]);
 });
 it("splits explicit food delivery from the restaurant category without double counting",()=>{
  const s=state();
  s.expenses=[expense("a","2026-10-01",12,"restaurant",{purpose:"food-delivery"}),
   expense("b","2026-10-05",8,"restaurant",{note:"Food delivery"}),
   expense("c","2026-10-09",25,"restaurant"),expense("d","2026-10-12",500,"rent")];
  s.spendingDiscoveryTargets={"food-delivery":18};
  const before=JSON.stringify(s);
  const result=buildSpendingDiscoveries(s,"2026-10");
  expect(result.totalRecordedJod).toBe(545);
  expect(result.paidCount).toBe(4);
  expect(result.visible.find(g=>g.key==="food-delivery")).toMatchObject({count:2,amountJod:20,targetJod:18});
  expect(result.visible.find(g=>g.key==="category:restaurant")?.amountJod).toBe(25);
  expect(result.visible.reduce((n,g)=>n+g.amountJod,0)).toBe(545);
  expect(JSON.stringify(s)).toBe(before);
 });
 it("ignores planned expenses, handles a prior month without inventing missing comparisons",()=>{
  const s=state();
  s.expenses=[expense("old","2026-09-10",60,"restaurant"),
   expense("now","2026-10-10",30,"restaurant"),
   expense("plan","2026-10-11",100,"restaurant",{status:"planned"}),
   expense("invalid","2026-10-12",Number.NaN,"restaurant")];
  const result=buildSpendingDiscoveries(s,"2026-10");
  expect(result.visible[0]).toMatchObject({amountJod:30,count:1,previousMonthJod:60,previousCount:1});
  expect(result.paidCount).toBe(1);
  s.expenses=s.expenses.filter(e=>e.id!=="old");
  expect(buildSpendingDiscoveries(s,"2026-10").visible[0]?.previousMonthJod).toBeNull();
 });
 it("recognizes explicit delivery budget items, keeps uncategorized expenses visible",()=>{
  const s=state();
  s.budgetItems=[{id:"delivery",categoryId:"restaurant",name:"Food delivery",amountJod:100,frequency:"monthly",enabled:true,behaviour:"variable",priority:"flexible"}];
  s.expenses=[expense("a","2026-10-01",15,"restaurant",{budgetItemId:"delivery"}),
   expense("b","2026-10-02",7,"uncategorized")];
  const v=buildSpendingDiscoveries(s,"2026-10");
  expect(v.visible.some(g=>g.key==="food-delivery"&&g.amountJod===15)).toBe(true);
  expect(v.visible.some(g=>g.label==="Uncategorized"&&g.amountJod===7)).toBe(true);
 });
 it("validates month and target amounts without turning targets into budget records",()=>{
  const s=state();
  expect(buildSpendingDiscoveries(s,"2026-13").visible).toEqual([]);
  expect(discoveryTargetValid(72)).toBe(true);
  expect(discoveryTargetValid(0)).toBe(true);
  expect(discoveryTargetValid(-1)).toBe(false);
  expect(discoveryTargetValid(1.001)).toBe(false);
  expect(discoveryTargetValid(Number.NaN)).toBe(false);
 });
});
