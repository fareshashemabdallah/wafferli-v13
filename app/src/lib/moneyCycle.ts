import type {MoneyState,Expense} from "./money";
import {roundJod} from "./cashflow";

/** A household reporting period is allowed to start on payday rather than on
 * the first calendar day. This changes read-only views, NEVER transaction dates,
 * bill due dates, cash balances, or the underlying expense ledger. */
export type MoneyCycle={
 start:string;end:string;endExclusive:string;key:string;day:number;
 source:"explicit"|"income-payday"|"calendar";
};
const dateOk=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&
 !Number.isNaN(Date.parse(date+"T12:00:00Z"))&&new Date(date+"T12:00:00Z").toISOString().slice(0,10)===date;
const pad=(n:number)=>String(n).padStart(2,"0");
const monthAt=(year:number,monthIndex:number)=>new Date(Date.UTC(year,monthIndex,1));
const iso=(d:Date)=>d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate());
/** Prefer a parent's explicit cycle day. Otherwise use the primary regular
 * monthly salary's expected date; do not infer an income receipt from it. */
export function moneyCycleBasis(state:MoneyState):{day:number;source:MoneyCycle["source"]}{
 const selected=state.cycleStartDay;
 if(Number.isInteger(selected)&&selected!>=1&&selected!<=28)
  return {day:selected!,source:"explicit"};
 const monthly=(state.incomeSources??[]).filter(i=>
  i.frequency==="monthly"&&dateOk(i.nextDate)&&Number(i.nextDate.slice(8))<=28&&
  Number.isFinite(i.amount)&&i.amount>=0);
 const salary=(s:string)=>/salary|wage|payroll|salaire|راتب|معاش/i.test(s);
 const primary=monthly.slice().sort((a,b)=>
  Number(salary(b.name))-Number(salary(a.name))||
  Number(!!a.variable)-Number(!!b.variable)||
  b.amount-a.amount||a.id.localeCompare(b.id))[0];
 return primary?{day:Number(primary.nextDate.slice(8)),source:"income-payday"}:
  {day:1,source:"calendar"};
}
function period(anchor:Date,basis:ReturnType<typeof moneyCycleBasis>):MoneyCycle{
 const start=monthAt(anchor.getUTCFullYear(),anchor.getUTCMonth());
 start.setUTCDate(basis.day);
 const next=monthAt(anchor.getUTCFullYear(),anchor.getUTCMonth()+1);
 next.setUTCDate(basis.day);
 const last=new Date(next.getTime()-86400000);
 const from=iso(start),end=iso(last);
 return {start:from,end,endExclusive:iso(next),key:from.slice(0,7),day:basis.day,source:basis.source};
}
export function moneyCycleFor(state:MoneyState,today:string):MoneyCycle{
 const basis=moneyCycleBasis(state);
 if(!dateOk(today))throw new Error("Invalid reporting date");
 const year=Number(today.slice(0,4)),month=Number(today.slice(5,7))-1;
 const anchor=monthAt(year,Number(today.slice(8))>=basis.day?month:month-1);
 return period(anchor,basis);
}
/** Reports select the cycle by the month in which it begins. */
export function moneyCycleForMonth(state:MoneyState,month:string):MoneyCycle{
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error("Invalid report month");
 const [year,number]=month.split("-").map(Number);
 return period(monthAt(year!,number!-1),moneyCycleBasis(state));
}
export const inMoneyCycle=(date:string,cycle:MoneyCycle)=>
 date>=cycle.start&&date<cycle.endExclusive;
export function paidInMoneyCycle(state:MoneyState,cycle:MoneyCycle):Expense[]{
 return state.expenses.filter(e=>e.status!=="planned"&&inMoneyCycle(e.date,cycle));
}
export function cyclePaidTotal(state:MoneyState,cycle:MoneyCycle,categoryId?:string):number{
 return roundJod(paidInMoneyCycle(state,cycle).filter(e=>categoryId===undefined||e.categoryId===categoryId)
  .reduce((a,e)=>a+e.amount,0));
}
