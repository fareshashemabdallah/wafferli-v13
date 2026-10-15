import {emptyRealMoney} from "./moneyOverview";
import type {MoneyState} from "./money";

export type StarterBudgetInput={income:number;spending:number;savings:number};
const valid=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100000;
export function needsStarterBudget(s:MoneyState):boolean{
 return s.demo||(s.incomeSources===undefined||s.incomeSources.length===0)&&
   s.categories.length===0&&s.expenses.length===0&&(s.commitments??[]).length===0;
}
export function applyStarterBudget(s:MoneyState,input:StarterBudgetInput):MoneyState{
 if(!needsStarterBudget(s)||!valid(input.income)||input.income<=0||
   !valid(input.spending)||!valid(input.savings))return s;
 const base=s.demo?emptyRealMoney():s;
 // Old-style income is deliberate here: users have not supplied a pay date, so
 // monthly income is a planning estimate and not an expected bank deposit.
 const result:MoneyState={...base,demo:false,
  income:Math.round(input.income*100)/100,
  savingsTargetAmount:Math.round(input.savings*100)/100,
  categories:[{id:"household-starter",name:"Household spending (estimate)",type:"fixed",planned:Math.round(input.spending*100)/100}]
 };
 delete result.incomeSources;
 return result;
}
