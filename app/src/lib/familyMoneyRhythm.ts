import {buildForecast,futureDate,legacyIncome,roundJod,scheduleDates} from "./cashflow";
import type {MoneyState,Category} from "./money";
import type {FamilyPlan} from "./familyPlans";
import {familyForecastCommitments} from "./familyFinancialCommitments";
import {parseCalendarDate} from "./familyCalendar";

/** Optional, local-only frequency for an existing monthly category allocation.
 * It is NOT an expense, a bill, a bank withdrawal, or another monthly budget.
 * The category ID refers to the same canonical category used by actual expenses.
 */
export type SpendingPace={categoryId:string;intervalDays:7|10|14|15|30;nextDate:string};
export type RhythmEvent={
 id:string;date:string;label:string;amountJod:number;
 kind:"income"|"bill"|"annual"|"pace";projectedBalance:number|null;
 overdue?:boolean;incomeExpected?:boolean;categoryId?:string;
};
export type RhythmForecast={
 events:RhythmEvent[];cashStart:number|null;cashEnd:number|null;minimumCash:number|null;
 reserveJod:number;firstReserveRiskDate:string|null;unverifiedIncomeJod:number;
 missingDates:number;unknownCash:boolean;excludedPaces:string[];
 monthlyPaceJod:number;futureBillsJod:number;futureIncomeJod:number;
};
const money=(n:number)=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
const ym=(d:string)=>d.slice(0,7);
const lastDay=(d:string)=>new Date(Number(d.slice(0,4)),Number(d.slice(5,7)),0).getDate();
const dayCount=(d:string)=>lastDay(d);
const max=(a:number,b:number)=>Math.max(a,b);
export function paceAllowed(category:Category|undefined,commitments:readonly {categoryId?:string}[]):boolean{
 return !!category&&money(category.planned)&&category.planned>0&&
  !commitments.some(b=>b.categoryId===category.id);
}
export function upsertSpendingPace(state:MoneyState,value:SpendingPace):MoneyState|null{
 if(state.demo||!state.categories.some(c=>paceAllowed(c,state.commitments??[])&&c.id===value.categoryId)||
  ![7,10,14,15,30].includes(value.intervalDays)||!parseCalendarDate(value.nextDate))return null;
 const previous=state.spendingPaces??[];
 return {...state,spendingPaces:[
  ...previous.filter(x=>x.categoryId!==value.categoryId),value
 ]};
}
export function removeSpendingPace(state:MoneyState,categoryId:string):MoneyState{
 return {...state,spendingPaces:(state.spendingPaces??[]).filter(p=>p.categoryId!==categoryId)};
}
/** Upcoming category envelope after actual payments in the *current* month.
 * The remaining amount is distributed across future intervals, not duplicated
 * with real expenses. Later months use the canonical monthly allocation.
 * No future forecast amount is automatically recorded as paid.
 */
function predictedCategoryEvents(state:MoneyState,pace:SpendingPace,today:string,end:string){
 const cat=state.categories.find(c=>c.id===pace.categoryId);
 if(!paceAllowed(cat,state.commitments??[])||!cat)return [];
 const events:Omit<RhythmEvent,"projectedBalance">[]=[];
 const todayMonth=ym(today);
 let anchor=pace.nextDate;
 // Only future dates; a selected interval is a planning pattern, not an obligation.
 if(anchor<today){
  const elapsed=Math.floor((new Date(today+"T12:00:00").getTime()-new Date(anchor+"T12:00:00").getTime())/86400000);
  anchor=futureDate(anchor,(Math.floor(elapsed/pace.intervalDays)+1)*pace.intervalDays);
 }
 const dates:string[]=[];
 for(let i=0;i<100;i++){
  const d=futureDate(anchor,i*pace.intervalDays);
  if(d>end)break;
  if(d>=today)dates.push(d);
 }
 const monthlyGroups=new Map<string,string[]>();
 for(const d of dates)monthlyGroups.set(ym(d),[...(monthlyGroups.get(ym(d))??[]),d]);
 for(const [month,arr] of monthlyGroups){
  const spent=month===todayMonth?state.expenses.filter(e=>e.status!=="planned"&&e.categoryId===cat.id&&ym(e.date)===month)
   .reduce((a,e)=>a+e.amount,0):0;
  // Partial month: don't assert the entire month's missing allocation as due.
  // Each future cadence gets a reasonable share of that month's estimated total.
  const remaining=max(0,cat.planned-spent);
  const from=month===todayMonth?today:month+"-01";
  const daysLeft=dayCount(from)-Number(from.slice(8))+1;
  const target=max(0,Math.min(remaining,roundJod(cat.planned*daysLeft/dayCount(from))));
  const per=roundJod(target/arr.length);
  arr.forEach((d,i)=>{
   const amount=i===arr.length-1?roundJod(target-per*(arr.length-1)):per;
   if(amount<=0)return;
   events.push({id:"pace:"+cat.id+":"+d,date:d,label:cat.name,
    amountJod:-amount,kind:"pace",categoryId:cat.id});
  });
 }
 return events;
}
/** Forecast from the exact saved Money records. Expected income is always
 * visibly conditional. Starting cash is parent-entered and may be stale.
 */
export function buildFamilyMoneyRhythm(state:MoneyState,plans:readonly FamilyPlan[]=[],today:string,days:7|30|90=30,
 includeExpected=true):RhythmForecast{
 const end=futureDate(today,days);
 const incomes=state.incomeSources??legacyIncome(state.income);
 const commitments=[...(state.commitments??[]),...familyForecastCommitments(plans,state)];
 const base=buildForecast({incomes:includeExpected?incomes:[],commitments,
  openingBalance:state.cashOnHand??null,reserve:state.cashReserve??0,today,days});
 const annualIds=new Set(commitments.filter(c=>c.frequency==="yearly").map(c=>c.id));
 let events:Omit<RhythmEvent,"projectedBalance">[]=base.events.map(e=>({
  id:e.key,date:e.date,label:e.name,amountJod:e.kind==="income"?e.amount:-e.amount,
  kind:e.kind==="income"?"income":annualIds.has(e.sourceId)?"annual":"bill",
  ...(e.kind==="income"?{incomeExpected:true}:{}),
  ...(e.overdue?{overdue:true}:{})
 }));
 const excludedPaces:string[]=[];
 for(const pace of state.spendingPaces??[]){
  const cat=state.categories.find(c=>c.id===pace.categoryId);
  if(!paceAllowed(cat,commitments)||!parseCalendarDate(pace.nextDate)||![7,10,14,15,30].includes(pace.intervalDays)){
   excludedPaces.push(pace.categoryId);continue;
  }
  events.push(...predictedCategoryEvents({...state,commitments},pace,today,end));
 }
 // Opening cash is current as of the selected start date, so never subtract
 // historic paid expenses again. No automatic receipts/debits take place.
 events=events.sort((a,b)=>a.date.localeCompare(b.date)||
  (a.amountJod<0?-1:1)-(b.amountJod<0?-1:1)||a.id.localeCompare(b.id));
 const cashStart=!state.demo&&money(state.cashOnHand)?state.cashOnHand!:null;
 let running=cashStart,minimumCash=cashStart,firstRisk:string|null=null;
 const reserveJod=money(state.cashReserve)?state.cashReserve!:0;
 if(running!==null&&running<reserveJod)firstRisk=today;
 const finalEvents:RhythmEvent[]=events.map(e=>{
  if(running!==null){running=roundJod(running+e.amountJod);
   minimumCash=minimumCash===null?running:Math.min(minimumCash,running);
   if(firstRisk===null&&running<reserveJod)firstRisk=e.date;
  }
  return {...e,projectedBalance:running};
 });
 // Missing dates include legacy monthly income with no actual payday.
 const missingDates=base.missingDates+(!includeExpected?
  incomes.filter(i=>!parseCalendarDate(i.nextDate)).length:0);
 return {events:finalEvents,cashStart,cashEnd:running,minimumCash,
  reserveJod,firstReserveRiskDate:firstRisk,
  missingDates,unknownCash:cashStart===null,
  excludedPaces,
  unverifiedIncomeJod:roundJod(events.filter(e=>e.kind==="income").reduce((a,e)=>a+e.amountJod,0)),
  monthlyPaceJod:roundJod((state.spendingPaces??[]).filter(p=>!excludedPaces.includes(p.categoryId))
   .reduce((a,p)=>a+(state.categories.find(c=>c.id===p.categoryId)?.planned??0),0)),
  futureBillsJod:roundJod(events.filter(e=>e.kind==="bill"||e.kind==="annual").reduce((a,e)=>a-e.amountJod,0)),
  futureIncomeJod:roundJod(events.filter(e=>e.kind==="income").reduce((a,e)=>a+e.amountJod,0))};
}
/** Preparation recommendations only, never actual cash reserved or debited. */
export function annualPreparation(state:MoneyState,today:string,limitDays=365){
 const incomes=state.incomeSources??legacyIncome(state.income);
 const end=futureDate(today,limitDays);
 return (state.commitments??[]).filter(c=>c.frequency==="yearly"&&parseCalendarDate(c.dueDate))
  .map(c=>{
   const due=scheduleDates(c.dueDate,c.frequency,today,end,c.endDate)[0];
   if(!due)return null;
   // Deduplicate dates by source and day, never count a one-time expected
   // income as recurring salary across all years.
   const paydays=new Set(incomes.flatMap(i=>scheduleDates(i.nextDate,i.frequency,today,due,i.endDate))
    .filter(d=>d<due));
   return {id:c.id,name:c.name,dueDate:due,amountJod:c.amount,
    paydays:paydays.size,
    perPaydayJod:paydays.size?roundJod(c.amount/paydays.size):null};
  }).filter((x):x is NonNullable<typeof x>=>x!==null);
}
