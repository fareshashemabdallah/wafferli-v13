/** Family Finds private pilot: one canonical listing for selling, exchanging or sharing.
 * Device-only, no public ads, messaging, payments, matching or Money ledger writes. */
export const FAMILY_FINDS_KEY="familyFindsListings";
export const FAMILY_FINDS_WISHES_KEY="familyFindsWishes";
export type FindCategory="books"|"toys"|"games"|"clothes"|"bikes"|"sports"|"other";
export type FindCondition="like-new"|"good"|"loved";
export type FindAge="0-2"|"3-5"|"6-9"|"10-13"|"14+"|"all";
export type FindStatus="available"|"completed";
export type FindOffer="sell"|"swap"|"sell-swap"|"share";
export type FamilyFindListing={
 id:string;title:string;category:FindCategory;condition:FindCondition;age:FindAge;
 offer:FindOffer;priceJod?:number;wanted?:string;openOffers?:boolean;
 description:string;area:string;imageDataUrl?:string;
 status:FindStatus;createdAt:string;updatedAt:string;
};
export type FamilyFindWish={id:string;description:string;category:FindCategory;createdAt:string};
export type FindDraft={
 title:string;category:FindCategory;condition:FindCondition;age:FindAge;offer:FindOffer;
 price:string;wanted:string;openOffers:boolean;description:string;area:string;
 imageDataUrl?:string;
};
export const findCategories:readonly FindCategory[]=["books","toys","games","clothes","bikes","sports","other"];
export const findConditions:readonly FindCondition[]=["like-new","good","loved"];
export const findAges:readonly FindAge[]=["0-2","3-5","6-9","10-13","14+","all"];
export const findOffers:readonly FindOffer[]=["sell","swap","sell-swap","share"];
const has=<T extends string>(values:readonly T[],value:unknown):value is T=>typeof value==="string"&&values.includes(value as T);
const text=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
const cost=(input:string):number|null=>{
 if(!/^(?:0|[1-9]\d{0,4})(?:\.\d{1,2})?$/.test(input.trim()))return null;
 const n=Number(input);return n>0&&n<=100000?Math.round(n*100)/100:null;
};
export const blankFindDraft=():FindDraft=>({
 title:"",category:"books",condition:"good",age:"3-5",offer:"sell-swap",
 price:"",wanted:"",openOffers:true,description:"",area:"",});
export function readFindDraft(listing:FamilyFindListing):FindDraft{
 return {title:listing.title,category:listing.category,condition:listing.condition,
  age:listing.age,offer:listing.offer,price:listing.priceJod?.toString()??"",
  wanted:listing.wanted??"",openOffers:!!listing.openOffers,
  description:listing.description,area:listing.area,
  ...(listing.imageDataUrl?{imageDataUrl:listing.imageDataUrl}:{})};
}
/** Reject data URLs from unknown hosts/types and excessive stored photographs. */
export function safeFindImage(data:unknown):data is string{
 return typeof data==="string"&&data.length<=350000&&
  /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/]+={0,2}$/.test(data);
}
export function makeFindListing(draft:FindDraft,id:string,stamp:string,original?:FamilyFindListing):FamilyFindListing|null{
 const title=text(draft.title,80),description=text(draft.description,240),
  area=text(draft.area,45),wanted=text(draft.wanted,100);
 if(!id||!Number.isFinite(Date.parse(stamp))||title.length<3||
  !has(findCategories,draft.category)||!has(findConditions,draft.condition)||
  !has(findAges,draft.age)||!has(findOffers,draft.offer)||
  (draft.area.trim().length>45)||(/@|\d{5,}/.test(area)))return null;
 const selling=draft.offer==="sell"||draft.offer==="sell-swap";
 const swapping=draft.offer==="swap"||draft.offer==="sell-swap";
 const price=selling?cost(draft.price):null;
 if(selling&&price===null||swapping&&!wanted&&!draft.openOffers)return null;
 if(draft.imageDataUrl&&!safeFindImage(draft.imageDataUrl))return null;
 return {id,title,description,area,category:draft.category,condition:draft.condition,
  age:draft.age,offer:draft.offer,status:original?.status??"available",
  createdAt:original?.createdAt??stamp,updatedAt:stamp,
  ...(selling&&price!==null?{priceJod:price}:{}),
  ...(swapping?{wanted,openOffers:draft.openOffers}:{}),
  ...(draft.imageDataUrl?{imageDataUrl:draft.imageDataUrl}:{})};
}
export function addFindListing(items:readonly FamilyFindListing[],record:FamilyFindListing):FamilyFindListing[]{
 if(items.some(item=>item.id===record.id))return [...items];
 return [record,...items];
}
export function editFindListing(items:readonly FamilyFindListing[],record:FamilyFindListing):FamilyFindListing[]{
 return items.some(item=>item.id===record.id)?
  items.map(item=>item.id===record.id?record:item):[...items];
}
export function changeFindStatus(items:readonly FamilyFindListing[],id:string,status:FindStatus):FamilyFindListing[]{
 return items.map(item=>item.id===id?{...item,status,updatedAt:new Date().toISOString()}:item);
}
export function validateFindWish(input:{description:string;category:FindCategory},id:string,createdAt:string):FamilyFindWish|null{
 const description=text(input.description,90);
 if(!id||!has(findCategories,input.category)||description.length<3)return null;
 return {id,description,category:input.category,createdAt};
}
/** Only suggest potential matches using parent-entered wishes, not children's private profiles. */
export function findWishMatches(listings:readonly FamilyFindListing[],wishes:readonly FamilyFindWish[]):{
 listingId:string;wishId:string;reason:"category"|"keyword"
}[]{
 const matches:{listingId:string;wishId:string;reason:"category"|"keyword"}[]=[];
 for(const listing of listings.filter(x=>x.status==="available")){
  for(const wish of wishes){
   const tokens=wish.description.toLocaleLowerCase().split(/\s+/).filter(s=>s.length>3);
   const keyword=tokens.some(word=>(listing.title+" "+listing.description).toLocaleLowerCase().includes(word));
   if(wish.category===listing.category||keyword)
    matches.push({listingId:listing.id,wishId:wish.id,reason:keyword?"keyword":"category"});
  }
 }
 return matches;
}
