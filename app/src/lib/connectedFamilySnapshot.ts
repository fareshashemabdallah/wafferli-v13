import type {SharedExpenseRow} from "./expenseSharing";
import {validSharedExpenseRow} from "./expenseSharing";

/** Read-only household view of *explicitly published* expenses.
 * Never includes or merges anybody's local Money ledger, private income or
 * savings. All adults see the same household total for a calendar month,
 * regardless of each adult's personal salary payday.
 */
export type SharedCategoryTotal={category:string;amountFils:number;count:number};
export type ConnectedFamilySnapshot={
 month:string;householdId:string;totalFils:number;mineFils:number;
 otherAdultsFils:number;count:number;mineCount:number;otherAdultsCount:number;
 categories:SharedCategoryTotal[];limitedToRecentRecords:boolean;
};
const monthOk=(month:string)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(month);
const idOk=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

/** Reject invalid/cross-household records even when a service accidentally
 * delivers them. The endpoint itself MUST still enforce RLS. */
export function sharedFamilySnapshot(
 rows:readonly SharedExpenseRow[],householdId:string,viewerUserId:string,month:string
):ConnectedFamilySnapshot{
 const empty:ConnectedFamilySnapshot={month,householdId,totalFils:0,mineFils:0,
  otherAdultsFils:0,count:0,mineCount:0,otherAdultsCount:0,categories:[],
  limitedToRecentRecords:rows.length>=200};
 if(!monthOk(month)||!idOk(householdId)||!idOk(viewerUserId))return empty;
 const ids=new Set<string>(),sources=new Set<string>();
 const categories=new Map<string,SharedCategoryTotal>();
 let total=0,mine=0,other=0,mineCount=0,otherCount=0;
 for(const row of rows){
  if(!validSharedExpenseRow(row)||row.household_id!==householdId||
     !row.occurred_on.startsWith(month+"-")||ids.has(row.id))continue;
  // The backend enforces a unique consented source per author and household.
  // Preserve that idempotency in this read model as an additional safeguard.
  const source=row.created_by+":"+row.source_fingerprint;
  if(sources.has(source))continue;
  ids.add(row.id);sources.add(source);
  total+=row.amount_fils;
  if(row.created_by===viewerUserId){mine+=row.amount_fils;mineCount++;}
  else{other+=row.amount_fils;otherCount++;}
  const category=categories.get(row.category)??{category:row.category,amountFils:0,count:0};
  category.amountFils+=row.amount_fils;category.count++;
  categories.set(row.category,category);
 }
 return {month,householdId,totalFils:total,mineFils:mine,otherAdultsFils:other,
  count:mineCount+otherCount,mineCount,otherAdultsCount:otherCount,
  categories:[...categories.values()].sort((a,b)=>b.amountFils-a.amountFils||
   a.category.localeCompare(b.category)),limitedToRecentRecords:rows.length>=200};
}
/** Month labels remain independent of the parent's private reporting cycle. */
export function sharedFamilyMonths(now=new Date(),count=6):string[]{
 return Array.from({length:Math.max(1,Math.min(count,12))},(_,i)=>{
  const date=new Date(Date.UTC(now.getFullYear(),now.getMonth()-i,1));
  return date.toISOString().slice(0,7);
 });
}
