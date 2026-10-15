import type {MoneyState} from "./money";
/** Browser-local household/private LABEL ONLY. This does not grant
 * another authenticated user access or call the server's consented sharing RPC.
 */
export function changeLocalExpenseVisibility(state:MoneyState,expenseId:string,shared:boolean):MoneyState{
 if(state.demo)throw new Error("Do not change sample data privacy labels");
 if(!expenseId||typeof shared!=="boolean")throw new Error("Invalid privacy change");
 const original=state.expenses.find(e=>e.id===expenseId);
 if(!original)throw new Error("Expense not found");
 if(original.shared===shared)return state;
 return {...state,expenses:state.expenses.map(e=>e.id===expenseId?{...e,shared}:e)};
}
export function localExpenseVisibilitySummary(state:MoneyState):{
 sharedLabels:number;privateLabels:number;unrecorded:number
}{
 const valid=state.expenses.filter(e=>e.status!=="planned");
 return {sharedLabels:valid.filter(e=>e.shared).length,
  privateLabels:valid.filter(e=>!e.shared).length,
  unrecorded:state.demo?valid.length:0};
}
