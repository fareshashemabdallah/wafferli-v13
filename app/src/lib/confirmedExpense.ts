import type {Expense,MoneyState} from "./money";
import {roundJod} from "./cashflow";

/** One ledger operation for every confirmed purchase, bill, basket or plan.
 * A planned cost is never a paid expense. No caller can change entered cash
 * without explicit parent selection. Existing records and keys are untouched.
 */
export type CashTreatment="already"|"deduct"|"untracked";
export type PaidExpenseInput={
 id:string;date:string;amount:number;categoryId?:string;
 note?:string;shared?:boolean;plannedAmount?:number;
 billId?:string;dueDate?:string;sourcePlanId?:string;
 sourceOccasionCost?:Expense["sourceOccasionCost"];
};
const validAmount=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100000&&
 Math.abs(n*100-Math.round(n*100))<0.00001;
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 !Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
export function recordConfirmedExpense(state:MoneyState,input:PaidExpenseInput,cashMode:CashTreatment):MoneyState{
 if(state.demo||!input.id.trim()||input.id.length>150||!dateOk(input.date)||
  !validAmount(input.amount)||input.note!==undefined&&input.note.length>160||
  input.plannedAmount!==undefined&&!validAmount(input.plannedAmount)||
  input.sourceOccasionCost!==undefined&&!input.sourcePlanId||
  input.billId!==undefined&&(!input.dueDate||!dateOk(input.dueDate))||
  !["already","deduct","untracked"].includes(cashMode))return state;
 const categoryId=input.categoryId||"uncategorized";
 if(categoryId!=="uncategorized"&&!state.categories.some(c=>c.id===categoryId))return state;
 if(state.expenses.some(e=>e.id===input.id||
   input.billId!==undefined&&e.billId===input.billId&&e.dueDate===input.dueDate||
   input.sourcePlanId!==undefined&&e.sourcePlanId===input.sourcePlanId&&
    (input.sourceOccasionCost===undefined||e.sourceOccasionCost===undefined||
     e.sourceOccasionCost===input.sourceOccasionCost)))return state;
 if(cashMode==="deduct"&&(state.cashOnHand==null||
  !Number.isFinite(state.cashOnHand)||state.cashOnHand<input.amount))return state;
 const expense:Expense={
  id:input.id,date:input.date,categoryId,amount:roundJod(input.amount),
  status:"paid",shared:input.shared??false,cashDeducted:cashMode==="deduct",
  ...(input.note?{note:input.note.trim()}:{}),
  ...(input.plannedAmount!==undefined?{plannedAmount:roundJod(input.plannedAmount)}:{}),
  ...(input.billId?{billId:input.billId,dueDate:input.dueDate}:{}),
  ...(input.sourcePlanId?{sourcePlanId:input.sourcePlanId}:{}),
  ...(input.sourceOccasionCost?{sourceOccasionCost:input.sourceOccasionCost}:{})
 };
 return {...state,expenses:[expense,...state.expenses],
  ...(state.categories.length===0?{financialInputsPartial:true}:{}),
  ...(cashMode==="deduct"?{cashOnHand:roundJod(state.cashOnHand!-expense.amount),cashUpdatedAt:input.date}:{})};
}
