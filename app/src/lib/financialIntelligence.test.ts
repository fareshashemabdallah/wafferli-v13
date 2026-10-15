import {describe,expect,it} from "vitest";
import {spendingHistory,detectSpendingChanges,forecastBudgetScenarios} from "./financialIntelligence";
import {sampleMoney,type MoneyState} from "./money";
const now=new Date(2026,9,15,12);
const real=():MoneyState=>({...sampleMoney(),demo:false,income:2000,savingsTargetAmount:200,
 categories:[{id:"food",name:"Food",type:"variable",planned:500}],expenses:[]});
const expense=(id:string,date:string,amount:number,status:"planned"|"paid"="paid")=>({id,date,amount,status,categoryId:"food",shared:true});
describe("financial intelligence",()=>{
 it("makes no real-family spending flags from sample figures",()=>{
  expect(detectSpendingChanges(sampleMoney(),now)).toEqual([]);
  expect(forecastBudgetScenarios(sampleMoney(),{months:6,onceOffJod:100,
   onceOffMonth:1,monthlyExtraJod:0,monthlyIncomeChangeJod:0},now).ready).toBe(false);
 });
 it("shows recorded paid months and excludes future planned charges",()=>{
  const money={...real(),expenses:[expense("a","2026-09-05",80),
   expense("b","2026-10-03",50),expense("c","2026-10-20",250,"planned")]};
  const rows=spendingHistory(money,now,2);
  expect(rows.map(r=>r.spentJod)).toEqual([80,50]);
  expect(rows.map(r=>r.transactionCount)).toEqual([1,1]);
 });
 it("requires two independently recorded baseline months before suggesting review",()=>{
  const money={...real(),expenses:[expense("a","2026-08-05",50),
   expense("b","2026-09-05",60),expense("c","2026-10-05",180)]};
  const flags=detectSpendingChanges(money,now);
  expect(flags).toHaveLength(1);
  expect(flags[0]?.categoryName).toBe("Food");
  expect(flags[0]?.priorAverageJod).toBe(55);
  expect(flags[0]?.monthJod).toBe(180);
  expect(detectSpendingChanges({...money,expenses:money.expenses.filter(e=>!e.date.startsWith("2026-08"))},now)).toEqual([]);
 });
 it("models 3/6/12 month budget envelopes without editing the ledger",()=>{
  const money=real(),before=JSON.stringify(money);
  const scenario=forecastBudgetScenarios(money,{months:3,onceOffJod:300,
   onceOffMonth:2,monthlyExtraJod:50,monthlyIncomeChangeJod:-200},now);
  expect(scenario.ready).toBe(true);
  expect(scenario.rows).toHaveLength(3);
  expect(scenario.rows[0]?.netJod).toBe(1050);
  expect(scenario.rows[1]?.netJod).toBe(750);
  expect(scenario.totalNetJod).toBe(2850);
  expect(JSON.stringify(money)).toBe(before);
 });
 it("flags deficient scenarios and negative budget months without calling them bank balances",()=>{
  const scenario=forecastBudgetScenarios(real(),{months:12,onceOffJod:9000,
   onceOffMonth:1,monthlyExtraJod:150,monthlyIncomeChangeJod:-900},now);
  expect(scenario.ready).toBe(true);
  expect(scenario.negativeMonths).toBeGreaterThan(0);
  expect(scenario.explanation).toContain("not a bank balance");
  expect(forecastBudgetScenarios(real(),{months:6,onceOffJod:-1,
   onceOffMonth:1,monthlyExtraJod:0,monthlyIncomeChangeJod:0},now).ready).toBe(false);
 });
});
