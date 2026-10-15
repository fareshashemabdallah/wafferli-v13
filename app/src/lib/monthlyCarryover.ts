import type {MoneyState,Expense} from "./money";
import {roundJod} from "./cashflow";

/**
 * Budget-only, one-month carryover: prior month's confirmed planned-vs-actual
 * differences not already reconciled by an approved in-month allocation.
 * Does NOT represent a cash transfer, an earned income, or savings deposited.
 * Computed from current expense records: no accumulating ledgers or duplicates.
 */
export type CarryoverEntry={id:string;title:string;planned:number;actual:number;change:number;categoryId:string};
export type MonthlyCarryover={month:string;from:string;credit:number;debit:number;net:number;entries:CarryoverEntry[]};

export function previousMonthKey(month:string):string {
 const match=/^(\d{4})-(\d{2})$/.exec(month);
 if(!match)return "";
 const year=Number(match[1]),m=Number(match[2]);
 if(m<1||m>12)return "";
 return [m===1?year-1:year,String(m===1?12:m-1).padStart(2,"0")].join("-");
}
export function nextMonthKey(month:string):string {
 const match=/^(\d{4})-(\d{2})$/.exec(month);
 if(!match)return "";
 const y=Number(match[1]),m=Number(match[2]);
 if(m<1||m>12)return "";
 return [m===12?y+1:y,String(m===12?1:m+1).padStart(2,"0")].join("-");
}
export function eligibleCarryover(expense:Expense):number {
 if(expense.status==="planned"||expense.allocation||
   typeof expense.plannedAmount!=="number"||!Number.isFinite(expense.plannedAmount)||
   expense.plannedAmount<0||!Number.isFinite(expense.amount)||expense.amount<0)return 0;
 return roundJod(expense.plannedAmount-expense.amount);
}
export function monthCarryover(state:MoneyState,month:string):MonthlyCarryover {
 const from=previousMonthKey(month);
 const entries:CarryoverEntry[]=from?state.expenses.filter(e=>e.date.slice(0,7)===from)
   .map(e=>({id:e.id,title:e.note??state.commitments?.find(b=>b.id===e.billId)?.name??
      state.categories.find(c=>c.id===e.categoryId)?.name??"Expense",
      planned:e.plannedAmount??0,actual:e.amount,change:eligibleCarryover(e),categoryId:e.categoryId}))
   .filter(e=>Math.abs(e.change)>=.005):[];
 const credit=roundJod(entries.reduce((n,e)=>n+Math.max(0,e.change),0));
 const debit=roundJod(entries.reduce((n,e)=>n+Math.max(0,-e.change),0));
 return {month,from,credit,debit,net:roundJod(credit-debit),entries};
}
