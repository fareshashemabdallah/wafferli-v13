import type {MoneyState} from "./money";
import {roundJod} from "./cashflow";
import {spendingBreakdown,type SpendingRole} from "./spendingGroups";

/** Read-only presentation of the SAME monthly category and expense-line
 * ledger as Money. No new income, budget, bill or transaction records.
 *
 * A positive unused allowance within an itemized category is a cushion,
 * not an unclassified cost; negative monthly overrides remain adjustments.
 */
export function spendingMixSummary(state:MoneyState,month:string){
 const view=spendingBreakdown(state,month);
 const groups=view.groups.map(g=>({
  ...g,
  protectedCount:g.lines.filter(line=>line.priority==="protected"||
   state.categories.some(c=>c.id===line.categoryId&&c.priority==="protected")).length
 }));
 const positive=(n:number)=>roundJod(Math.max(0,n));
 const classified=roundJod(groups.reduce((n,g)=>n+g.planned,0));
 const cushion=roundJod(view.unassigned.filter(x=>x.kind==="cushion").reduce((n,x)=>n+positive(x.planned),0));
 const unclassified=roundJod(view.unassigned.filter(x=>x.kind==="unclassified").reduce((n,x)=>n+positive(x.planned),0));
 const adjustment=roundJod(view.unassigned.reduce((n,x)=>n+
  (x.kind==="adjustment"?x.planned:0),0));
 // The bar is an allocation of nonnegative planned components. If a
 // month-specific override is negative, show its separate reduction rather
 // than disguising it as another expense or a negative-width segment.
 const positiveBase=roundJod(classified+cushion+unclassified);
 const byRole=(role:SpendingRole)=>groups.find(g=>g.role===role)!;
 const segments=[
  {id:"committed",amount:byRole("committed").planned},
  {id:"necessary",amount:byRole("necessary").planned},
  {id:"flexible",amount:byRole("flexible").planned},
  {id:"cushion",amount:cushion},
  {id:"unclassified",amount:unclassified}
 ] as const;
 const suggestedCount=groups.reduce((n,g)=>n+g.lines.filter(x=>x.needsReview).length,0);
 const protectedCount=groups.reduce((n,g)=>n+g.protectedCount,0);
 return {
  ...view,groups,cushion,unclassified,adjustment,classified,positiveBase,segments,
  suggestedCount,protectedCount,
  reconciles:roundJod(positiveBase+adjustment-view.totalPlanned)===0,
  committed:byRole("committed").planned,
  necessary:byRole("necessary").planned,
  flexible:byRole("flexible").planned
 };
}
