import type {MoneyState} from "./money";
import {roundJod} from "./cashflow";

/** Deterministic, side-effect-free finance operations; never infer a bank balance. */
export type PaidBillCashMode="already"|"deduct"|"untracked";
export function recordBillPayment(state:MoneyState,billId:string,dueDate:string,paidOn:string,expenseId:string,mode:PaidBillCashMode,actualAmount?:number):MoneyState {
 const bill=(state.commitments??[]).find(b=>b.id===billId);
 if(!bill||bill.paidDates?.includes(dueDate)||!expenseId.trim())return state;
 const actual=actualAmount??bill.amount;
 if(!Number.isFinite(actual)||actual<0||actual>50000)return state;
 if(mode==="deduct" && (state.cashOnHand==null||!Number.isFinite(state.cashOnHand)||state.cashOnHand<actual))return state;
 const category=state.categories.find(c=>c.id===bill.categoryId)?.id??"uncategorized";
 return {...state,
  commitments:(state.commitments??[]).map(b=>b.id===billId?{...b,paidDates:[...(b.paidDates??[]),dueDate]}:b),
  expenses:[{id:expenseId,date:paidOn,categoryId:category,amount:actual,plannedAmount:bill.amount,status:"paid",note:bill.name,shared:false,billId,dueDate,cashDeducted:mode==="deduct"},...state.expenses],
  ...(mode==="deduct"?{cashOnHand:roundJod(state.cashOnHand!-actual),cashUpdatedAt:paidOn}:{})
 };
}
export function reverseBillPayment(state:MoneyState,billId:string,dueDate:string,restoreDeductedCash:boolean,today:string):MoneyState {
 const expense=state.expenses.find(e=>e.billId===billId&&e.dueDate===dueDate);
 const restore=!!(restoreDeductedCash&&expense?.cashDeducted&&state.cashOnHand!=null&&Number.isFinite(state.cashOnHand));
 return {...state,
  commitments:(state.commitments??[]).map(b=>b.id===billId?{...b,paidDates:(b.paidDates??[]).filter(d=>d!==dueDate)}:b),
  expenses:state.expenses.filter(e=>!(e.billId===billId&&e.dueDate===dueDate)),
  ...(restore?{cashOnHand:roundJod(state.cashOnHand!+expense!.amount),cashUpdatedAt:today}:{})
 };
}
