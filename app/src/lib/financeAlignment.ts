import {roundJod} from "./cashflow";
import {computeMoney,type Expense,type MoneyState} from "./money";

export type AllocationChoice={kind:"variable"|"savings";categoryId?:string};
export type Alignment={income:number;savings:number;categories:number;carryover:number;gap:number;status:"balanced"|"deficit"|"surplus"|"incomplete"};
const valid=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
const monthDate=(month:string)=>new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-1,15);
const monthKey=(d:Date)=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
export const plannedSavings=(s:MoneyState,month=monthKey(new Date())):number=>roundJod(computeMoney(s,monthDate(month)).savingsTarget);
export function budgetAlignment(state:MoneyState,now=new Date()):Alignment{
 const m=computeMoney(state,now),income=roundJod(m.monthlyIncome),savings=roundJod(m.savingsTarget),categories=roundJod(m.planned);
 const carryover=m.carryover.net,gap=roundJod(income+carryover-savings-categories),incomplete=state.demo||(income<=0&&!state.incomeKnown)||state.categories.length===0;
 return {income,savings,categories,carryover,gap,status:incomplete?"incomplete":Math.abs(gap)<.005?"balanced":gap<0?"deficit":"surplus"};
}
export function varianceOf(expense:Expense):number{
 return expense.status==="planned"||!valid(expense.plannedAmount)||!!expense.allocation?0:roundJod(expense.amount-expense.plannedAmount);
}
export function allocationOptions(state:MoneyState,delta:number,expenseCategory?:string,month=monthKey(new Date())):AllocationChoice[]{
 if(Math.abs(delta)<.005||state.demo||!state.categories.some(c=>c.id===expenseCategory))return [];
 const actual=computeMoney(state,monthDate(month)),source=state.categories.find(c=>c.id===expenseCategory)!;
 if(delta<0&&roundJod(actual.plannedBy(source.id)+delta)+.005<actual.spentBy(source.id))return [];
 const abs=roundJod(Math.abs(delta));
 const variable=state.categories.filter(c=>c.type==="variable"&&c.id!==expenseCategory&&
   (delta>0?roundJod(actual.plannedBy(c.id)-actual.spentBy(c.id))>=abs:true))
   .map(c=>({kind:"variable" as const,categoryId:c.id}));
 const savingsAfter=roundJod(plannedSavings(state,month)-delta);
 const canSave=savingsAfter>=0&&savingsAfter<=actual.monthlyIncome;
 return [...variable,...(canSave?[{kind:"savings" as const}]:[])];
}
export function applyVarianceAllocation(state:MoneyState,expenseId:string,choice:AllocationChoice,now:string):MoneyState{
 const e=state.expenses.find(x=>x.id===expenseId);
 if(!e||state.demo||!valid(e.plannedAmount)||e.status==="planned"||e.allocation||
   !state.categories.some(c=>c.id===e.categoryId))return state;
 const delta=varianceOf(e),ym=e.date.slice(0,7);
 if(!delta||!allocationOptions(state,delta,e.categoryId,ym).some(x=>x.kind===choice.kind&&x.categoryId===choice.categoryId))return state;
 const actual=computeMoney(state,monthDate(ym)),prev=state.monthlyAdjustments?.[ym]??{savingsDelta:0,categoryDeltas:{}};
 const categories={...prev.categoryDeltas,[e.categoryId]:roundJod((prev.categoryDeltas[e.categoryId]??0)+delta)};
 if(choice.kind==="variable"&&choice.categoryId)categories[choice.categoryId]=roundJod((categories[choice.categoryId]??0)-delta);
 const goal=roundJod(actual.savingsTarget-(choice.kind==="savings"?delta:0));
 if(goal<0||goal>actual.monthlyIncome||
  state.categories.some(c=>roundJod(c.planned+(categories[c.id]??0))<-.005))return state;
 return {...state,
  monthlyAdjustments:{...state.monthlyAdjustments,[ym]:{savingsDelta:roundJod(prev.savingsDelta-(choice.kind==="savings"?delta:0)),categoryDeltas:categories}},
  expenses:state.expenses.map(x=>x.id===expenseId?{...x,allocation:{...choice,delta,approvedAt:now}}:x)
 };
}
export function applyAlignmentSuggestion(state:MoneyState,choice:AllocationChoice,now=new Date()):MoneyState{
 const a=budgetAlignment(state,now);
 if(a.status==="incomplete"||a.status==="balanced")return state;
 const delta=roundJod(a.gap),actual=computeMoney(state,now);
 // One-off prior-month carryover must never rewrite the recurring savings goal
 // or the recurring category envelope for every future month.
 if(Math.abs(a.carryover)>=.005){
  const ym=monthKey(now);
  const prev=state.monthlyAdjustments?.[ym]??{savingsDelta:0,categoryDeltas:{}};
  if(choice.kind==="savings"){
   const target=roundJod(actual.savingsTarget+delta);
   if(target<0||target>actual.monthlyIncome+Math.max(0,a.carryover))return state;
   return {...state,monthlyAdjustments:{...state.monthlyAdjustments,[ym]:{
    ...prev,savingsDelta:roundJod(prev.savingsDelta+delta)
   }}};
  }
  const category=state.categories.find(c=>c.id===choice.categoryId&&c.type==="variable");
  if(!category)return state;
  const target=roundJod(actual.plannedBy(category.id)+delta);
  if(target<0||target+.005<actual.spentBy(category.id))return state;
  return {...state,monthlyAdjustments:{...state.monthlyAdjustments,[ym]:{
   ...prev,categoryDeltas:{...prev.categoryDeltas,[category.id]:roundJod((prev.categoryDeltas[category.id]??0)+delta)}
  }}};
 }
 if(choice.kind==="savings"){
  const base=typeof state.savingsTargetAmount==="number"?state.savingsTargetAmount:
    roundJod(actual.monthlyIncome*state.savingsPct/100);
  const next=roundJod(base+delta);
  if(next<0||roundJod(actual.savingsTarget+delta)>actual.monthlyIncome)return state;
  return {...state,savingsTargetAmount:next};
 }
 const target=state.categories.find(c=>c.id===choice.categoryId&&c.type==="variable");
 if(!target)return state;
 const updated=roundJod(target.planned+delta);
 if(updated<0||roundJod(actual.plannedBy(target.id)+delta)+.005<actual.spentBy(target.id))return state;
 return {...state,categories:state.categories.map(c=>c.id===target.id?{...c,planned:updated}:c)};
}
/** Reverses the approved one-time allocation before deleting or undoing a paid expense. */
export function reverseVarianceAllocation(state:MoneyState,expenseId:string):MoneyState{
 const e=state.expenses.find(x=>x.id===expenseId);
 if(!e?.allocation)return state;
 const {kind,categoryId,delta}=e.allocation,ym=e.date.slice(0,7),previous=state.monthlyAdjustments?.[ym];
 if(!previous)return state;
 const categories={...previous.categoryDeltas,[e.categoryId]:roundJod((previous.categoryDeltas[e.categoryId]??0)-delta)};
 if(kind==="variable"&&categoryId)categories[categoryId]=roundJod((categories[categoryId]??0)+delta);
 const saved=roundJod(previous.savingsDelta+(kind==="savings"?delta:0));
 const updated=state.expenses.map(x=>{
  if(x.id!==expenseId)return x;
  const {allocation:_allocation,...withoutAllocation}=x;
  return withoutAllocation;
 });
 return {...state,monthlyAdjustments:{...state.monthlyAdjustments,[ym]:{categoryDeltas:categories,savingsDelta:saved}},expenses:updated};
}
