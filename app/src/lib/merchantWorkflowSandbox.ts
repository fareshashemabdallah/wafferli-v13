import {parseJodFils,formatJodFils} from "./merchantPaymentPolicy";
import {dateKey,parseCalendarDate} from "./familyCalendar";
/** NOT an authorization layer. This is an ephemeral fictional business
 * workflow simulation. Real merchants/reviewers must be authenticated and
 * authorized by server-side roles before offers reach consumers.
 */
export type SandboxActor="merchant"|"reviewer";
export type SandboxMerchant={id:string;displayName:string;country:"JO";status:"draft"|"pending-review"|"demo-approved"|"demo-rejected"};
export type SandboxOffer={id:string;merchantId:string;title:string;totalFils:number;
 expiresOn:string;status:"draft"|"submitted"|"needs-changes"|"demo-approved"|"demo-rejected";
 createdAt:string;reviewedAt?:string;};
const text=(value:string,max:number)=>value.trim().replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").slice(0,max);
export function createSandboxMerchant(id:string,name:string):SandboxMerchant{
 const displayName=text(name,100);
 if(!id||id.length>130||displayName.length<3)throw new Error("Use a fictional merchant name");
 return {id,displayName,country:"JO",status:"draft"};
}
export function submitSandboxMerchant(merchant:SandboxMerchant,actor:SandboxActor):SandboxMerchant{
 if(actor!=="merchant"||merchant.status!=="draft")throw new Error("Only draft fictional merchants can submit");
 return {...merchant,status:"pending-review"};
}
export function reviewSandboxMerchant(merchant:SandboxMerchant,actor:SandboxActor,approve:boolean):SandboxMerchant{
 if(actor!=="reviewer"||merchant.status!=="pending-review")
  throw new Error("Only demo reviewers can assess a submitted merchant");
 return {...merchant,status:approve?"demo-approved":"demo-rejected"};
}
export function createSandboxOffer(input:{
 id:string;merchant:SandboxMerchant;title:string;totalJod:string;expiresOn:string
},now=new Date()):SandboxOffer{
 if(input.merchant.status!=="demo-approved")
  throw new Error("The fictional merchant has not completed the demo review");
 const title=text(input.title,120);
 if(!input.id||input.id.length>130||title.length<3)
  throw new Error("Enter a fictional product or service title");
 if(!parseCalendarDate(input.expiresOn)||input.expiresOn<dateKey(now))
  throw new Error("Enter a current or future demo expiry date");
 const totalFils=parseJodFils(input.totalJod);
 if(totalFils<=0||totalFils>100_000_000)throw new Error("Enter a valid total under 100,000 JOD");
 return {id:input.id,merchantId:input.merchant.id,title,totalFils,
  expiresOn:input.expiresOn,status:"draft",createdAt:now.toISOString()};
}
export function advanceSandboxOffer(
 offer:SandboxOffer,actor:SandboxActor,action:"submit"|"approve"|"request-changes"|"reject",now=new Date()
):SandboxOffer{
 if(offer.expiresOn<dateKey(now))throw new Error("Expired draft cannot be submitted or approved");
 if(action==="submit"){
  if(actor!=="merchant"||!["draft","needs-changes"].includes(offer.status))
   throw new Error("Only the fictional merchant can resubmit their demo draft");
  return {...offer,status:"submitted"};
 }
 if(actor!=="reviewer"||offer.status!=="submitted")
  throw new Error("Only the fictional reviewer can decide a submitted offer");
 return {...offer,status:action==="approve"?"demo-approved":
  action==="reject"?"demo-rejected":"needs-changes",reviewedAt:now.toISOString()};
}
export function sandboxOfferSummary(offer:SandboxOffer,now=new Date()):{
 status:string;displayTotal:string;isExpired:boolean
}{
 const expired=offer.expiresOn<dateKey(now);
 return {status:expired?"expired":offer.status,displayTotal:formatJodFils(offer.totalFils)+" JOD",isExpired:expired};
}
