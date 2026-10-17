import {computeMoney,type MoneyState} from "./money";
import {dateKey,parseCalendarDate} from "./familyCalendar";
import {roundJod} from "./cashflow";
import type {OccasionPreparation,OccasionCost} from "./familyPlans";

export type OccasionCostKind="gift"|"celebration"|"extras";
export const occasionKinds:OccasionCostKind[]=["gift","celebration","extras"];
const jod=(amount:unknown):amount is number=>typeof amount==="number"&&Number.isFinite(amount)&&
 amount>=0&&amount<=100000&&Math.abs(amount*100-Math.round(amount*100))<0.00001;

export function initialOccasionPreparation(occasionDate:string):OccasionPreparation{
 const zero=():OccasionCost=>({amountJod:0,dueDate:occasionDate});
 return {gift:{...zero(),description:""},celebration:zero(),extras:zero()};
}
export function validateOccasionPreparation(value:OccasionPreparation,occasionDate:string):string|null{
 if(!parseCalendarDate(occasionDate))return "invalid-event-date";
 const total=occasionKinds.reduce((a,k)=>a+(value[k]?.amountJod??0),0);
 if(!jod(total))return "invalid-total";
 for(const kind of occasionKinds){
  const item=value[kind];
  if(!item||!jod(item.amountJod))return "invalid-amount";
  if(!parseCalendarDate(item.dueDate)||item.dueDate>occasionDate)return "invalid-deadline";
 }
 if(value.gift.description.length>100)return "invalid-description";
 return null;
}
export type OccasionFundingLine={kind:OccasionCostKind;amountJod:number;deadline:string;months:number;
 monthlyJod:number;daysLeft:number;overdue:boolean};
export type OccasionFunding={
 totalJod:number; monthlyJod:number;lineItems:OccasionFundingLine[]; overdueAmountJod:number;
 nextDueDate:string|null;
};
/** Budgeting periods are calendar months INCLUDING the current partial month.
 * They do not promise that a paycheck or transfer will occur before payment.
 */
export function occasionFunding(preparation:OccasionPreparation,now=new Date()):OccasionFunding{
 const today=dateKey(now);
 const todayMonth=now.getFullYear()*12+now.getMonth();
 const lines=occasionKinds.map(kind=>{
  const item=preparation[kind];
  const d=parseCalendarDate(item.dueDate);
  const months=d?Math.max(0,d.getFullYear()*12+d.getMonth()-todayMonth+1):0;
  const daysLeft=d?Math.round((d.getTime()-parseCalendarDate(today)!.getTime())/86400000):-1;
  return {kind,amountJod:item.amountJod,deadline:item.dueDate,months,daysLeft,
   monthlyJod:months>0?roundJod(item.amountJod/months):item.amountJod,
   overdue:item.dueDate<today};
 }).filter(item=>item.amountJod>0);
 return {totalJod:roundJod(lines.reduce((sum,x)=>sum+x.amountJod,0)),
  monthlyJod:roundJod(lines.reduce((sum,x)=>sum+x.monthlyJod,0)),
  overdueAmountJod:roundJod(lines.filter(x=>x.overdue).reduce((sum,x)=>sum+x.amountJod,0)),
  nextDueDate:lines.filter(x=>!x.overdue).map(x=>x.deadline).sort()[0]??null,
  lineItems:lines};
}
export type DiscretionaryHint={categoryId:string;categoryName:string;reviewJod:number;plannedJod:number};
export type OccasionBudgetAdvice={
 status:"demo"|"missing-plan"|"planned"|"pressure";
 monthlyUnallocatedJod:number|null;
 monthlyTargetJod:number;
 monthlyDifferenceJod:number|null;
 hints:DiscretionaryHint[];
 notCoveredJod:number|null;
};
/** Conservative *planning* information only. Never equate unused envelopes
 * with cash or assume bill schedules, debts or future income are verified.
 * Suggestions are ONLY candidates to review, not savings already achieved.
 */
const discretionary=/(restaurant|dining|eating out|cafe|coffee|takeaway|entertainment|leisure|hobby|hobbies|subscription|cinema|recreation|holiday|vacation|discretionary|مطاعم|مطعم|مقاه|قهوة|ترفيه|كمالي|سينما|اشتراكات|نزهات|طلعات)/i;
const essential=/(school|tuition|education|medical|health|medicine|grocery|groceries|supermarket|food|housing|rent|mortgage|electric|water|utilities|utility|transport|fuel|insurance|childcare|caregiver|مدرسة|تعليم|طب|صحة|دواء|بقالة|غذاء|طعام|إيجار|سكن|كهرباء|مياه|مواصلات|بنزين|تأمين|أطفال)/i;
export function occasionBudgetAdvice(preparation:OccasionPreparation,money:MoneyState,now=new Date()):OccasionBudgetAdvice{
 const monthlyTargetJod=occasionFunding(preparation,now).monthlyJod;
 const unknown={monthlyTargetJod,monthlyUnallocatedJod:null,monthlyDifferenceJod:null,hints:[],notCoveredJod:null};
 if(money.demo)return {status:"demo" as const,...unknown};
 if(!money.categories.length||money.income<=0&&!money.incomeSources?.length)
  return {status:"missing-plan" as const,...unknown};
 const summary=computeMoney(money,now);
 if(!Number.isFinite(summary.monthlyIncome)||summary.monthlyIncome<=0)
  return {status:"missing-plan" as const,...unknown};
 const free=roundJod(Math.max(0,summary.monthlyIncome-summary.savingsTarget-summary.planned));
 const difference=roundJod(Math.max(0,monthlyTargetJod-free));
 let remaining=difference;
 const hints:DiscretionaryHint[]=[];
 for(const cat of money.categories.filter(c=>c.type==="variable"&&discretionary.test(c.name)&&!essential.test(c.name))){
  const planned=summary.plannedBy(cat.id);
  if(planned<=0||remaining<=0)continue;
  const candidate=roundJod(Math.min(remaining,planned*0.2));
  if(candidate>0){hints.push({categoryId:cat.id,categoryName:cat.name,reviewJod:candidate,plannedJod:planned});remaining=roundJod(remaining-candidate);}
 }
 return {status:difference>0?"pressure":"planned",
  monthlyUnallocatedJod:free,monthlyTargetJod,monthlyDifferenceJod:difference,
  hints,notCoveredJod:remaining};
}
