import {validateQuoteRequest,type QuoteRequestDraft} from "./merchantQuoteDraft";
import {setPlanChoice,type FamilyPlan} from "./familyPlans";

export type PrivateOffer={
 id:string; merchant:string; itemCostJod:number;
 deliveryJod:number; taxesJod:number;
 enteredAt:string; expiresOn:string;
 evidenceUrl?:string; note?:string;
 /** User-entered only: NEVER verified merchant offer or signed contract. */
};
export type PrivateQuote={
 id:string;createdAt:string;status:"draft"|"shared-by-user"|"closed";
 request:QuoteRequestDraft; offers:PrivateOffer[];
};
export const PRIVATE_QUOTES_KEY="privateQuoteRequests";
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const amount=(n:unknown,max=100000):n is number=>
 typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=max&&Math.abs(n*100-Math.round(n*100))<0.000001;
const day=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 (()=>{const d=new Date(v+"T12:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;})();
const today=(now:Date)=>[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
const unique=(xs:readonly {id:string}[])=>new Set(xs.map(x=>x.id)).size===xs.length;
/** This record is never transmitted or submitted to a merchant by Dabberna. */
export function makePrivateQuote(input:QuoteRequestDraft,id:string,now=new Date()):PrivateQuote{
 const validated=validateQuoteRequest({
  product:input.product,quantity:String(input.quantity),
  deliveryCity:input.deliveryCity,neededBy:input.neededBy,
  budget:input.budgetCeilingJod===undefined?"":String(input.budgetCeilingJod)
 },now);
 if(!validated.ok||!validated.draft||!id.trim()||id.length>120)throw new Error("Invalid quotation request");
 return {id,createdAt:now.toISOString(),status:"draft",request:validated.draft,offers:[]};
}
export function recordUserSharedRequest(quote:PrivateQuote):PrivateQuote{
 if(quote.status==="closed")throw new Error("Reopen is not supported");
 return {...quote,status:"shared-by-user"};
}
export function addEnteredOffer(quote:PrivateQuote,input:{
 id:string;merchant:string;itemCostJod:number;deliveryJod:number;taxesJod:number;
 expiresOn:string;note?:string;evidenceUrl?:string
},now=new Date()):PrivateQuote{
 if(quote.status==="closed")throw new Error("Closed request cannot accept offers");
 if(quote.offers.length>=20||quote.offers.some(o=>o.id===input.id)||!input.id||input.id.length>120)
  throw new Error("Offer limit or duplicate ID");
 const merchant=input.merchant.trim().slice(0,90);
 if(merchant.length<2)throw new Error("Name the merchant that provided this information");
 if(!amount(input.itemCostJod)||input.itemCostJod<=0||
    !amount(input.deliveryJod)||!amount(input.taxesJod))
  throw new Error("Enter nonnegative JOD costs with two decimal places");
 if(!day(input.expiresOn)||input.expiresOn<today(now))
  throw new Error("Offer expiry must be today or later");
 let evidenceUrl:string|undefined;
 if(input.evidenceUrl?.trim()){
  const link=input.evidenceUrl.trim();
  if(link.length>700)throw new Error("Evidence URL too long");
  let url:URL;
  try{url=new URL(link);}catch{throw new Error("Invalid evidence link");}
  if(url.protocol!=="https:"||url.username||url.password||!url.hostname||
    url.hostname==="localhost"||url.hostname.endsWith(".local")||
    /^127\./.test(url.hostname))
    throw new Error("Provide a public HTTPS evidence link");
  evidenceUrl=url.href;
 }
 const offer:PrivateOffer={
  id:input.id,merchant,itemCostJod:input.itemCostJod,
  deliveryJod:input.deliveryJod,taxesJod:input.taxesJod,
  enteredAt:now.toISOString(),expiresOn:input.expiresOn,
  ...(input.note?.trim()?{note:input.note.trim().slice(0,250)}:{}),
  ...(evidenceUrl?{evidenceUrl}:{})
 };
 return {...quote,offers:[...quote.offers,offer]};
}
export function offerTotalJod(offer:PrivateOffer):number{
 return round(offer.itemCostJod+offer.deliveryJod+offer.taxesJod);
}
export type OfferComparison={offer:PrivateOffer;totalJod:number;expired:boolean;withinCeiling:boolean|null};
export function compareEnteredOffers(quote:PrivateQuote,now=new Date()):OfferComparison[]{
 const todayKey=today(now),ceiling=quote.request.budgetCeilingJod;
 return quote.offers.map(o=>{
  const total=offerTotalJod(o);
  return {offer:o,totalJod:total,expired:o.expiresOn<todayKey,
   withinCeiling:ceiling===undefined?null:total<=ceiling};
 }).sort((a,b)=>Number(a.expired)-Number(b.expired)||a.totalJod-b.totalJod||
  a.offer.merchant.localeCompare(b.offer.merchant));
}
/** No claim of provider verification, savings, payments or delivery. */
export function privateQuoteSummary(quote:PrivateQuote):{activeCount:number;enteredCount:number;lowestActiveJod:number|null}{
 const ranked=compareEnteredOffers(quote);
 return {activeCount:ranked.filter(r=>!r.expired).length,enteredCount:ranked.length,
  lowestActiveJod:ranked.find(r=>!r.expired)?.totalJod??null};
}

/** An explicitly chosen MANUAL quotation becomes a Plan estimate only.
 * It NEVER means provider verification, reservation, order or payment.
 * Expired quotes and completed plans are not eligible.
 */
export function chooseEnteredOfferForPlan(
 quote:PrivateQuote,offerId:string,plan:FamilyPlan,now=new Date()
):FamilyPlan{
 if(quote.status==="closed"||plan.kind!=="purchase"||plan.status==="completed")
  throw new Error("Choose an active purchase plan and open quote request");
 const offer=quote.offers.find(o=>o.id===offerId);
 if(!offer||!day(offer.expiresOn)||offer.expiresOn<today(now))
  throw new Error("This manually entered offer is missing or expired");
 if(!amount(offer.itemCostJod)||!amount(offer.deliveryJod)||
    !amount(offer.taxesJod))throw new Error("Invalid stored JOD costs");
 const total=offerTotalJod(offer);
 if(!Number.isFinite(total)||total<=0||total>100000)
  throw new Error("Offer total is outside supported planning limits");
 const label=quote.request.product.slice(0,65)+" · "+offer.merchant.slice(0,45);
 return setPlanChoice(plan,{label,estimatedJod:total,source:"comparison",verified:false},now);
}
