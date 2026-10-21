import type {MoneyState} from "./money";
import {roundJod} from "./cashflow";

/** Parent-confirmed, device-local exception for ONE calendar month, rather
 * than a second budget, bill, expense or repeated annual rule. Default is the
 * existing category allowance. No guessed seasonal increases are committed.
 */
const ym=/^\d{4}-(0[1-9]|1[0-2])$/;
const cents=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100000&&
 Math.abs(n*100-Math.round(n*100))<=.000001;

export function validMoneyMonth(month:string):boolean{return ym.test(month);}
export function confirmedMonthPlan(state:MoneyState,categoryId:string,month:string):number|null{
 const n=state.categoryMonthlyPlans?.[month]?.[categoryId];
 return validMoneyMonth(month)&&cents(n)?n:null;
}
export function effectiveCategoryAllowance(state:MoneyState,categoryId:string,month:string):number{
 const category=state.categories.find(x=>x.id===categoryId);
 if(!category)return 0;
 const base=confirmedMonthPlan(state,categoryId,month)??category.planned;
 const variance=state.monthlyAdjustments?.[month]?.categoryDeltas[categoryId]??0;
 return roundJod(Math.max(0,base+(Number.isFinite(variance)?variance:0)));
}
export function withConfirmedMonthPlan(state:MoneyState,categoryId:string,month:string,amount:number):MoneyState|null{
 if(state.demo||!validMoneyMonth(month)||!cents(amount)||
   !state.categories.some(c=>c.id===categoryId))return null;
 return {...state,categoryMonthlyPlans:{
  ...(state.categoryMonthlyPlans??{}),
  [month]:{...(state.categoryMonthlyPlans?.[month]??{}),[categoryId]:roundJod(amount)}
 }};
}
export function withoutConfirmedMonthPlan(state:MoneyState,categoryId:string,month:string):MoneyState{
 if(!state.categoryMonthlyPlans?.[month]||!(categoryId in state.categoryMonthlyPlans[month]!))return state;
 const row={...state.categoryMonthlyPlans[month]};
 delete row[categoryId];
 const next={...state.categoryMonthlyPlans};
 if(Object.keys(row).length)next[month]=row;else delete next[month];
 if(!Object.keys(next).length){const copy={...state};delete copy.categoryMonthlyPlans;return copy;}
 return {...state,categoryMonthlyPlans:next};
}
/** A plan change is a stored *approval*, never an automatically learned pattern.
 * This enumerates categories with parent-entered adjustments in a date window.
 */
export function confirmedAdjustmentsInWindow(state:MoneyState,from:string,to:string){
 return Object.entries(state.categoryMonthlyPlans??{})
  .filter(([month])=>validMoneyMonth(month)&&month+"-31">=from&&month+"-01"<=to)
  .flatMap(([month,row])=>Object.keys(row).filter(id=>confirmedMonthPlan(state,id,month)!==null&&
    state.categories.some(c=>c.id===id)).map(id=>({month,categoryId:id,amount:confirmedMonthPlan(state,id,month)!})));
}
