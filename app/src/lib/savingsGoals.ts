import type {MoneyState} from "./money";
export type SavingsGoal={id:string;name:string;targetJod:number;savedJod:number;monthlyJod:number;createdAt:string;updatedAt:string;dueDate?:string};
const valid=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1000000;
const money=(n:number)=>Math.round(n*100)/100;
export function createSavingsGoal(input:{id:string;name:string;targetJod:number;savedJod:number;monthlyJod:number;dueDate?:string},now=new Date()):SavingsGoal|null{
 const name=input.name.trim().slice(0,100);
 if(!input.id.trim()||!name||!valid(input.targetJod)||input.targetJod===0||!valid(input.savedJod)||!valid(input.monthlyJod))return null;
 if(input.dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate))return null;
 const stamp=now.toISOString();
 return {id:input.id,name,targetJod:money(input.targetJod),savedJod:money(input.savedJod),
  monthlyJod:money(input.monthlyJod),createdAt:stamp,updatedAt:stamp,
  ...(input.dueDate?{dueDate:input.dueDate}:{})};
}
export function goalSummary(moneyState:MoneyState){
 const goals=moneyState.savingsGoals??[];
 const income=moneyState.incomeSources===undefined?moneyState.income:undefined;
 const planned=money(goals.reduce((s,g)=>s+g.monthlyJod,0));
 const target=typeof moneyState.savingsTargetAmount==="number"&&valid(moneyState.savingsTargetAmount)?moneyState.savingsTargetAmount:null;
 return {count:goals.length,plannedMonthly:planned,explicitMonthlyTarget:target,
   difference:target===null?null:money(target-planned),
   totalSaved:money(goals.reduce((s,g)=>s+g.savedJod,0)),
   totalTarget:money(goals.reduce((s,g)=>s+g.targetJod,0)),
   hasLegacyIncome:income!==undefined};
}
export function updateGoalSaved(state:MoneyState,id:string,amount:number,now=new Date()):MoneyState{
 if(state.demo||!valid(amount))return state;
 const current=(state.savingsGoals??[]).find(g=>g.id===id);
 if(!current)return state;
 const value=money(amount);
 return {...state,savingsGoals:(state.savingsGoals??[]).map(g=>g.id===id?{...g,savedJod:value,updatedAt:now.toISOString()}:g)};
}
export function removeGoal(state:MoneyState,id:string):MoneyState{
 if(state.demo||!(state.savingsGoals??[]).some(g=>g.id===id))return state;
 return {...state,savingsGoals:(state.savingsGoals??[]).filter(g=>g.id!==id)};
}
