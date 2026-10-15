import {computeMoney,type MoneyState} from "./money";
import {dateKey,parseCalendarDate} from "./familyCalendar";
/** A voluntary parent review of entered monthly expenses, not a verification
 * that every real-world transaction has been recorded.
 * No cloud sync and never a bank reconciliation.
 */
export const MONTH_REVIEW_KEY="moneyMonthReviews";
export type MonthReview={
 month:string;reviewedAt:string;revision:string;
 paidCount:number;enteredSpendJod:number;
 /** Current planned envelope captured when the user clicked Review; it is
  * NEVER automatically reconstructed as a historical original budget.
  */
 capturedPlanJod:number;
};
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const validMonth=(m:string)=>/^\d{4}-\d{2}$/.test(m)&&!!parseCalendarDate(m+"-01");
const validAmount=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1e9;
function entries(state:MoneyState,month:string){
 return state.expenses.filter(e=>e.date.startsWith(month)&&e.status!=="planned"&&
  validAmount(e.amount)).map(e=>({
   id:e.id,date:e.date,categoryId:e.categoryId,amount:e.amount,status:e.status??"paid",
   shared:e.shared,billId:e.billId??"",sourcePlanId:e.sourcePlanId??""
 })).sort((a,b)=>a.id.localeCompare(b.id)||a.date.localeCompare(b.date));
}
/** Noncryptographic change detector only. This is not an integrity signature or
 * privacy/security authentication and may collide.
 */
export function reviewRevision(state:MoneyState,month:string):string{
 if(!validMonth(month))throw new Error("Invalid month");
 const source=JSON.stringify(entries(state,month));
 let hash=0xcbf29ce484222325n;
 for(let i=0;i<source.length;i++){
  hash=BigInt.asUintN(64,(hash^BigInt(source.charCodeAt(i)))*0x100000001b3n);
 }
 return hash.toString(16).padStart(16,"0");
}
export function captureSpendingReview(state:MoneyState,month:string,now=new Date()):MonthReview{
 if(state.demo)throw new Error("Sample finances cannot be reviewed as real spending");
 const currentMonth=dateKey(now).slice(0,7);
 if(!validMonth(month)||month>=currentMonth)throw new Error("Only past calendar months may be reviewed");
 const first=new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-1,15,12);
 const paid=entries(state,month);
 return {month,reviewedAt:now.toISOString(),revision:reviewRevision(state,month),
  paidCount:paid.length,
  enteredSpendJod:round(paid.reduce((s,e)=>s+e.amount,0)),
  capturedPlanJod:round(Math.max(0,computeMoney(state,first).planned))};
}
export function reviewState(state:MoneyState,month:string,reviews:readonly MonthReview[]):"unreviewed"|"changed"|"reviewed"{
 if(!validMonth(month)||state.demo)return "unreviewed";
 const found=reviews.find(r=>r.month===month);
 if(!found)return "unreviewed";
 return found.revision===reviewRevision(state,month)?"reviewed":"changed";
}
export function reviewedBaselineMonths(state:MoneyState,reviews:readonly MonthReview[],now=new Date()):Set<string>{
 const current=dateKey(now).slice(0,7);
 return new Set(reviews.filter(r=>r.month<current&&reviewState(state,r.month,reviews)==="reviewed")
  .map(r=>r.month));
}
