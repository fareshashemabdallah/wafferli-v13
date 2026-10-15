/** Consumer-first request for quotation. This module generates a PRIVATE
 * draft and does not create a marketplace request or contact any merchant.
 * Do not include the parent's finances, contact details, children or location
 * coordinates in a generated brief without additional explicit consent.
 */
export type QuoteRequestDraft={
 product:string;
 quantity:number;
 deliveryCity:string;
 neededBy:string;
 budgetCeilingJod?:number;
};
export type RequestCheck={ok:boolean;error?:string;draft?:QuoteRequestDraft};
const today=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),
 String(d.getDate()).padStart(2,"0")].join("-");
const validDay=(d:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
 const parsed=new Date(d+"T12:00:00Z");
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===d;
};
const maxDay=(now:Date,days:number)=>today(new Date(now.getFullYear(),now.getMonth(),now.getDate()+days,12));
const protectText=(s:string,max:number)=>
 s.trim().replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").slice(0,max).trim();
export function validateQuoteRequest(data:{
 product:string;quantity:string;deliveryCity:string;neededBy:string;budget:string
},now=new Date()):RequestCheck{
 const product=protectText(data.product,100);
 const city=protectText(data.deliveryCity,70);
 const qty=Number(data.quantity.trim());
 const money=data.budget.trim();
 const budget=money?Number(money):undefined;
 if(product.length<3)return {ok:false,error:"Describe the product or service in at least 3 characters"};
 if(!Number.isSafeInteger(qty)||qty<1||qty>10000)
  return {ok:false,error:"Quantity must be a whole number from 1 to 10,000"};
 if(city.length<2)return {ok:false,error:"Enter a delivery city without a precise street address"};
 if(!validDay(data.neededBy)||data.neededBy<today(now)||data.neededBy>maxDay(now,90))
  return {ok:false,error:"Choose a real delivery date within the next 90 days"};
 if(budget!==undefined&&(!Number.isFinite(budget)||budget<=0||budget>100000||
    Math.abs(budget*100-Math.round(budget*100))>0.000001))
  return {ok:false,error:"Budget ceiling must be a valid JOD amount (2 decimals)"};
 return {ok:true,draft:{
  product,quantity:qty,deliveryCity:city,neededBy:data.neededBy,
  ...(budget!==undefined?{budgetCeilingJod:Math.round(budget*100)/100}:{})
 }};
}
export function formatPrivateQuoteBrief(draft:QuoteRequestDraft,language:"en"|"ar"="en"):string{
 const budget=draft.budgetCeilingJod!==undefined?
  draft.budgetCeilingJod.toFixed(2)+" JOD":null;
 if(language==="ar")return [
  "طلب عرض سعر — مسودة خاصة أعدّها المستخدم",
  "المنتج أو الخدمة: "+draft.product,
  "الكمية: "+draft.quantity,
  "مدينة التسليم: "+draft.deliveryCity,
  "موعد التسليم المطلوب: "+draft.neededBy,
  ...(budget?["السقف المفضّل للتكلفة الإجمالية: "+budget]:[]),
  "يرجى ذكر السعر الكامل، والتوصيل، والضرائب، والضمان، وصلاحية العرض.",
  "هذه مسودة فقط؛ لم يرسل تطبيق دبّرنا أي طلب إلى تاجر."
 ].join("\n");
 return [
  "REQUEST FOR QUOTATION — PRIVATE CUSTOMER DRAFT",
  "Product or service: "+draft.product,
  "Quantity: "+draft.quantity,
  "Delivery city: "+draft.deliveryCity,
  "Preferred delivery by: "+draft.neededBy,
  ...(budget?["Preferred maximum total cost: "+budget]:[]),
  "Please state the complete price, delivery, taxes, warranty and quote expiry.",
  "Dabberna has NOT sent this request to any merchant."
 ].join("\n");
}
/** A user-supplied HTTPS evidence URL is NOT independent price verification.
 * Dates are checked in the user's locale; stale entries remain review-needed.
 */
export function evaluatePriceEvidence(
 sourceUrl:string|undefined,checkedDate:string|undefined,customerChecked:boolean,
 now=new Date()
):{status:"unverified"|"review"|"recent";reasonEn:string;reasonAr:string;link:string|null}{
 const raw=sourceUrl?.trim()??"";
 let link:string|null=null;
 if(raw&&raw.length<=700){
  try{
   const url=new URL(raw);
   if(url.protocol==="https:"&&!url.username&&!url.password&&
      !["localhost","127.0.0.1"].includes(url.hostname)&&!url.hostname.endsWith(".local"))
    link=url.href;
  }catch{/* untrusted input */}
 }
 if(!customerChecked)return {status:"unverified",reasonEn:"Not checked by you",
  reasonAr:"لم تؤكد السعر بنفسك",link};
 if(!checkedDate||!validDay(checkedDate)||checkedDate>today(now))
  return {status:"review",reasonEn:"No valid price check date",reasonAr:"تاريخ التحقق غير صالح",link};
 const a=new Date(checkedDate+"T12:00:00Z");
 const b=new Date(today(now)+"T12:00:00Z");
 const days=Math.floor((b.getTime()-a.getTime())/86400000);
 if(days>7)return {status:"review",reasonEn:"Your price check is older than 7 days",
  reasonAr:"مرّ أكثر من ٧ أيام على التحقق من السعر",link};
 return {status:"recent",reasonEn:"You marked this price checked recently; not independently verified",
  reasonAr:"أكدتَ السعر خلال ٧ أيام، لكنه غير متحقق منه من جهة مستقلة",link};
}
