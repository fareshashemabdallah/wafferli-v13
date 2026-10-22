import type {Category,MoneyState} from "./money";
import {roundJod,scheduleDates} from "./cashflow";
import {billOutstanding} from "./unifiedCategoryLedger";
import {computeMoney} from "./money";
export type SpendingRole="committed"|"necessary"|"flexible";
export type ExpenseCadence="weekly"|"monthly"|"quarterly"|"yearly"|"once";
export const spendingRoles:readonly SpendingRole[]=["committed","necessary","flexible"];
export const expenseCadences:readonly ExpenseCadence[]=["weekly","monthly","quarterly","yearly","once"];

/** Legacy categories are only *suggested* a visual position. The inference is
 * never persisted, never creates a bill, and is not treated as a true obligation.
 * Parents confirm the meaning in Edit category, without re-entering amounts. */
export function displaySpendingRole(category:Category):{role:SpendingRole;suggested:boolean}{
 if(category.spendingRole)return {role:category.spendingRole,suggested:false};
 if(category.priority==="flexible")return {role:"flexible",suggested:true};
 const v=category.name.toLocaleLowerCase();
 if(/school|tuition|nanny|helper|rent|mortgage|insurance|property tax|رسوم|مدرس|مربية|عاملة|إيجار|تأمين|قسط|ضريبة/.test(v))
  return {role:"committed",suggested:true};
 if(/outing|restaurant|leisure|travel|holiday|vacation|entertain|trip|gift|party|طلعات|مطعم|سفر|عطل|ترفيه|رحلة|هدايا/.test(v))
  return {role:"flexible",suggested:true};
 return {role:"necessary",suggested:true};
}
export type SpendingGroupSummary={role:SpendingRole;categoryIds:string[];planned:number;paid:number;remainingAllowance:number;billOutstanding:number;numberOfDatedBills:number;numberOfUnclassified:number};
/** Paid = confirmed expense history; owed = only genuine dated bill balances.
 * Unspent monthly allowance is never called an unpaid debt. */
export function spendingGroupSummaries(state:MoneyState,month:string):SpendingGroupSummary[]{
 const date=month+"-01";
 const [year,mm]=month.split("-").map(Number);
 const last=month+"-"+String(new Date(year!,mm!,0).getDate()).padStart(2,"0");
 const finance=computeMoney(state,new Date(year!,mm!-1,15,12));
 return spendingRoles.map(role=>{
  const group=state.categories.filter(c=>displaySpendingRole(c).role===role);
  const ids=new Set(group.map(c=>c.id));
  const planned=roundJod(group.reduce((n,c)=>n+finance.plannedBy(c.id),0));
  const paid=roundJod(group.reduce((n,c)=>n+finance.spentBy(c.id),0));
  let billOutstandingAmount=0,numberOfDatedBills=0;
  if(role==="committed")for(const bill of state.commitments??[]){
   if(!bill.categoryId||!ids.has(bill.categoryId))continue;
   const dueDates=scheduleDates(bill.dueDate,bill.frequency,date,last,bill.endDate);
   for(const dueDate of dueDates){
    billOutstandingAmount+=billOutstanding(state,bill.id,dueDate);
    numberOfDatedBills++;
   }
  }
  return {role,categoryIds:group.map(c=>c.id),planned,paid,
   remainingAllowance:roundJod(Math.max(0,planned-paid)),
   billOutstanding:roundJod(billOutstandingAmount),numberOfDatedBills,
   numberOfUnclassified:group.filter(c=>!c.spendingRole).length};
 });
}
