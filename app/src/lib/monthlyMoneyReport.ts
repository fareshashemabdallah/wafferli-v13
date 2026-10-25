import {buildForecast,legacyIncome,roundJod,scheduleDates,type Forecast} from "./cashflow";
import {computeMoney,type MoneyState} from "./money";
import {spendingBreakdown as categoryGroups} from "./spendingGroups";
import {billOutstanding,billPaidTotal} from "./unifiedCategoryLedger";
import {familyFinancialCommitments,familyForecastCommitments} from "./familyFinancialCommitments";
import type {FamilyPlan} from "./familyPlans";
import {validMoneyMonth} from "./monthAwareMoney";

/** Read-only report projection. No report field becomes a new Money record. */
export type MonthlyReportCategory={
 id:string;name:string;type:string;priority:string;confidence:string;
 planned:number;paid:number;difference:number;
 lines:{name:string;role:string;review:boolean;planned:number;paid:number;frequency:string;priority:string}[];
 unitemized:{name:string;planned:number;paid:number;kind:string}[];
};
export type MonthlyReportExpense={
 id:string;date:string;category:string;item:string;description:string;amount:number;
 link:string;status:"paid"|"planned";
};
export type MonthlyReportDue={
 id:string;name:string;category:string;dueDate:string;scheduled:number;
 recordedPaid:number;remaining:number;state:string;source:"bill"|"occasion";
};
export type MonthlyReportIncome={
 id:string;name:string;monthlyEquivalent:number;frequency:string;
 scheduledDates:string[];confirmedReceipts:{date:string;amount:number;estimated:boolean}[];
};
export type MonthlyMoneyReport={
 month:string;sample:boolean;partial:boolean;generatedOn:string;
 plannedIncome:number|null;confirmedIncome:number|null;incomeRows:MonthlyReportIncome[];
 categoryRows:MonthlyReportCategory[];classification:ReturnType<typeof categoryGroups>["groups"];
 plannedExpenses:MonthlyReportExpense[];paidExpenses:MonthlyReportExpense[];
 categoryPlanTotal:number;actualPaidTotal:number;variance:number;
 dues:MonthlyReportDue[];totalDue:number;totalRecordedDuePayments:number;outstandingDue:number;
 cash:{balance:number|null;balanceDate:string|null;reserve:number;forecast:Forecast|null};
 warnings:string[];
};
const sum=(values:readonly number[])=>roundJod(values.reduce((a,b)=>a+b,0));
const iso=(d:Date)=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const cash=(x:unknown)=>typeof x==="number"&&Number.isFinite(x)&&x>=0?x:null;

/** All figures are sourced from canonical category, expense, income and commitment records.
 * Planned category envelopes, detailed items and scheduled bills are NOT added together.
 * The report never updates MoneyState, schedules, payments, plans or storage.
 */
export function buildMonthlyMoneyReport(
 state:MoneyState,month:string,now=new Date(),plans:readonly FamilyPlan[]=[]
):MonthlyMoneyReport{
 if(!validMoneyMonth(month))throw new Error("Invalid reporting month");
 const [year,m]=month.split("-").map(Number);
 const date=new Date(year!,m!-1,15,12);
 const first=month+"-01",last=month+"-"+String(new Date(year!,m!,0).getDate()).padStart(2,"0");
 const calc=computeMoney(state,date);
 const classification=categoryGroups(state,month);
 const bills=state.commitments??[];
 const byBill=new Map(bills.map(b=>[b.id,b]));
 const byItem=new Map((state.budgetItems??[]).map(i=>[i.id,i]));
 const byCategory=new Map(state.categories.map(c=>[c.id,c]));
 const allLines=classification.groups.flatMap(g=>g.lines);
 const categoryRows:MonthlyReportCategory[]=state.categories.map(c=>({
  id:c.id,name:c.name,type:c.type,priority:c.priority??"not specified",
  confidence:c.amountConfidence??"estimate",
  planned:roundJod(calc.plannedBy(c.id)),paid:roundJod(calc.spentBy(c.id)),
  difference:roundJod(calc.plannedBy(c.id)-calc.spentBy(c.id)),
  lines:allLines.filter(l=>l.categoryId===c.id).map(l=>({
   name:l.name,role:l.role,review:l.needsReview,planned:l.planned,paid:l.paid,
   frequency:l.frequency,priority:l.priority
  })),
  unitemized:classification.unassigned.filter(l=>l.categoryId===c.id).map(l=>({
   name:l.name,planned:l.planned,paid:l.paid,kind:l.kind
  }))
 }));
 // Retired/unknown categories are shown, not discarded or silently reassigned.
 const unknownPaid=state.expenses.filter(e=>e.date.startsWith(month+"-")&&e.status!=="planned"&&!byCategory.has(e.categoryId));
 const unknownPlanned=state.expenses.filter(e=>e.date.startsWith(month+"-")&&e.status==="planned"&&!byCategory.has(e.categoryId));
 if(unknownPaid.length||unknownPlanned.length){
  const amount=sum(unknownPaid.map(e=>e.amount));
  categoryRows.push({id:"unclassified-report-only",name:"Uncategorized / retired categories",
   type:"unallocated",priority:"not specified",confidence:"unclassified",
   planned:0,paid:amount,difference:roundJod(-amount),lines:[],unitemized:[]});
 }
 const toExpense=(e:MoneyState["expenses"][number]):MonthlyReportExpense=>{
  const cat=byCategory.get(e.categoryId);
  const item=byItem.get(e.budgetItemId??byBill.get(e.billId??"")?.budgetItemId??"");
  return {id:e.id,date:e.date,category:cat?.name??state.retiredCategoryNames?.[e.categoryId]??"Uncategorized",
   item:item?.name??"",description:e.note??"",amount:e.amount,
   link:e.billId?"Bill: "+(byBill.get(e.billId)?.name??"linked payment"):
    e.sourcePlanId?"Family plan payment":"",status:e.status==="planned"?"planned":"paid"};
 };
 const entries=state.expenses.filter(e=>e.date.startsWith(month+"-")).slice()
  .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const paidExpenses=entries.filter(e=>e.status!=="planned").map(toExpense);
 const plannedExpenses=entries.filter(e=>e.status==="planned").map(toExpense);
 const incomeSources=state.incomeSources??legacyIncome(state.income);
 const incomeRows=incomeSources.map(i=>{
  const scheduledDates=scheduleDates(i.nextDate,i.frequency,first,last,i.endDate);
  const confirmedReceipts=[...new Set(i.receivedDates??[])].filter(d=>d.startsWith(month+"-"))
   .sort().map(d=>({date:d,amount:i.receivedAmounts?.[d]??i.amount,
    estimated:i.receivedAmounts?.[d]===undefined}));
  const rate:Record<string,number>={daily:365/12,weekly:52/12,biweekly:26/12,
   monthly:1,quarterly:1/3,yearly:1/12,once:0,irregular:0};
  return {id:i.id,name:i.name,monthlyEquivalent:roundJod(i.amount*(rate[i.frequency]??0)),
   frequency:i.frequency,scheduledDates,confirmedReceipts};
 });
 const receipts=incomeRows.flatMap(i=>i.confirmedReceipts);
 const hasRecordedIncome=incomeSources.length>0&&receipts.length>0;
 const incomeKnown=state.demo||state.incomeKnown===true||
  (state.incomeSources!==undefined&&state.incomeSources.length>0)||state.income>0;
 const dues:MonthlyReportDue[]=[];
 for(const b of bills){
  for(const dueDate of scheduleDates(b.dueDate,b.frequency,first,last,b.endDate)){
   const recordedPaid=billPaidTotal(state,b.id,dueDate);
   const remaining=billOutstanding(state,b.id,dueDate);
   dues.push({id:b.id+":"+dueDate,name:b.name,category:byCategory.get(b.categoryId??"")?.name??"Uncategorized",
    dueDate,scheduled:b.amount,recordedPaid,remaining,
    state:b.paidDates?.includes(dueDate)&&recordedPaid===0?"marked paid (amount not recorded)":
     remaining===0?"paid / settled":recordedPaid>0?"partly paid":"unpaid / unconfirmed",
    source:"bill"});
  }
 }
 const existing=new Set(bills.map(b=>b.id));
 for(const row of familyFinancialCommitments(plans,state)){
  if(!row.dueDate.startsWith(month+"-")||existing.has(row.id))continue;
  dues.push({id:row.id,name:row.planTitle+" · "+row.label,category:"Family occasion",
   dueDate:row.dueDate,scheduled:row.amountJod,recordedPaid:row.actualPaidJod??0,
   remaining:row.paid?0:row.certainty==="idea"?0:row.amountJod,
   state:row.paid?"paid (in expense ledger)":row.certainty==="idea"?"idea only — not committed":
    row.certainty==="firm"?"confirmed commitment":"planned commitment",source:"occasion"});
 }
 dues.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.name.localeCompare(b.name));
 const current=month===iso(now).slice(0,7);
 const today=iso(now);
 const currentBalance=cash(state.cashOnHand);
 const forecast=current?buildForecast({
  incomes:incomeSources,commitments:[...bills,...familyForecastCommitments(plans,state)],
  openingBalance:currentBalance,reserve:cash(state.cashReserve)??0,
  today,days:30,billPayments:state.expenses
 }):null;
 const warnings=[
  "Recorded paid expenses are only the entries saved in Dabberna; missing entries are not savings.",
  "Budgets, expense items and bill schedules are different views of existing records, never additive expenses.",
  "Historical planned amounts reflect the current saved category budget and any saved month adjustment; they may not be the original budget for that month.",
  ...(state.demo?["SAMPLE DATA: Not a report of your household."]:[]),
  ...(!incomeKnown?["Income has not been provided. Zero is not assumed."]:[]),
  ...((state.financialInputsPartial||state.categories.length===0)?["Financial inputs may be incomplete."]:[]),
  ...(plannedExpenses.length?["Unconfirmed planned expenses are listed separately and excluded from paid totals."]:[]),
  ...(dues.some(d=>d.state==="marked paid (amount not recorded)")?["Some bills were marked paid without a recorded amount. They cannot be treated as verified payments."]:[]),
  ...(incomeRows.some(i=>i.confirmedReceipts.some(r=>r.estimated))?["Some income receipts were confirmed without an actual amount; scheduled amounts are shown as estimates."]:[])
 ];
 return {month,sample:state.demo,partial:!!state.financialInputsPartial||!incomeKnown,
  generatedOn:today,plannedIncome:incomeKnown?roundJod(calc.monthlyIncome):null,
  confirmedIncome:hasRecordedIncome?sum(receipts.map(r=>r.amount)):null,
  incomeRows,categoryRows,classification:classification.groups,
  plannedExpenses,paidExpenses,categoryPlanTotal:roundJod(calc.planned),
  actualPaidTotal:roundJod(calc.spent),variance:roundJod(calc.planned-calc.spent),
  dues,totalDue:sum(dues.filter(d=>d.state!=="idea only — not committed").map(d=>d.scheduled)),
  totalRecordedDuePayments:sum(dues.map(d=>d.recordedPaid)),
  outstandingDue:sum(dues.map(d=>d.remaining)),
  cash:{balance:currentBalance,balanceDate:state.cashUpdatedAt??null,
   reserve:cash(state.cashReserve)??0,forecast},warnings};
}
