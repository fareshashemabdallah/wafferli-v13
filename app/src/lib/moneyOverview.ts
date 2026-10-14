import {buildForecast,futureDate,legacyIncome,roundJod,type Forecast} from "./cashflow";
import {computeMoney,sampleMoney,type MoneyState} from "./money";

/**
 * One read-only interpretation of the user's financial records.
 * Distinguishes monthly allocations, recorded spending and dated cash-flow events.
 * Never calls the monthly allowance or a bill-only cash estimate "available to spend".
 */
export type MoneyOverview={
  forecast:Forecast;
  month:ReturnType<typeof computeMoney>;
  demo:boolean;
  cashSet:boolean;
  hasIncomeSchedule:boolean;
  hasBillSchedule:boolean;
  dateProblems:number;
  uncategorizedBills:number;
  paidBillsThisMonth:number;
  billExpensesThisMonth:number;
  billsNext7Days:number;
  plannedCategoriesWithoutBillLinks:number;
  billOnlyRemainder:number|null;
};
const validMoney=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value)&&value>=0;
export function getMoneyOverview(state:MoneyState,now=new Date()):MoneyOverview {
  const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const incomes=state.incomeSources??legacyIncome(state.income);
  const commitments=state.commitments??[];
  const cash=validMoney(state.cashOnHand)?state.cashOnHand:null;
  const forecast=buildForecast({
    incomes, commitments, openingBalance:cash,
    reserve:validMoney(state.cashReserve)?state.cashReserve:0,today,days:30
  });
  const month=computeMoney(state,now);
  const paidExpenses=state.expenses.filter(e=>e.date.startsWith(today.slice(0,7))&&e.billId);
  const paidBillKeys=new Set(paidExpenses.map(e=>e.billId+":"+e.dueDate));
  const paidMarked=commitments.flatMap(b=>(b.paidDates??[]).filter(d=>d.startsWith(today.slice(0,7))).map(d=>b.id+":"+d));
  const linkedCategories=new Set(commitments.map(b=>b.categoryId).filter((x):x is string=>!!x&&state.categories.some(c=>c.id===x)));
  return {
    forecast,month,demo:state.demo,cashSet:cash!==null,
    hasIncomeSchedule:incomes.some(i=>/^\d{4}-\d{2}-\d{2}$/.test(i.nextDate)),
    hasBillSchedule:commitments.length>0,dateProblems:forecast.missingDates,
    uncategorizedBills:commitments.filter(b=>!b.categoryId||!state.categories.some(c=>c.id===b.categoryId)).length,
    paidBillsThisMonth:new Set([...paidMarked,...paidBillKeys]).size,
    billExpensesThisMonth:roundJod(paidExpenses.reduce((n,e)=>n+e.amount,0)),
    billsNext7Days:roundJod(forecast.events.filter(e=>e.kind==="bill" && e.date<=futureDate(today,7)).reduce((a,e)=>a+e.amount,0)),
    plannedCategoriesWithoutBillLinks:state.categories.filter(c=>c.planned>0&&!linkedCategories.has(c.id)).length,
    billOnlyRemainder:forecast.safeToSpend
  };
}
export function emptyRealMoney():MoneyState {
  // Explicit opt-in only: never silently overwrite old/demo saved entries.
  return {...sampleMoney(),demo:false,income:0,savingsPct:0,categories:[],expenses:[],incomeSources:[],commitments:[],cashOnHand:null,cashReserve:0};
}
