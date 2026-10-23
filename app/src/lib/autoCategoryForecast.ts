import type {MoneyState} from "./money";
import {futureDate,roundJod,scheduleDates,type Commitment} from "./cashflow";
import {effectiveCategoryAllowance} from "./monthAwareMoney";
import type {RhythmEvent} from "./familyMoneyRhythm";

/** Read-only estimated future category envelopes. No real purchase or bill is created. */
export function autoCategoryForecast(state:MoneyState,today:string,end:string,excludedIds:ReadonlySet<string>,commitments:readonly Commitment[]=state.commitments??[]){
 const items:Omit<RhythmEvent,"projectedBalance">[]=[];
 const monthKey=(s:string)=>s.slice(0,7);
 let cursor=monthKey(today)+"-01";
 while(monthKey(cursor)<=monthKey(end)){
  const [year,month]=cursor.split("-").map(Number);
  const lastDay=new Date(year!,month!,0).getDate();
  const last=monthKey(cursor)+"-"+String(lastDay).padStart(2,"0");
  const first=monthKey(cursor)===monthKey(today)?today:cursor;
  for(const cat of state.categories){
   if(excludedIds.has(cat.id)||!Number.isFinite(cat.planned)||cat.planned<=0)continue;
   const paid=monthKey(cursor)===monthKey(today)?state.expenses
    .filter(e=>e.status!=="planned"&&e.categoryId===cat.id&&monthKey(e.date)===monthKey(cursor))
    .reduce((total,e)=>total+e.amount,0):0;
   // A dated bill replaces only the corresponding portion of a category
   // envelope, not all other groceries, fuel or other variable spending.
   // Gross dated costs are already covered by the one original allowance.
   // Payments in this same month are already deducted above, so subtract
   // only the yet-unrecorded part of each dated cost to avoid subtracting twice.
   const coveredByBills=commitments.filter(c=>c.categoryId===cat.id)
    .flatMap(c=>scheduleDates(c.dueDate,c.frequency,cursor,last,c.endDate).map(date=>({c,date})))
    .reduce((total,{c,date})=>{
     const paidHere=state.expenses.filter(e=>e.status!=="planned"&&e.billId===c.id&&
      e.dueDate===date&&monthKey(e.date)===monthKey(cursor))
      .reduce((sum,e)=>sum+e.amount,0);
     return total+Math.max(0,c.amount-paidHere);
    },0);
   const remaining=Math.max(0,roundJod(effectiveCategoryAllowance(state,cat.id,monthKey(cursor))-paid-coveredByBills));
   if(!remaining)continue;
   const dates:string[]=[];
   for(let step=7;step<=35;step+=7){
    const d=futureDate(first,step);
    if(d>=last)break;
    dates.push(d);
   }
   dates.push(last);
   const weekly=roundJod(remaining/dates.length);
   dates.forEach((date,index)=>{
    const amount=index===dates.length-1?roundJod(remaining-weekly*(dates.length-1)):weekly;
    if(date<=end&&amount>0)items.push({id:"envelope:"+cat.id+":"+date,
     date,label:cat.name,kind:"pace",amountJod:-amount,categoryId:cat.id});
   });
  }
  const next=new Date(year!,month!,1,12);
  cursor=next.getFullYear()+"-"+String(next.getMonth()+1).padStart(2,"0")+"-01";
 }
 return items;
}
