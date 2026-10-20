import type {MoneyState} from "./money";
import {roundJod} from "./cashflow";
import {recordConfirmedExpense,type CashTreatment} from "./confirmedExpense";

/** Deterministic, side-effect-free finance operations; never infer a bank balance. */
export type PaidBillCashMode="already"|"deduct"|"untracked";
export function recordBillPayment(state:MoneyState,billId:string,dueDate:string,paidOn:string,expenseId:string,mode:PaidBillCashMode,actualAmount?:number):MoneyState {
 const bill=(state.commitments??[]).find(b=>b.id===billId);
 // A paidDates marker may be missing from older or partially restored data.
 // The linked expense is still proof of a recorded payment; never charge it again.
 if(!bill||bill.paidDates?.includes(dueDate)||!expenseId.trim()||
    state.expenses.some(e=>e.id===expenseId||e.billId===billId&&e.dueDate===dueDate))return state;
 const actual=actualAmount??bill.amount;
 if(!Number.isFinite(actual)||actual<0||actual>50000)return state;
 const recorded=recordConfirmedExpense(state,{
  id:expenseId,date:paidOn,categoryId:state.categories.find(c=>c.id===bill.categoryId)?.id??"uncategorized",
  amount:actual,plannedAmount:bill.amount,note:bill.name,billId,dueDate
 },mode as CashTreatment);
 if(recorded===state)return state;
 return {...recorded,commitments:(state.commitments??[]).map(b=>b.id===billId?
  {...b,paidDates:[...(b.paidDates??[]),dueDate]}:b)};
}
export function reverseBillPayment(state:MoneyState,billId:string,dueDate:string,restoreDeductedCash:boolean,today:string):MoneyState {
 const matches=state.expenses.filter(e=>e.billId===billId&&e.dueDate===dueDate);
 // Do not silently delete multiple historical/duplicate payment entries and
 // restore the cash value of only one. Such records need individual review.
 if(matches.length>1)return state;
 const hasPaidMark=(state.commitments??[]).some(b=>b.id===billId&&b.paidDates?.includes(dueDate));
 if(!matches.length&&!hasPaidMark)return state;
 const expense=matches[0];
 const restore=!!(restoreDeductedCash&&expense?.cashDeducted&&state.cashOnHand!=null&&Number.isFinite(state.cashOnHand));
 return {...state,
  commitments:(state.commitments??[]).map(b=>b.id===billId?{...b,paidDates:(b.paidDates??[]).filter(d=>d!==dueDate)}:b),
  expenses:state.expenses.filter(e=>!(e.billId===billId&&e.dueDate===dueDate)),
  ...(restore?{cashOnHand:roundJod(state.cashOnHand!+expense!.amount),cashUpdatedAt:today}:{})
 };
}
