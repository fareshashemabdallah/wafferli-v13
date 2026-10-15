/** Parent-entered, browser-only comparison notes. Absolutely no automatic
 * endorsement, health advice, provider credentials check or review scraping.
 */
export const SERVICE_SHORTLIST_KEY="privateServiceShortlist";
export type ServiceType="doctor"|"school"|"home"|"activities"|"gifts";
export type ServiceEntry={
 id:string;category:ServiceType;name:string;city:string;
 checkedAt:string;costJod?:number;sourceUrl?:string;
 parentFit?:1|2|3|4|5;
 childFriendly?:boolean;stepFreeAccess?:boolean;
 credentialsConfirmedByParent?:boolean; availabilityConfirmedByParent?:boolean;
 note?:string;
};
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 (()=>{const d=new Date(s+"T12:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;})();
const safe=(text:string,max:number)=>text.trim().replace(/[\u0000-\u001f\u007f]/g," ")
 .replace(/\s+/g," ").slice(0,max).trim();
export function validatePublicServiceLink(input:string):string|null{
 if(!input.trim())return null;
 try{
  if(input.length>700)return null;
  const url=new URL(input.trim());
  if(url.protocol!=="https:"||url.username||url.password||
     !url.hostname.includes(".")||url.hostname.endsWith(".local")||
     /^127\./.test(url.hostname))return null;
  return url.href;
 }catch{return null;}
}
export function makeServiceEntry(input:{
 id:string;category:ServiceType;name:string;city:string;checkedAt:string;
 costJod?:number;sourceUrl?:string;parentFit?:number;
 childFriendly?:boolean;stepFreeAccess?:boolean;
 credentialsConfirmedByParent?:boolean;availabilityConfirmedByParent?:boolean;
 note?:string
},now=new Date()):ServiceEntry{
 const name=safe(input.name,110),city=safe(input.city,75);
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 if(!input.id||input.id.length>120||
    !["doctor","school","home","activities","gifts"].includes(input.category)||
    name.length<2||city.length<2)throw new Error("Enter a provider name, city and category");
 if(!validDate(input.checkedAt)||input.checkedAt>today)
  throw new Error("Record a genuine price and service check date");
 if(input.costJod!==undefined&&(!Number.isFinite(input.costJod)||input.costJod<0||
   input.costJod>100000||Math.abs(input.costJod*100-Math.round(input.costJod*100))>0.00001))
  throw new Error("Enter a valid cost in JOD or leave it unknown");
 if(input.parentFit!==undefined&&![1,2,3,4,5].includes(input.parentFit))
  throw new Error("Fit assessment must be 1 to 5");
 const url=input.sourceUrl?.trim()?validatePublicServiceLink(input.sourceUrl):null;
 if(input.sourceUrl?.trim()&&!url)throw new Error("Only public HTTPS source links are allowed");
 const entry:ServiceEntry={
  id:input.id,category:input.category,name,city,checkedAt:input.checkedAt,
  ...(input.costJod!==undefined?{costJod:input.costJod}:{}),
  ...(url?{sourceUrl:url}:{}),
  ...(input.parentFit!==undefined?{parentFit:input.parentFit as 1|2|3|4|5}:{}),
  ...(input.childFriendly!==undefined?{childFriendly:input.childFriendly}:{}),
  ...(input.stepFreeAccess!==undefined?{stepFreeAccess:input.stepFreeAccess}:{}),
  ...(input.credentialsConfirmedByParent!==undefined?{credentialsConfirmedByParent:input.credentialsConfirmedByParent}:{}),
  ...(input.availabilityConfirmedByParent!==undefined?{availabilityConfirmedByParent:input.availabilityConfirmedByParent}:{}),
  ...(input.note?.trim()?{note:safe(input.note,250)}:{})
 };
 return entry;
}
export type ServiceAssessment={
 entry:ServiceEntry;
 freshness:"recent"|"review";
 missingChecks:string[];
};
/** A user-confirmed checkbox is still NOT external verification. Never rank
 * clinicians by ratings or imply higher fit predicts outcomes. Alphabetical
 * listing avoids disguising subjective marks as verified recommendations.
 */
export function assessServiceShortlist(entries:readonly ServiceEntry[],now=new Date()):ServiceAssessment[]{
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 const ageDays=(checked:string)=>{
  const a=new Date(checked+"T12:00:00Z"),b=new Date(today+"T12:00:00Z");
  return Math.round((b.getTime()-a.getTime())/86400000);
 };
 return entries.map(entry=>({
  entry,freshness:ageDays(entry.checkedAt)<=30?"recent" as const:"review" as const,
  missingChecks:[
   ...(entry.costJod===undefined?["cost"]:[]),
   ...(!entry.sourceUrl?["source"]:[]),
   ...(!entry.availabilityConfirmedByParent?["availability"]:[]),
   ...(entry.category==="doctor"&&!entry.credentialsConfirmedByParent?["clinician credentials"]:[])
  ]
 })).sort((a,b)=>a.entry.name.localeCompare(b.entry.name));
}
