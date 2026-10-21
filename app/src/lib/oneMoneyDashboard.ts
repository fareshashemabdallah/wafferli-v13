import {computeMoney,type MoneyState} from "./money";
import {roundJod,legacyIncome,scheduleDates,type IncomeSource} from "./cashflow";
import type {RhythmForecast} from "./familyMoneyRhythm";

/** Everything on the Money landing page is a read-only projection of the same
 * underlying Money records. No new amounts are written by this summary. */
export function oneMoneyDashboard(state:MoneyState,forecast:RhythmForecast,today:string){
 const year=Number(today.slice(0,4)),month=Number(today.slice(5,7));
 const now=new Date(year,month-1,Number(today.slice(8)),12);
 const c=computeMoney(state,now);
 const sources=state.incomeSources??legacyIncome(state.income);
 const incomeKnown=state.demo?false:state.incomeKnown===true||sources.length>0;
 const hasCategoryPlan=state.categories.length>0;
 const scheduledBills=state.commitments??[];
 const paid=state.expenses.filter(e=>e.date.startsWith(today.slice(0,7))&&e.status!=="planned");
 const pending=state.expenses.filter(e=>e.status==="planned");
 const nextIncome=forecast.events.filter(e=>e.kind==="income").sort((a,b)=>a.date.localeCompare(b.date))[0];
 const firstUpcoming=forecast.events.filter(e=>e.kind!=="pace").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
 const due=forecast.events.filter(e=>e.kind==="bill"||e.kind==="annual");
 const incomeReceivedThisMonth=sources.reduce((sum: number,s:IncomeSource)=>{
  return sum+(s.receivedDates??[]).reduce((t,date)=>t+(date.startsWith(today.slice(0,7))?
   (s.receivedAmounts?.[date]??s.amount):0),0);
 },0);
 const unlinkedCategories=state.categories.filter(cat=>cat.planned>0&&
  !scheduledBills.some(b=>b.categoryId===cat.id));
 const missingDates=forecast.missingDates;
 const inferredCash=false;
 return {
  monthKey:today.slice(0,7),incomeKnown,monthlyIncome:incomeKnown?c.monthlyIncome:null,
  receivedIncome:roundJod(incomeReceivedThisMonth),
  hasCategoryPlan,planned:hasCategoryPlan?c.planned:null,
  paid:roundJod(paid.reduce((sum,e)=>sum+e.amount,0)),
  numberPaid:paid.length,unpaidPlannedRecords:pending.length,
  billsDue:scheduledBills.length||due.length?roundJod(due.reduce((sum,e)=>sum-e.amountJod,0)):null,
  upcoming:firstUpcoming,nextIncome,
  openingCash:state.demo?null:state.cashOnHand??null,
  cashUpdatedAt:state.cashUpdatedAt??null,
  reserveJod:state.cashReserve??0,
  forecastMinimum:forecast.minimumCash,
  forecastEnd:forecast.cashEnd,
  reserveRiskDate:forecast.firstReserveRiskDate,
  missingDates,hasEstimatedCategoryCash:unlinkedCategories.length>0,
  autoEstimatedCategories:unlinkedCategories.length,
  incomeIsExpected:true,inferredCash,
  financialInputsPartial:state.financialInputsPartial===true
 };
}
