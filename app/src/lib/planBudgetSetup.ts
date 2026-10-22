import type {MoneyState} from "./money";
import {monthlyTotal} from "./cashflow";
export const PLAN_MONEY_FOCUS_KEY="dabberna:plan-money-focus";
export type PlanSetupStep="demo"|"income"|"categories"|"review";
/** Required to interpret the monthly plan; savings and bank cash are optional.
 * Missing payday only limits dated cash-flow estimates, not monthly income. */
export function hasEnteredMonthlyIncome(money:MoneyState):boolean{
 return !money.demo&&(money.incomeKnown===true||
  (money.incomeSources?.length??0)>0||Number.isFinite(money.income)&&money.income>0);
}
export function planBudgetSetupSteps(money:MoneyState):PlanSetupStep[]{
 if(money.demo)return ["demo"];
 const steps:PlanSetupStep[]=[];
 if(!hasEnteredMonthlyIncome(money))steps.push("income");
 if(money.categories.length===0)steps.push("categories");
 if(money.financialInputsPartial===true&&money.categories.length>0)
  steps.push("review");
 return steps;
}
export function monthlyPlanReady(money:MoneyState):boolean{
 return planBudgetSetupSteps(money).length===0;
}
export function monthlyIncomeValue(money:MoneyState):number|null{
 if(!hasEnteredMonthlyIncome(money))return null;
 return money.incomeSources===undefined?money.income:monthlyTotal(money.incomeSources);
}
