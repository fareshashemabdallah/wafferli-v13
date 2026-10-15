import {computeMoney,type MoneyState} from "./money";
import {dateKey} from "./familyCalendar";
export type MonthlyHistory={month:string;spentJod:number;transactionCount:number;plannedJod:number;incomePlanJod:number;demo:boolean};
export type SpendingFlag={categoryId:string;categoryName:string;monthJod:number;priorAverageJod:number;ratio:number;reason:string};
const round=(n:number)=>Math.round(n*100)/100;
const valid=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1e9;
export const monthKey=(date:Date)=>dateKey(date).slice(0,7);
const atMonth=(date:Date,offset:number)=>new Date(date.getFullYear(),date.getMonth()+offset,15,12);
export function spendingHistory(money:MoneyState,now=new Date(),months=6):MonthlyHistory[]{
 if(!Number.isSafeInteger(months)||months<1||months>24)throw new Error("Invalid history horizon");
 return Array.from({length:months},(_,i)=>{
  const monthDate=atMonth(now,i-months+1),month=monthKey(monthDate);
  const paid=money.expenses.filter(e=>e.date.startsWith(month)&&e.status!=="planned"&&valid(e.amount));
  const computed=computeMoney(money,monthDate);
  return {month,spentJod:round(paid.reduce((a,e)=>a+e.amount,0)),
   transactionCount:paid.length,plannedJod:computed.planned,
   incomePlanJod:computed.monthlyIncome,demo:money.demo};
 });
}
/** Requires at least two prior months with positive actual entries, prevents
 * treating demo figures, missing months, or one occasional expense as a trend.
 * Flags prompt a human review; never assert fraud or excessive spending.
 */
export function detectSpendingChanges(money:MoneyState,now=new Date()):SpendingFlag[]{
 if(money.demo)return [];
 const current=monthKey(now);
 const months=[1,2,3].map(n=>monthKey(atMonth(now,-n)));
 const flags:SpendingFlag[]=[];
 for(const category of money.categories){
  const categoryTotal=(month:string)=>{
   const items=money.expenses.filter(e=>e.status!=="planned"&&e.categoryId===category.id&&
     e.date.startsWith(month)&&valid(e.amount));
   return {total:round(items.reduce((n,e)=>n+e.amount,0)),count:items.length};
  };
  const baseline=months.map(categoryTotal).filter(x=>x.count>0);
  if(baseline.length<2)continue;
  const previous=round(baseline.reduce((n,x)=>n+x.total,0)/baseline.length);
  const recent=categoryTotal(current).total;
  if(previous>=10&&recent>=previous*1.5&&recent-previous>=25){
   flags.push({categoryId:category.id,categoryName:category.name,monthJod:recent,
    priorAverageJod:previous,ratio:round(recent/previous),
    reason:"Recorded paid entries this month are higher than your average in "+baseline.length+
    " previously active months. Timing and missing records can explain this; review before drawing conclusions."});
  }
 }
 return flags.sort((a,b)=>b.ratio-a.ratio).slice(0,5);
}
export type LongRangeAssumptions={
 months:3|6|12;
 onceOffJod:number; onceOffMonth:number;
 monthlyExtraJod:number; monthlyIncomeChangeJod:number;
};
export type LongRangeRow={month:string;plannedIncomeJod:number;plannedCostsJod:number;
 savingsTargetJod:number;oneOffJod:number;netJod:number;cumulativeNetJod:number};
export type LongRangeScenario={ready:boolean;reason:string;rows:LongRangeRow[];
 totalNetJod:number|null;lowestCumulativeJod:number|null;negativeMonths:number;
 explanation:string};
/** This is a budget-envelope what-if, NOT an account balance, not an actual
 * dated income or bill forecast. Adjustments are hypothetical and apply only
 * to the local calculation; none of the user's ledger is mutated.
 * Scenario costs must be ADDITIONAL to (not already included in) categories.
 */
export function forecastBudgetScenarios(state:MoneyState,input:LongRangeAssumptions,now=new Date()):LongRangeScenario{
 const explanation="Hypothetical monthly budget envelopes only; not a bank balance, repayment schedule or a verified forecast. Regular bills already in budget categories must not be entered again. Unrecorded spending, income timing and inflation are excluded.";
 const empty=(reason:string):LongRangeScenario=>({ready:false,reason,rows:[],
  totalNetJod:null,lowestCumulativeJod:null,negativeMonths:0,explanation});
 if(state.demo)return empty("Replace sample finances with your own figures before using the forecast.");
 if(!([3,6,12] as number[]).includes(input.months))return empty("Choose 3, 6 or 12 months.");
 const values=[input.onceOffJod,input.monthlyExtraJod,input.monthlyIncomeChangeJod];
 if(values.some(n=>!Number.isFinite(n)||Math.abs(n)>100000||Math.abs(n*100-Math.round(n*100))>0.00001)||
  input.onceOffJod<0||input.monthlyExtraJod<0||!Number.isSafeInteger(input.onceOffMonth)||
  input.onceOffMonth<1||input.onceOffMonth>input.months)return empty("Use valid JOD amounts and a month within the horizon.");
 if(!valid(state.income)||state.income>100000||state.categories.length===0||
  state.categories.some(c=>!valid(c.planned)||c.planned>100000))return empty("Complete a real monthly income and spending-category budget.");
 const rows:LongRangeRow[]=[];
 let running=0,lowest=Infinity,negativeMonths=0;
 for(let i=1;i<=input.months;i++){
  const d=atMonth(now,i-1);
  const base=computeMoney(state,d);
  const plannedIncome=round(Math.max(0,base.monthlyIncome+input.monthlyIncomeChangeJod));
  const plannedCosts=round(base.planned+input.monthlyExtraJod);
  const savings=round(Math.max(0,base.savingsTarget));
  const once=i===input.onceOffMonth?input.onceOffJod:0;
  const net=round(plannedIncome-plannedCosts-savings-once);
  running=round(running+net);
  lowest=Math.min(lowest,running);
  if(net<0)negativeMonths++;
  rows.push({month:monthKey(d),plannedIncomeJod:plannedIncome,
   plannedCostsJod:plannedCosts,savingsTargetJod:savings,oneOffJod:once,
   netJod:net,cumulativeNetJod:running});
 }
 return {ready:true,reason:"",rows,totalNetJod:running,lowestCumulativeJod:lowest,
  negativeMonths,explanation};
}
