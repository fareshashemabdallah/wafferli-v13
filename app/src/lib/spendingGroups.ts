import type {BudgetItem} from "./householdBudgetBuilder";
import {monthlyItemCost} from "./householdBudgetBuilder";
import {computeMoney,type MoneyState} from "./money";
import {billOutstanding,billPaidTotal} from "./unifiedCategoryLedger";
import {roundJod,scheduleDates} from "./cashflow";

export type SpendingRole="committed"|"necessary"|"flexible";
export const spendingRoles:readonly SpendingRole[]=["committed","necessary","flexible"];

/** Only the item is classified. Past fixed/variable and priority fields remain
 * compatible but never silently create obligations or extra financial records. */
export function displayItemRole(item:BudgetItem):{role:SpendingRole;suggested:boolean}{
 if(item.spendingRole)return {role:item.spendingRole,suggested:false};
 if(item.priority==="flexible")return {role:"flexible",suggested:true};
 const name=item.name.toLocaleLowerCase();
 if(/install?ment|loan|tuition|school fee|rent|mortgage|salary|insurance|contract|قسط|أقساط|تأمين|راتب|إيجار|مدرس/.test(name))
  return {role:"committed",suggested:true};
 if(/outing|restaurant|holiday|vacation|gift|car wash|upgrade|entertain|party|رحلة|طلعة|هدية|سفر|ترفيه/.test(name))
  return {role:"flexible",suggested:true};
 return {role:"necessary",suggested:true};
}
export type ClassifiedLine={
 itemId:string;categoryId:string;categoryName:string;name:string;
 role:SpendingRole;needsReview:boolean;planned:number;paid:number;
 frequency:BudgetItem["frequency"];priority:BudgetItem["priority"];
 /** Virtual view of an existing category envelope; never another budget or bill. */
 isRemainder?:boolean;
};
export type UnassignedCategory={categoryId:string;name:string;planned:number;paid:number;kind:"unclassified"|"cushion"|"adjustment"};
export type DueObligation={
 billId:string;categoryId:string;categoryName:string;name:string;dueDate:string;
 due:number;paid:number;remaining:number;budgetItemId?:string;
};
export type SpendingGroupSummary={
 role:SpendingRole;lines:ClassifiedLine[];
 planned:number;paid:number;remainingAllowance:number;
};
export type SpendingBreakdown={
 groups:SpendingGroupSummary[];unassigned:UnassignedCategory[];
 due:DueObligation[];totalPlanned:number;totalPaid:number;
};
/** The existing category budget and payment ledger remain canonical.
 * Items split that envelope but do not add another. Unlinked payments stay
 * visibly unassigned; true dated obligations are shown independently.
 */
export function spendingBreakdown(state:MoneyState,month:string):SpendingBreakdown{
 const [year,mm]=month.split("-").map(Number);
 const first=month+"-01";
 const last=month+"-"+String(new Date(year!,mm!,0).getDate()).padStart(2,"0");
 const finance=computeMoney(state,new Date(year!,mm!-1,15,12));
 const lines:ClassifiedLine[]=[];
 const unassigned:UnassignedCategory[]=[];
 const due:DueObligation[]=[];
 const bills=new Map((state.commitments??[]).map(b=>[b.id,b]));
 for(const category of state.categories){
  const items=(state.budgetItems??[]).filter(i=>i.categoryId===category.id&&i.enabled);
  const itemIds=new Set(items.map(i=>i.id));
  const spent=new Map<string,number>();
  let paidOther=0;
  for(const payment of state.expenses){
   if(payment.categoryId!==category.id||payment.status==="planned"||
      !payment.date.startsWith(month+"-")||!Number.isFinite(payment.amount))continue;
   const itemId=payment.budgetItemId??(payment.billId?bills.get(payment.billId)?.budgetItemId:undefined);
   if(itemId&&itemIds.has(itemId))
    spent.set(itemId,roundJod((spent.get(itemId)??0)+payment.amount));
   else paidOther=roundJod(paidOther+payment.amount);
  }
  const categoryTotal=finance.plannedBy(category.id);
  const itemTotal=roundJod(items.reduce((sum,i)=>sum+monthlyItemCost(i),0));
  for(const item of items){
   const suggested=displayItemRole(item);
   lines.push({
    itemId:item.id,categoryId:category.id,categoryName:category.name,name:item.name,
    role:suggested.role,needsReview:suggested.suggested,
    planned:monthlyItemCost(item),paid:spent.get(item.id)??0,
    frequency:item.frequency,priority:item.priority
   });
  }
  // Month-specific parent adjustments can be below the usual sum of items.
  // Keep the signed difference visible as an adjustment rather than inflate the month total.
  const rest=roundJod(categoryTotal-itemTotal);
  // Only the unitemized part inherits an explicitly entered category role.
  // Individual line roles stay authoritative; no additional budget is made.
  // A negative month-specific override stays a signed adjustment, not a
  // negative committed/necessary/flexible budget.
  if(category.remainderRole&&rest>0){
   lines.push({
    itemId:"remainder:"+category.id,categoryId:category.id,
    categoryName:category.name,name:category.name,role:category.remainderRole,
    needsReview:false,planned:rest,paid:paidOther,frequency:"monthly",
    priority:category.priority??(category.remainderRole==="flexible"?"flexible":"essential"),
    isRemainder:true
   });
  }else if(rest!==0||paidOther>0||items.length===0){
   unassigned.push({categoryId:category.id,name:category.name,planned:rest,paid:paidOther,
    kind:items.length===0?"unclassified":rest<0?"adjustment":"cushion"});
  }
 }
 for(const bill of state.commitments??[]){
  if(!bill.categoryId||!state.categories.some(c=>c.id===bill.categoryId))continue;
  const category=state.categories.find(c=>c.id===bill.categoryId)!;
  for(const dueDate of scheduleDates(bill.dueDate,bill.frequency,first,last,bill.endDate)){
   const remaining=billOutstanding(state,bill.id,dueDate);
   if(remaining===0)continue;
   due.push({
    billId:bill.id,categoryId:category.id,categoryName:category.name,name:bill.name,
    dueDate,due:bill.amount,paid:billPaidTotal(state,bill.id,dueDate),remaining,
    ...(bill.budgetItemId?{budgetItemId:bill.budgetItemId}:{})
   });
  }
 }
 return {
  groups:spendingRoles.map(role=>{
   const group=lines.filter(l=>l.role===role);
   const planned=roundJod(group.reduce((a,l)=>a+l.planned,0));
   const paid=roundJod(group.reduce((a,l)=>a+l.paid,0));
   return {role,lines:group,planned,paid,remainingAllowance:roundJod(Math.max(0,planned-paid))};
  }),
  unassigned,due:due.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)),
  totalPlanned:roundJod(state.categories.reduce((a,c)=>a+finance.plannedBy(c.id),0)),
  totalPaid:roundJod(state.categories.reduce((a,c)=>a+finance.spentBy(c.id),0))
 };
}
