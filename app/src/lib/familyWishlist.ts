import {parseCalendarDate} from "./familyCalendar";
import {validatePublicServiceLink} from "./serviceShortlist";
export const FAMILY_WISHLIST_KEY="familyWishlist";
export type WishlistKind="gift"|"household"|"children"|"other";
export type RecordedPrice={id:string;amountJod:number;checkedAt:string;store:string;sourceUrl?:string};
export type WishlistItem={
 id:string;name:string;kind:WishlistKind;status:"considering"|"purchased"|"removed";
 createdAt:string;updatedAt:string;targetDate?:string;budgetJod?:number;
 recipientLabel?:string;note?:string;repeatMonths?:1|3|6|12;
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
    input.repeatMonths!==undefined&&![1,3,6,12].includes(input.repeatMonths))return null;
 return {id:input.id,name,kind:input.kind,status:"considering",
  createdAt:now.toISOString(),updatedAt:now.toISOString(),prices:[],
  ...(input.targetDate?{targetDate:input.targetDate}:{}),
  ...(input.budgetJod!==undefined?{budgetJod:input.budgetJod}:{}),
  ...(input.recipientLabel?.trim()?{recipientLabel:clean(input.recipientLabel,60)}:{}),
  ...(input.note?.trim()?{note:clean(input.note,240)}:{}),
  ...(input.repeatMonths?{repeatMonths:input.repeatMonths}:{})};
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
