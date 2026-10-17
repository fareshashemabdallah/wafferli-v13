import {roundJod} from "./cashflow";
import {getFinancialReadiness} from "./financialReadiness";
import {getMoneyOverview} from "./moneyOverview";
import type {MoneyState} from "./money";
import type {FamilyPlan} from "./familyPlans";

export type SpendingScenario={
 outcome:"unknown"|"review"|"provisional";
 amountJod:number|null;
 projectedLowJod:number|null;
 reserveJod:number|null;
 billOnlyHeadroomJod:number|null;
 riskReasons:readonly string[];
 caveats:readonly string[];
};
/** Model a one-time expense paid today by reducing every future forecasted
 * cash point by that amount. Never writes into the family's ledger or
 * describes the result as a guaranteed available-to-spend amount.
 * This intentionally does not infer balances from historical expenditures.
 */
export function assessImmediateSpending(
 state:MoneyState,amount:number,now=new Date(),plans:readonly FamilyPlan[]=[]
):SpendingScenario{
 const valid=Number.isFinite(amount)&&amount>0&&amount<=100000&&
  Math.abs(amount*100-Math.round(amount*100))<0.00001;
 if(!valid)return {outcome:"unknown",amountJod:null,projectedLowJod:null,
  reserveJod:null,billOnlyHeadroomJod:null,
  riskReasons:["Enter a valid one-off amount in JOD (up to 2 decimals)."],caveats:[]};
 const money=getMoneyOverview(state,now,plans);
 const ready=getFinancialReadiness(state,now,plans);
 const reasons:string[]=[];
 const caveats=[
  "This models payment TODAY; prices, bank balances and transaction status are not verified.",
  "Only recorded dated income and bills enter the 30-day forecast. Unrecorded daily expenses are excluded.",
  "Expected income can arrive late; even a provisional result is not a guarantee."
 ];
 if(state.demo)reasons.push("Demo finances cannot be used for a real spending decision.");
 if(!ready.budgetReady)reasons.push("Complete your real monthly income and category budget.");
 if(!ready.cashKnown)reasons.push("Enter the actual cash balance held today.");
 if(!ready.cashFresh)reasons.push("Refresh and date-check your actual cash balance.");
 if(!ready.billsReviewed||!money.hasBillSchedule)
  reasons.push("Review unpaid bills with due dates or confirm none this month.");
 if(money.dateProblems>0)
  reasons.push("Some scheduled income or bills have invalid or missing dates.");
 if(reasons.length)return {outcome:"unknown",amountJod:roundJod(amount),
  projectedLowJod:null,reserveJod:null,billOnlyHeadroomJod:null,
  riskReasons:reasons,caveats};
 const reserve=Number.isFinite(state.cashReserve)?Math.max(0,state.cashReserve??0):0;
 const low=money.forecast.minimumBalance;
 const afterBills=money.cashAfterBills;
 if(low===null||afterBills===null)return {outcome:"unknown",amountJod:roundJod(amount),
  projectedLowJod:null,reserveJod:null,billOnlyHeadroomJod:null,
  riskReasons:["Unable to calculate the recorded cash trajectory."],caveats};
 const post=roundJod(low-amount);
 const after=roundJod(afterBills-amount);
 if(money.forecast.overdueCount>0)
  reasons.push("At least one recorded bill is overdue or not confirmed paid.");
 if(after<0)reasons.push("The cost exceeds recorded cash after unpaid bills and reserve.");
 if(post<reserve)reasons.push("The 30-day forecast's low point falls below your selected cash reserve after this payment.");
 if(state.incomeSources?.some(s=>s.variable))
  caveats.push("One or more expected income sources were marked variable.");
 return {
  outcome:reasons.length?"review":"provisional",
  amountJod:roundJod(amount),projectedLowJod:post,
  reserveJod:roundJod(reserve),billOnlyHeadroomJod:after,
  riskReasons:reasons,caveats
 };
}
