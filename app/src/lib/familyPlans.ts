import type {MoneyState} from "./money";
import {getMoneyOverview} from "./moneyOverview";

/** One local-only Plan record shared by Money, Discover, Today and Family.
 * A planned budget never automatically becomes cash, a bill or an expense. */
export const FAMILY_PLANS_KEY="familyPlans";
export const ACTIVE_PLAN_KEY="activeFamilyPlanId";
export type PlanKind="purchase"|"outing"|"occasion"|"other";
export type PlanStatus="planning"|"decided"|"completed";
export type OccasionCost={amountJod:number;dueDate:string};
export type OccasionPreparation={
 gift:OccasionCost&{description:string};
 celebration:OccasionCost;
 extras:OccasionCost;
};
/** Costs and dates belong to the existing plan. No second occasion record,
 * automated savings transfer, bill or paid expense is created. */
export type FamilyPlan={
 id:string;title:string;kind:PlanKind;status:PlanStatus;
 createdAt:string;updatedAt:string;date?:string;budgetJod?:number;
 choice?:{label:string;estimatedJod?:number;source:"comparison"|"outing"|"occasion"|"manual";verified?:boolean};
 actualJod?:number;completedAt?:string;expenseId?:string;note?:string;
 sourceRef?:string;
 /** Optional link to a named Money savings goal; linking never spends money. */
 savingsGoalId?:string;
 occasionPreparation?:OccasionPreparation;
};
const value=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100000;
const dateOk=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T12:00:00"));
export const moneyAmount=(input:string):number|null=>{
 if(input.trim()==="")return null;
 const n=Number(input);
 return value(n)?Math.round(n*100)/100:null;
};
export const planDate=(v:string):string|undefined=>v===""?undefined:dateOk(v)?v:undefined;
export function makeFamilyPlan(input:{id:string;title:string;kind:PlanKind;date?:string;budgetJod?:number;note?:string;sourceRef?:string},now=new Date()):FamilyPlan|null{
 const title=input.title.trim().slice(0,100);
 if(!title||!input.id.trim()||!["purchase","outing","occasion","other"].includes(input.kind))return null;
 if(input.budgetJod!==undefined&&!value(input.budgetJod))return null;
 if(input.date!==undefined&&!dateOk(input.date))return null;
 const stamp=now.toISOString();
 return {id:input.id,title,kind:input.kind,status:"planning",createdAt:stamp,updatedAt:stamp,
  ...(input.date?{date:input.date}:{}),...(input.budgetJod!==undefined?{budgetJod:input.budgetJod}:{}),
  ...(input.note?.trim()?{note:input.note.trim().slice(0,240)}:{}),
  ...(input.sourceRef?{sourceRef:input.sourceRef}:{} )};
}
export function setPlanChoice(plan:FamilyPlan,choice:FamilyPlan["choice"],now=new Date()):FamilyPlan{
 if(!choice||!choice.label.trim()||(choice.estimatedJod!==undefined&&!value(choice.estimatedJod)))return plan;
 return {...plan,choice:{...choice,label:choice.label.trim().slice(0,120)},status:"decided",updatedAt:now.toISOString()};
}
export function markPlanComplete(plan:FamilyPlan,amount:number,now=new Date()):FamilyPlan{
 if(plan.status==="completed"||!value(amount))return plan;
 return {...plan,status:"completed",actualJod:amount,completedAt:now.toISOString(),updatedAt:now.toISOString()};
}
export function reviewPlanCost(plan:FamilyPlan,money:MoneyState,now=new Date()):{status:"demo"|"unknown"|"review"|"provisional";reason:string}{
 if(money.demo)return {status:"demo",reason:"Sample finances cannot assess affordability."};
 const r=getMoneyOverview(money,now);
 if(!r.cashSet||!r.hasBillSchedule||r.dateProblems>0||r.cashAfterBills===null)
  return {status:"unknown",reason:"Enter actual cash, unpaid bills and due dates before comparing."};
 const amount=plan.choice?.estimatedJod??plan.budgetJod;
 if(amount===undefined)return {status:"unknown",reason:"Set an estimated maximum amount to compare with recorded cash."};
 if(r.forecast.overdueCount>0||r.cashAfterBills<amount||r.forecast.minimumBalance!==null&&r.forecast.minimumBalance<0)
  return {status:"review",reason:"Bills, cash availability or an upcoming shortfall need review before committing."};
 return {status:"provisional",reason:"Recorded cash covers this estimate after scheduled bills and reserve; unrecorded everyday costs are not included."};
}
export function upcomingFamilyPlans(plans:FamilyPlan[],now=new Date(),limit=3):FamilyPlan[]{
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 return plans.filter(p=>p.status!=="completed").sort((a,b)=>{
  const da=a.date&&a.date>=today?a.date:"9999-12-31";
  const db=b.date&&b.date>=today?b.date:"9999-12-31";
  return da.localeCompare(db)||b.updatedAt.localeCompare(a.updatedAt);
 }).slice(0,limit);
}
