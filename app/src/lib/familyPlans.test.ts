import {describe,it,expect} from "vitest";
import {makeFamilyPlan,markPlanComplete,moneyAmount,reviewPlanCost,setPlanChoice,upcomingFamilyPlans} from "./familyPlans";
import type {MoneyState} from "./money";
const now=new Date(2026,9,15,12);
const sample=()=>makeFamilyPlan({id:"p-1",title:"New refrigerator",kind:"purchase",date:"2026-10-25",budgetJod:500},now)!;
const finances=():MoneyState=>({
 demo:false,income:1500,savingsPct:10,categories:[{id:"home",name:"Home",type:"variable",planned:500}],
 expenses:[],cashOnHand:850,cashReserve:100,commitments:[
 {id:"rent",name:"Rent",frequency:"once",amount:350,dueDate:"2026-10-20",categoryId:"home"}],
 incomeSources:[]
});
describe("one shared family Plan journey",()=>{
 it("creates a validated Plan without mutating any financial record",()=>{
  const p=sample();
  expect(p).toMatchObject({kind:"purchase",status:"planning",budgetJod:500,date:"2026-10-25"});
  expect(moneyAmount("180.456")).toBe(180.46);
  expect(moneyAmount("-30")).toBeNull();
  expect(moneyAmount("")).toBeNull();
  expect(makeFamilyPlan({id:"",title:"Invalid",kind:"purchase"})).toBeNull();
  expect(makeFamilyPlan({id:"x",title:" ",kind:"purchase"})).toBeNull();
  expect(makeFamilyPlan({id:"x",title:"Valid",kind:"purchase",budgetJod:-1})).toBeNull();
  expect(makeFamilyPlan({id:"x",title:"Valid",kind:"purchase",date:"invalid"})).toBeNull();
 });
 it("can move from planning to a compared choice to a completed actual outcome",()=>{
  const first=sample();
  const chosen=setPlanChoice(first,{label:"Shop A",estimatedJod:480,source:"comparison",verified:false},now);
  expect(chosen).toMatchObject({status:"decided",choice:{label:"Shop A",estimatedJod:480}});
  expect(first.status).toBe("planning");
  const completed=markPlanComplete(chosen,465,now);
  expect(completed).toMatchObject({status:"completed",actualJod:465});
  expect(markPlanComplete(completed,100,now)).toBe(completed);
  expect(markPlanComplete(chosen,-1,now)).toBe(chosen);
 });
 it("does not call incomplete data financially affordable",()=>{
  const p=sample();
  expect(reviewPlanCost(p,{...finances(),demo:true},now).status).toBe("demo");
  expect(reviewPlanCost(p,{...finances(),cashOnHand:null},now).status).toBe("unknown");
  expect(reviewPlanCost(p,{...finances(),commitments:[]},now).status).toBe("unknown");
  expect(reviewPlanCost(p,{...finances(),cashOnHand:400},now).status).toBe("review");
  expect(reviewPlanCost(p,{...finances(),cashOnHand:1100},now).status).toBe("provisional");
 });
 it("sorts upcoming plans and excludes completed ones",()=>{
  const a=sample(),b=makeFamilyPlan({id:"p2",title:"Friday outing",kind:"outing",date:"2026-10-16"},now)!;
  const done=markPlanComplete(makeFamilyPlan({id:"p3",title:"Done",kind:"occasion"},now)!,0,now);
  expect(upcomingFamilyPlans([a,done,b],now).map(p=>p.id)).toEqual(["p2","p-1"]);
 });
});
