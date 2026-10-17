import {roundJod,type Commitment} from "./cashflow";
import {dateKey,parseCalendarDate} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";
import {occasionKinds,type OccasionCostKind,occasionFunding} from "./occasionPreparation";
import type {Expense,MoneyState} from "./money";

/** The one source of truth is FamilyPlan. Derived family commitments NEVER get
 * copied into money.commitments, savingsGoals or planned Money expenses.
 * This prevents stale values when a parent edits or deletes the occasion.
 */
export type FamilyFinancialCommitment={
 id:string;planId:string;planTitle:string;kind:OccasionCostKind;label:string;
 amountJod:number;dueDate:string;paid:boolean;actualPaidJod:number|null;certainty:"idea"|"planned"|"firm";
};
const cents=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100000&&Math.abs(n*100-Math.round(n*100))<.00001;
export function familyFinancialCommitments(plans:readonly FamilyPlan[],money:MoneyState):FamilyFinancialCommitment[]{
 const rows:FamilyFinancialCommitment[]=[];
 for(const plan of plans){
  const costs=plan.occasionPreparation;
  if(plan.kind!=="occasion"||!costs)continue;
  for(const kind of occasionKinds){
   const entry=costs[kind];
   if(!entry||!cents(entry.amountJod)||entry.amountJod===0||!parseCalendarDate(entry.dueDate))continue;
   const payment=money.expenses.find(e=>e.sourcePlanId===plan.id&&e.sourceOccasionCost===kind&&e.status!=="planned");
   rows.push({
    id:"family-occasion:"+plan.id+":"+kind,planId:plan.id,planTitle:plan.title,
    kind,label:kind==="gift"?(costs.gift.description.trim()||"Gift"):kind==="celebration"?"Celebration":"Cake & extras",
    amountJod:entry.amountJod,dueDate:entry.dueDate,paid:!!payment,actualPaidJod:payment?.amount??null,certainty:entry.certainty??"planned"
   });
  }
 }
 return rows.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.planTitle.localeCompare(b.planTitle));
}
export function familyForecastCommitments(plans:readonly FamilyPlan[],money:MoneyState):Commitment[]{
 if(money.demo)return [];
 const existingIds=new Set((money.commitments??[]).map(x=>x.id));
 return familyFinancialCommitments(plans,money)
  .filter(x=>!x.paid&&x.certainty!=="idea"&&!existingIds.has(x.id))
  .map(x=>({id:x.id,name:x.planTitle+" · "+x.label,amount:x.amountJod,frequency:"once" as const,dueDate:x.dueDate}));
}
export type FamilyFinancialSummary={
 plannedTotalJod:number;paidTotalJod:number;upcomingTotalJod:number;possibleIdeasJod:number;
 monthlyPreparationJod:number;nextDeadline:string|null;
};
/** Monthly preparation is advice only, never a second due bill or transfer. */
export function familyFinancialSummary(plans:readonly FamilyPlan[],money:MoneyState,now=new Date()):FamilyFinancialSummary{
 const rows=familyFinancialCommitments(plans,money);
 const pending=rows.filter(x=>!x.paid&&x.certainty!=="idea");
 const potential=rows.filter(x=>!x.paid&&x.certainty==="idea");
 const pendingByPlan=new Map<string,Set<OccasionCostKind>>();
 for(const row of pending){
  const set=pendingByPlan.get(row.planId)??new Set<OccasionCostKind>();
  set.add(row.kind);pendingByPlan.set(row.planId,set);
 }
 let monthly=0;
 for(const plan of plans){
  const keep=pendingByPlan.get(plan.id);
  if(!keep||!plan.occasionPreparation)continue;
  const cost=plan.occasionPreparation;
  // The same payment schedule as the Calendar editor; no extra envelope.
  const normalized={gift:{...cost.gift,amountJod:keep.has("gift")?cost.gift.amountJod:0},
   celebration:{...cost.celebration,amountJod:keep.has("celebration")?cost.celebration.amountJod:0},
   extras:{...cost.extras,amountJod:keep.has("extras")?cost.extras.amountJod:0}};
  monthly+=occasionFunding(normalized,now).monthlyJod;
 }
 return {plannedTotalJod:roundJod(rows.reduce((a,x)=>a+x.amountJod,0)),
  paidTotalJod:roundJod(rows.filter(x=>x.paid).reduce((a,x)=>a+(x.actualPaidJod??0),0)),
  upcomingTotalJod:roundJod(pending.reduce((a,x)=>a+x.amountJod,0)),
  possibleIdeasJod:roundJod(potential.reduce((a,x)=>a+x.amountJod,0)),
  monthlyPreparationJod:roundJod(monthly),
  nextDeadline:pending.map(x=>x.dueDate).sort()[0]??null};
}
/** A parent must explicitly confirm an actual payment and choose a valid
 * category. Actual expenses are exactly once; cash isn't auto-deducted.
 */
export function recordFamilyCommitmentPayment(
 money:MoneyState,entry:FamilyFinancialCommitment,actual:number,categoryId:string,
 now=new Date()
):MoneyState|null{
 if(money.demo||!entry||entry.paid||!cents(actual)||actual<=0||
  !money.categories.some(c=>c.id===categoryId))return null;
 if(money.expenses.some(e=>e.sourcePlanId===entry.planId&&e.sourceOccasionCost===entry.kind))return null;
 const expense:Expense={
  id:"family-occasion-paid:"+entry.planId+":"+entry.kind,
  date:dateKey(now),categoryId,amount:roundJod(actual),plannedAmount:entry.amountJod,
  sourcePlanId:entry.planId,sourceOccasionCost:entry.kind,
  note:entry.planTitle+" · "+entry.label,shared:true,status:"paid"
 };
 if(money.expenses.some(e=>e.id===expense.id))return null;
 return {...money,expenses:[expense,...money.expenses]};
}
