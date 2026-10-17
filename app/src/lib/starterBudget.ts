import {emptyRealMoney} from "./moneyOverview";
import {computeMoney,type MoneyState} from "./money";

export type StarterBudgetInput={income:number;spending:number;savings:number;/** Optional newly reviewed breakdown; legacy three-number entry remains valid. */ essential?:number;other?:number;approximateIncome?:boolean;zeroIncomeConfirmed?:boolean};
const valid=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100000;
const near=(a:number,b:number)=>Math.abs(a-b)<.01;
/** True when an example or incomplete monthly budget prevents plan comparisons.
 * It can be incomplete even when real bills, actual cash and expenses exist. */
export function needsStarterBudget(s:MoneyState):boolean{
 const m=computeMoney(s);
 return s.demo||(m.monthlyIncome<=0&&!s.incomeKnown)||s.categories.length===0;
}
export function applyStarterBudget(s:MoneyState,input:StarterBudgetInput):MoneyState{
 if(!needsStarterBudget(s)||!valid(input.income)||input.income===0&&!input.zeroIncomeConfirmed||
   !valid(input.spending)||!valid(input.savings))return s;
 const separated=input.essential!==undefined||input.other!==undefined;
 if(separated&&(!valid(input.essential??NaN)||!valid(input.other??NaN)||
   Math.abs((input.essential??0)+(input.other??0)-input.spending)>.005))return s;
 const base=s.demo?emptyRealMoney():s;
 const previous=computeMoney(base);
 // Preserve all existing real income sources, spending envelopes, unpaid bills,
 // actual expenses, bank cash and reserve. Prefilled/disabled figures cannot
 // silently rewrite an existing income schedule or planned categories.
 const hasSources=!!base.incomeSources?.length;
 const hasCategories=base.categories.length>0;
 if(hasSources&&!near(previous.monthlyIncome,input.income)||
   hasCategories&&!near(previous.planned,input.spending))return s;
 const result:MoneyState={...base,demo:false,
  ...(hasSources?{}:{income:Math.round(input.income*100)/100}),
  incomeKnown:!hasSources,incomeConfidence:hasSources?base.incomeConfidence:(input.approximateIncome===false?"confirmed":"estimate"),
  savingsTargetAmount:Math.round(input.savings*100)/100,
  ...(hasCategories?{}:{categories:separated?[
   {id:"household-essential",name:"Essential household costs (estimate)",type:"fixed" as const,planned:Math.round(input.essential!*100)/100,priority:"essential" as const,amountConfidence:"estimate" as const},
   {id:"household-flexible",name:"Other household spending (estimate)",type:"variable" as const,planned:Math.round(input.other!*100)/100,priority:"flexible" as const,amountConfidence:"estimate" as const}
  ]:[{id:"household-starter",name:"Household spending (estimate)",type:"fixed" as const,planned:Math.round(input.spending*100)/100}]})
 };
 // No pay-date was entered, so use monthly income for planning only, never
 // fabricate a future bank credit or a dated income schedule.
 if(!hasSources)delete result.incomeSources;
 return result;
}
