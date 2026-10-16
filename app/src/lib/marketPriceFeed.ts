import {JORDAN_MARKET_SOURCES,safeMarketSearchTerm} from "./jordanMarketSources";

export type MarketPriceOffer={
 id:string;title:string;store:string;priceJod:number;url:string;
 sourceCheckedAt:string;deliveryJod:number|null;availability:"unknown"|"in_stock"|"out_of_stock"
};
export type MarketPriceSearchResult={
 status:"needs_query"|"not_configured"|"unavailable"|"ready";
 offers:MarketPriceOffer[];
 message:string
};
const trusted=new Set(JORDAN_MARKET_SOURCES.map(s=>s.domain));
const isTrustedUrl=(input:string):boolean=>{
 try{
  const u=new URL(input);
  return u.protocol==="https:"&&!u.username&&!u.password&&u.search.length<1500&&
   [...trusted].some(host=>u.hostname===host||u.hostname.endsWith("."+host));
 }catch{return false}
};
const asOffer=(x:unknown,now:Date):MarketPriceOffer|null=>{
 if(!x||typeof x!=="object")return null;
 const d=x as Record<string,unknown>;
 if(typeof d["id"]!=="string"||d["id"].length>90||!d["id"]||
  typeof d["title"]!=="string"||d["title"].trim().length<4||d["title"].length>160||
  typeof d["store"]!=="string"||d["store"].trim().length<2||d["store"].length>100||
  typeof d["url"]!=="string"||!isTrustedUrl(d["url"])||
  typeof d["priceJod"]!=="number"||!Number.isFinite(d["priceJod"])||
  d["priceJod"]<=0||d["priceJod"]>100000||
  Math.abs(d["priceJod"]*100-Math.round(d["priceJod"]*100))>.00001||
  typeof d["sourceCheckedAt"]!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(d["sourceCheckedAt"]))return null;
 const checked=new Date(d["sourceCheckedAt"]);
 if(!Number.isFinite(checked.getTime())||checked.getTime()>now.getTime()+60000||
  now.getTime()-checked.getTime()>7*86400000)return null;
 const shipping=d["deliveryJod"];
 if(shipping!==null&&shipping!==undefined&&
  (typeof shipping!=="number"||!Number.isFinite(shipping)||shipping<0||shipping>1000||
   Math.abs(shipping*100-Math.round(shipping*100))>.00001))return null;
 const availability=d["availability"];
 if(!["unknown","in_stock","out_of_stock"].includes(String(availability)))return null;
 return {id:d["id"],title:d["title"].trim(),store:d["store"].trim(),
  url:d["url"],priceJod:d["priceJod"],sourceCheckedAt:d["sourceCheckedAt"],
  deliveryJod:typeof shipping==="number"?shipping:null,
  availability:availability as MarketPriceOffer["availability"]};
};
/** Validates an authorized public retailer feed; prices do NOT imply stock,
 * comparable pack sizes or a verified purchase cost. One query only; no
 * household, child, budget, payment or browsing profile is transmitted.
 */
export function validateMarketFeed(raw:unknown,now=new Date()):MarketPriceOffer[]{
 if(!raw||typeof raw!=="object")return [];
 const data=raw as {offers?:unknown};
 if(!Array.isArray(data.offers)||data.offers.length>100)return [];
 const seen=new Set<string>();
 return data.offers.flatMap(x=>{
  const item=asOffer(x,now);
  if(!item||seen.has(item.id)||item.availability==="out_of_stock")return [];
  seen.add(item.id);return [item];
 }).slice(0,20);
}
export function marketFeedAvailable(endpoint:string|undefined):boolean{
 if(!endpoint)return false;
 try{
  const url=new URL(endpoint);
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.search&&!url.hash;
 }catch{return false}
}
export async function searchConfiguredMarketFeed(query:string,endpoint:string|undefined,
 signal?:AbortSignal):Promise<MarketPriceSearchResult>{
 const term=safeMarketSearchTerm(query);
 if(!term)return {status:"needs_query",offers:[],message:"Enter a product name only."};
 if(!marketFeedAvailable(endpoint))
  return {status:"not_configured",offers:[],message:"A licensed live price feed has not been connected yet."};
 try{
  const target=new URL(endpoint!);
  target.searchParams.set("q",term);
  target.searchParams.set("market","JO");
  const response=await fetch(target.href,{
   method:"GET",headers:{Accept:"application/json"},
   credentials:"omit",cache:"no-store",signal
  });
  if(!response.ok)return {status:"unavailable",offers:[],message:"The live price source is temporarily unavailable."};
  const data=await response.json() as unknown;
  return {status:"ready",offers:validateMarketFeed(data),
   message:"Prices from an external feed; check the seller's current listing and shipping before buying."};
 }catch{return {status:"unavailable",offers:[],message:"Live prices could not be loaded. Check the retailer links instead."};}
}
