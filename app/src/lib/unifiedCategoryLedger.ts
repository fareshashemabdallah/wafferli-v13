import type {MoneyState} from "./money";
import type {BudgetItem} from "./householdBudgetBuilder";
import type {Frequency} from "./cashflow";
import {roundJod,scheduleDates,futureDate} from "./cashflow";
import {monthlyItemCost,upsertBudgetItem} from "./householdBudgetBuilder";

/** A category is a budget envelope, not an additional expense. Payments live
 * only in the existing expenses ledger and retain stable bill/item links. */
const moneyOk=(n:number)=>Number.isFinite(n)&&n>0&&n<=100000&&Math.abs(n*100-Math.round(n*100))<0.00001;
const dateOk=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&
 !Number.isNaN(Date.parse(d+"T12:00:00Z"))&&new Date(d+"T12:00:00Z").toISOString().slice(0,10)===d;
export function billPaidTotal(state:MoneyState,billId:string,dueDate:string){
 return roundJod(state.expenses.filter(e=>e.status!=="planned"&&e.billId===billId&&e.dueDate===dueDate)
  .reduce((sum,e)=>sum+e.amount,0));
}
export function billOutstanding(state:MoneyState,billId:string,dueDate:string){
 const bill=(state.commitments??[]).find(b=>b.id===billId);
 if(!bill)return 0;
 if(bill.paidDates?.includes(dueDate))return 0;
 return roundJod(Math.max(0,bill.amount-billPaidTotal(state,billId,dueDate)));
}
export type CategoryPayment={
 id:string;categoryId:string;amount:number;date:string;
 budgetItemId?:string;billId?:string;dueDate?:string;
};
/** Adds exactly one paid entry; no inferred cash movement. Multiple partial
 * bill payments are allowed, but never more than the scheduled balance. */
export function recordCategoryPayment(state:MoneyState,p:CategoryPayment):MoneyState{
 if(state.demo||!p.id.trim()||p.id.length>150||!moneyOk(p.amount)||!dateOk(p.date)||
  !state.categories.some(c=>c.id===p.categoryId)||state.expenses.some(e=>e.id===p.id))return state;
 if(p.budgetItemId&&!(state.budgetItems??[]).some(i=>i.id===p.budgetItemId&&i.categoryId===p.categoryId))return state;
 if(p.billId){
  const bill=(state.commitments??[]).find(b=>b.id===p.billId);
  if(!bill||bill.categoryId!==p.categoryId||!p.dueDate||!dateOk(p.dueDate)||
   !scheduleDates(bill.dueDate,bill.frequency,p.dueDate,p.dueDate,bill.endDate).includes(p.dueDate)||
   p.amount>billOutstanding(state,bill.id,p.dueDate))return state;
  // A linked item must be the same item this bill was created for.
  if(p.budgetItemId&&bill.budgetItemId&&p.budgetItemId!==bill.budgetItemId)return state;
 }
 const expense={id:p.id,categoryId:p.categoryId,date:p.date,amount:roundJod(p.amount),
  status:"paid" as const,shared:false,cashDeducted:false,
  ...(p.budgetItemId?{budgetItemId:p.budgetItemId}:{}),
  ...(p.billId?{billId:p.billId,dueDate:p.dueDate!}:{}),
 };
 const next={...state,expenses:[expense,...state.expenses]};
 if(!p.billId||!p.dueDate)return next;
 const finished=billOutstanding(next,p.billId,p.dueDate)===0;
 return finished?{...next,commitments:(next.commitments??[]).map(b=>b.id===p.billId?
  {...b,paidDates:[...new Set([...(b.paidDates??[]),p.dueDate!])]}:b)}:next;
}
/** Undo just one recorded payment, preserving all the other instalments. Never
 * automatically modify the parent's separately entered cash balance. */
export function undoCategoryPayment(state:MoneyState,id:string):MoneyState{
 const entry=state.expenses.find(e=>e.id===id);
 if(!entry||state.demo||entry.status==="planned"||entry.cashDeducted||
  entry.sourcePlanId||entry.sourceOccasionCost)return state;
 const next={...state,expenses:state.expenses.filter(e=>e.id!==id)};
 return entry.billId&&entry.dueDate?
  {...next,commitments:(next.commitments??[]).map(b=>b.id===entry.billId?
   {...b,paidDates:(b.paidDates??[]).filter(d=>d!==entry.dueDate)}:b)}:next;
}
export function addCategoryItem(state:MoneyState,item:BudgetItem):MoneyState{
 const cat=state.categories.find(c=>c.id===item.categoryId);
 if(!cat||state.demo||!item.enabled||!moneyOk(item.amountJod))return state;
 const others=(state.budgetItems??[]).filter(i=>i.categoryId===cat.id&&i.id!==item.id);
 const allocated=others.reduce((sum,i)=>sum+monthlyItemCost(i),0)+monthlyItemCost(item);
 // Do not silently raise a parent's original category plan or double-count items.
 if(roundJod(allocated)>cat.planned)return state;
 return upsertBudgetItem(state,item);
}
export function disableCategoryItem(state:MoneyState,itemId:string):MoneyState{
 if(state.demo)return state;
 return {...state,budgetItems:(state.budgetItems??[]).map(i=>i.id===itemId?{...i,enabled:false}:i)};
}
export function saveCategoryDueDate(state:MoneyState,p:{
 id:string;name:string;amount:number;categoryId:string;frequency:Frequency;dueDate:string;budgetItemId?:string
}):MoneyState{
 if(state.demo||!p.id.trim()||!p.name.trim()||!moneyOk(p.amount)||!dateOk(p.dueDate)||
  !state.categories.some(c=>c.id===p.categoryId)||!["once","monthly","quarterly","yearly"].includes(p.frequency)||
  (p.budgetItemId&&!(state.budgetItems??[]).some(i=>i.id===p.budgetItemId&&i.categoryId===p.categoryId))||
  (state.commitments??[]).some(b=>b.id===p.id||
   (p.budgetItemId&&b.budgetItemId===p.budgetItemId)))return state;
 return {...state,commitments:[...(state.commitments??[]),{...p}]};
}
export function stopCategoryItem(state:MoneyState,itemId:string):MoneyState{
 const disabled=disableCategoryItem(state,itemId);
 return (disabled.commitments??[]).filter(b=>b.budgetItemId===itemId)
  .reduce((current,b)=>removeCategoryBill(current,b.id),disabled);
}
export function removeCategoryBill(state:MoneyState,billId:string):MoneyState{
 if(state.demo)return state;
 const bill=(state.commitments??[]).find(b=>b.id===billId);
 if(!bill)return state;
 // Never delete a paid bill's history or its source. Stop its future recurrence.
 const paid=state.expenses.filter(e=>e.billId===billId&&e.dueDate);
 if(paid.length){
  const last=paid.map(e=>e.dueDate!).sort().at(-1)!;
  const partiallyPaid=state.expenses.filter(e=>e.billId===billId&&e.dueDate===last)
   .reduce((sum,e)=>sum+e.amount,0)<bill.amount;
  return {...state,commitments:(state.commitments??[]).map(b=>b.id===billId?
   {...b,endDate:partiallyPaid?futureDate(last,-1):last}:b)};
 }
 return {...state,commitments:(state.commitments??[]).filter(b=>b.id!==billId)};
}
