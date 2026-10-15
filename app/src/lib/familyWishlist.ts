import {parseCalendarDate} from "./familyCalendar";
import {validatePublicServiceLink} from "./serviceShortlist";
export const FAMILY_WISHLIST_KEY="familyWishlist";
export type WishlistKind="gift"|"household"|"children"|"other";
export type RecordedPrice={id:string;amountJod:number;checkedAt:string;store:string;sourceUrl?:string};
export type WishlistItem={
 id:string;name:string;kind:WishlistKind;status:"considering"|"purchased"|"removed";
 createdAt:string;updatedAt:string;targetDate?:string;budgetJod?:number;
 recipientLabel?:string;note?:string;repeatMonths?:1|3|6|12;
 /** The original chosen due date; keeps 29th/30th/31st cycles from drifting. */
 repeatAnchorDate?:string;
 /** Parent-confirmed date only; no verified retailer transaction or expense. */
 lastPurchasedOn?:string;
 prices:RecordedPrice[];
};
const clean=(s:string,max:number)=>s.trim().replace(/[\u0000-\u001f\u007f]/g," ")
 .replace(/\s+/g," ").slice(0,max).trim();
const amount=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100000&&
 Math.abs(n*100-Math.round(n*100))<0.00001;
const today=(now:Date)=>[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
export function makeWishlistItem(input:{
 id:string;name:string;kind:WishlistKind;targetDate?:string;
 budgetJod?:number;recipientLabel?:string;note?:string;repeatMonths?:1|3|6|12
},now=new Date()):WishlistItem|null {
 const name=clean(input.name,120);
 if(!input.id||input.id.length>130||name.length<2||
    !["gift","household","children","other"].includes(input.kind)||
    input.targetDate&&(!parseCalendarDate(input.targetDate)||input.targetDate<today(now))||
    input.budgetJod!==undefined&&!amount(input.budgetJod)||
    input.repeatMonths!==undefined&&(![1,3,6,12].includes(input.repeatMonths)||!input.targetDate))return null;
 return {id:input.id,name,kind:input.kind,status:"considering",
  createdAt:now.toISOString(),updatedAt:now.toISOString(),prices:[],
  ...(input.targetDate?{targetDate:input.targetDate}:{}),
  ...(input.budgetJod!==undefined?{budgetJod:input.budgetJod}:{}),
  ...(input.recipientLabel?.trim()?{recipientLabel:clean(input.recipientLabel,60)}:{}),
  ...(input.note?.trim()?{note:clean(input.note,240)}:{}),
  ...(input.repeatMonths?{repeatMonths:input.repeatMonths,repeatAnchorDate:input.targetDate}:{})};
}
export function recordWishlistPrice(item:WishlistItem,input:{
 id:string;amountJod:number;checkedAt:string;store:string;sourceUrl?:string
},now=new Date()):WishlistItem{
 if(item.status!=="considering")throw new Error("Only active wishlist entries accept price checks");
 if(item.prices.length>=24)throw new Error("Maximum 24 manual price checks per entry");
 if(!input.id||input.id.length>130||item.prices.some(p=>p.id===input.id))
  throw new Error("Duplicate or invalid price record");
 if(!amount(input.amountJod)||input.amountJod<=0)
  throw new Error("Enter a valid positive JOD price with two decimals");
 if(!parseCalendarDate(input.checkedAt)||input.checkedAt>today(now))
  throw new Error("Enter a valid date when you personally checked the price");
 const store=clean(input.store,90);
 if(store.length<2)throw new Error("Enter a store or information source name");
 const url=input.sourceUrl?.trim()?validatePublicServiceLink(input.sourceUrl):null;
 if(input.sourceUrl?.trim()&&!url)throw new Error("Only public HTTPS sources are accepted");
 return {...item,updatedAt:now.toISOString(),prices:[...item.prices,{
  id:input.id,amountJod:input.amountJod,checkedAt:input.checkedAt,store,
  ...(url?{sourceUrl:url}:{})
 }]};
}
export function summarizeWishlistPrice(item:WishlistItem):{
 latest:RecordedPrice|null;earliest:RecordedPrice|null;changeJod:number|null;
 lowestRecordedJod:number|null
}{
 const ranked=[...item.prices].sort((a,b)=>a.checkedAt.localeCompare(b.checkedAt)||a.id.localeCompare(b.id));
 const earliest=ranked[0]??null,latest=ranked[ranked.length-1]??null;
 return {earliest,latest,changeJod:earliest&&latest&&ranked.length>=2?
  Math.round((latest.amountJod-earliest.amountJod)*100)/100:null,
  lowestRecordedJod:ranked.length?Math.min(...ranked.map(p=>p.amountJod)):null};
}
export function updateWishlistStatus(item:WishlistItem,status:WishlistItem["status"],now=new Date()):WishlistItem{
 if(!["considering","purchased","removed"].includes(status))return item;
 return {...item,status,updatedAt:now.toISOString()};
}

/** Calendar-month recurrence anchored to the original target day.
 * Example: 31 January -> 28 February -> 31 March (never drifting to 28 March).
 * Handles legacy recurring records created before repeatAnchorDate was stored.
 */
export function nextRecurringWishlistDate(anchorDate:string,months:1|3|6|12,afterDate:string):string{
 if(!parseCalendarDate(anchorDate)||!parseCalendarDate(afterDate)||![1,3,6,12].includes(months))
  throw new Error("Invalid recurring purchase schedule");
 const [year,month,day]=anchorDate.split("-").map(Number);
 const offset=(Number(afterDate.slice(0,4))-year!)*12+
  (Number(afterDate.slice(5,7))-month!);
 const first=Math.max(1,Math.floor(offset/months));
 // Bound to the next interval without creating new wishlist rows.
 for(let i=first;i<=first+3;i++){
  const firstOfMonth=new Date(Date.UTC(year!,month!-1+i*months,1,12));
  const y=firstOfMonth.getUTCFullYear(),m=firstOfMonth.getUTCMonth();
  const maxDay=new Date(Date.UTC(y,m+1,0,12)).getUTCDate();
  const next=[String(y).padStart(4,"0"),String(m+1).padStart(2,"0"),
   String(Math.min(day!,maxDay)).padStart(2,"0")].join("-");
  if(next>afterDate)return next;
 }
 throw new Error("Could not calculate the next recurring date");
}
/** A parent confirms ONE household shopping cycle; the same record moves to
 * its next due date. No copies, merchant orders, debits or "auto-delivery".
 * Double confirmation for the same date is refused explicitly.
 */
export function confirmRecurringPurchase(item:WishlistItem,now=new Date()):WishlistItem{
 if(item.status!=="considering"||!item.repeatMonths||!item.targetDate)
  throw new Error("This is not an active repeating wishlist item");
 const purchasedOn=today(now);
 if(item.lastPurchasedOn===purchasedOn)throw new Error("Already marked purchased today");
 if(!parseCalendarDate(item.targetDate))throw new Error("Invalid repeating target date");
 const anchor=item.repeatAnchorDate??item.targetDate;
 if(!parseCalendarDate(anchor))throw new Error("Invalid recurring schedule anchor");
 const nextDate=nextRecurringWishlistDate(anchor,item.repeatMonths,
  purchasedOn>item.targetDate?purchasedOn:item.targetDate);
 return {...item,targetDate:nextDate,repeatAnchorDate:anchor,lastPurchasedOn:purchasedOn,
  updatedAt:now.toISOString()};
}
