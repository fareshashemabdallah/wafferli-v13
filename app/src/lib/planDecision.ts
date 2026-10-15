import {computeMoney,type MoneyState} from "./money";
import {getMoneyOverview} from "./moneyOverview";
import {roundJod,futureDate,localToday} from "./cashflow";
import type {FamilyPlan} from "./familyPlans";

export type PlanDecision={
 cost:number|null;costSource:"option"|"limit"|"missing";
 month:string;monthLabel:string;income:number;savings:number;budgets:number;carryover:number;
 unallocated:number|null;monthlyGap:number|null;monthlyAssessment:"missing"|"fits"|"shortfall";
 cashRemaining:number|null;cashGap:number|null;cashAssessment:"missing"|"future"|"fits"|"shortfall"|"caution";
 missing:string[];monthlyFlexible:{name:string;room:number}[];
 choiceExceedsLimit:number|null;suggestedCeiling:number|null;
 otherPlans:number;
};
const iso=(date:Date)=>date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0");
const valid=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1000000;
const localDay=(date:Date)=>iso(date)+"-"+String(date.getDate()).padStart(2,"0");
export function evaluatePlan(plan:FamilyPlan,money:MoneyState,all:FamilyPlan[]=[],now=new Date()):PlanDecision{
 const day=plan.date&&/^\d{4}-\d{2}-\d{2}$/.test(plan.date)?plan.date:localDay(now);
 const month=day.slice(0,7);
 const [year,mo]=month.split("-").map(Number);
 const monthDate=new Date(year!,mo!-1,15,12);
 const monthLabel=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(monthDate);
 const finance=computeMoney(money,monthDate);
 const cost=valid(plan.choice?.estimatedJod)?plan.choice!.estimatedJod!:valid(plan.budgetJod)?plan.budgetJod!:null;
 const source=valid(plan.choice?.estimatedJod)?"option":valid(plan.budgetJod)?"limit":"missing";
 const validBudget=!money.demo&&finance.monthlyIncome>0&&money.categories.length>0&&
  money.categories.every(c=>valid(c.planned))&&finance.savingsTarget>=0;
 const gap=roundJod(finance.monthlyIncome+finance.carryover.net-finance.savingsTarget-finance.planned);
 const monthlyGap=cost!==null&&validBudget?roundJod(gap-cost):null;
 const monthlyFlexible=validBudget?money.categories.filter(c=>c.type==="variable").map(c=>({
  name:c.name,room:roundJod(Math.max(0,finance.plannedBy(c.id)-finance.spentBy(c.id)))
 })).filter(c=>c.room>0).sort((a,b)=>b.room-a.room).slice(0,3):[];
 const overview=getMoneyOverview(money,now);
 const canCheckCash=!money.demo&&overview.cashSet&&overview.hasBillSchedule&&overview.dateProblems===0&&overview.cashAfterBills!==null;
 const today=localDay(now);
 // 30-day forecast covers only a dated horizon; never imply the current balance is future cash.
 const withinCashWindow=day>=today&&day<=futureDate(today,30);
 const cashAssessment:PlanDecision["cashAssessment"]=!canCheckCash?"missing":!withinCashWindow?"future":
  overview.forecast.overdueCount>0||(overview.forecast.minimumBalance!==null&&overview.forecast.minimumBalance<0)?"caution":
  cost!==null&&overview.cashAfterBills!<cost?"shortfall":"fits";
 const cashGap=canCheckCash&&withinCashWindow&&cost!==null?roundJod(overview.cashAfterBills!-cost):null;
 const missing:string[]=[];
 if(money.demo)missing.push("real-finances");
 else {
  if(!validBudget)missing.push("monthly-income-and-budgets");
  if(!overview.cashSet)missing.push("actual-cash");
  if(!overview.hasBillSchedule)missing.push("unpaid-bills");
  if(overview.dateProblems>0)missing.push("bill-dates");
 }
 if(cost===null)missing.push("plan-cost");
 const choiceExceedsLimit=valid(plan.budgetJod)&&valid(plan.choice?.estimatedJod)?
  roundJod(plan.choice!.estimatedJod!-plan.budgetJod!):null;
 const otherPlans=all.filter(p=>p.id!==plan.id&&p.status!=="completed"&&p.date?.slice(0,7)===month&&
   (p.choice?.estimatedJod!==undefined||p.budgetJod!==undefined)).length;
 return {
  cost,costSource:source,month,monthLabel,income:finance.monthlyIncome,
  savings:finance.savingsTarget,budgets:finance.planned,carryover:finance.carryover.net,
  unallocated:validBudget?gap:null,monthlyGap,
  monthlyAssessment:monthlyGap===null?"missing":monthlyGap>=0?"fits":"shortfall",
  cashRemaining:canCheckCash?overview.cashAfterBills:null,cashGap,cashAssessment,
  missing,monthlyFlexible,choiceExceedsLimit,otherPlans,
  suggestedCeiling:validBudget&&gap>0?roundJod(Math.max(0,gap)):null
 };
}
