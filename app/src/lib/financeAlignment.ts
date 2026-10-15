import {roundJod} from "./cashflow";
import {computeMoney,type Expense,type MoneyState} from "./money";

export type AllocationChoice={kind:"variable"|"savings";categoryId?:string};
export type Alignment={income:number;savings:number;categories:number;gap:number;status:"balanced"|"deficit"|"surplus"|"incomplete"};
const valid=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
export const plannedSavings=(state:MoneyState):number=>roundJod(computeMoney(state).savingsTarget);
export function budgetAlignment(state:MoneyState):Alignment{
 const m=computeMoney(state),income=roundJod(m.monthlyIncome),savings=roundJod(m.savingsTarget),categories=roundJod(m.planned);
 const gap=roundJod(income-savings-categories);
 const incomplete=state.demo||income<=0||state.categories.length===0;
 return {income,savings,categories,gap,status:incomplete?"incomplete":Math.abs(gap)<.005?"balanced":gap<0?"deficit":"surplus"};
}
export function varianceOf(expense:Expense):number{
 return expense.status==="planned"||!valid(expense.plannedAmount)||!!expense.allocation?0:roundJod(expense.amount-expense.plannedAmount);
}
export function allocationOptions(state:MoneyState,delta:number,expenseCategory?:string):AllocationChoice[]{
 if(Math.abs(delta)<.005||state.demo)return [];
 const actual=computeMoney(state),abs=roundJod(Math.abs(delta));
 const variable=state.categories.filter(c=>c.type==="variable"&&c.id!==expenseCategory&&
  (delta>0?roundJod(c.planned-actual.spentBy(c.id))>=abs:true)).map(c=>({kind:"variable" as const,categoryId:c.id}));
 const canSave=delta>0?plannedSavings(state)>=abs:true;
 return [...variable,...(canSave?[{kind:"savings" as const}]:[])];
}
export function applyVarianceAllocation(state:MoneyState,expenseId:string,choice:AllocationChoice,now:string):MoneyState{
 const e=state.expenses.find(x=>x.id===expenseId);
 if(!e||state.demo||!valid(e.plannedAmount)||e.status==="planned"||e.allocation)return state;
 const delta=varianceOf(e),amount=roundJod(Math.abs(delta));
 if(amount===0)return state;
 if(!allocationOptions(state,delta,e.categoryId).some(x=>x.kind===choice.kind&&x.categoryId===choice.categoryId))return state;
 // Category targets are whole-month envelopes, not bill due amounts. The bill's baseline
 // remains unchanged for future recurrence; only this month's category allocation shifts.
 const direction=delta>0?1:-1;
 const next=state.categories.map(c=>{
  if(c.id===e.categoryId)return {...c,planned:roundJod(c.planned+delta)};
  if(choice.kind==="variable"&&c.id===choice.categoryId)return {...c,planned:roundJod(c.planned-delta)};
  return c;
 });
 // An underspend cannot reduce a category below actual spend already logged there.
 const actual=computeMoney(state);
 if(next.some(c=>c.planned<0||(delta<0&&c.id===e.categoryId&&c.planned+0.005<actual.spentBy(c.id))))return state;
 const goal=roundJod(plannedSavings(state)-delta);
 if(choice.kind==="savings"&&(goal<0||goal>actual.monthlyIncome))return state;
 return {...state,categories:next,
  ...(choice.kind==="savings"?{savingsTargetAmount:goal}:{}),
  expenses:state.expenses.map(x=>x.id===expenseId?{...x,allocation:{...choice,delta,approvedAt:now}}:x)};
}
export function applyAlignmentSuggestion(state:MoneyState,choice:AllocationChoice):MoneyState{
 const a=budgetAlignment(state);
 if(a.status==="incomplete"||a.status==="balanced")return state;
 const delta=roundJod(a.gap);
 const amount=roundJod(Math.abs(delta));
 const actual=computeMoney(state);
 if(choice.kind==="savings"){
  const next=roundJod(plannedSavings(state)+delta);
  if(next<0||next>actual.monthlyIncome)return state;
  return {...state,savingsTargetAmount:next};
 }
 const target=state.categories.find(c=>c.id===choice.categoryId&&c.type==="variable");
 if(!target)return state;
 const updated=roundJod(target.planned+delta);
 if(updated<0||updated+0.005<actual.spentBy(target.id))return state;
 return {...state,categories:state.categories.map(c=>c.id===target.id?{...c,planned:updated}:c)};
}
/** Undo the budget transfer before modifying or deleting a confirmed expense. */
export function reverseVarianceAllocation(state:MoneyState,expenseId:string):MoneyState{
 const e=state.expenses.find(x=>x.id===expenseId);
 if(!e?.allocation)return state;
 const {kind,categoryId,delta}=e.allocation;
 const cats=state.categories.map(c=>{
  if(c.id===e.categoryId)return {...c,planned:roundJod(c.planned-delta)};
  if(kind==="variable"&&c.id===categoryId)return {...c,planned:roundJod(c.planned+delta)};
  return c;
 });
 const nextGoal=roundJod(plannedSavings(state)+delta);
 if(cats.some(c=>c.planned<-.005)||kind==="savings"&&(nextGoal<0||nextGoal>computeMoney(state).monthlyIncome))return state;
 return {...state,categories:cats,
   ...(kind==="savings"?{savingsTargetAmount:nextGoal}:{}),
   expenses:state.expenses.map(x=>x.id===expenseId?({...x,allocation:undefined}):x)};
}
