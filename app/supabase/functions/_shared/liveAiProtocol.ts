/** Shared, dependency-free request/response policy for the live AI boundary.
 * Input from the browser remains untrusted until the Edge Function validates it.
 * Never send raw localStorage, expense notes, children's identities or profiles.
 */
import {detectSensitiveAiText} from "./liveAiPrivacy.ts";

export type LiveAiLanguage="en"|"ar";
export type LiveAiTurn={role:"user"|"assistant";content:string};
export type LiveAiFinancialSummary={
 monthlyIncomeJod:number;plannedExpensesJod:number;recordedSpentJod:number;
 savingsTargetJod:number;recordedBillScheduleCount:number;
 cashOnHandJod?:number;
};
export type LiveAiRequest={
 question:string;language:LiveAiLanguage;history:LiveAiTurn[];
 /** True only after a parent explicitly agrees to this individual request. */
 parentConsent:true;
 context?:LiveAiFinancialSummary;
};
const money=(x:unknown):x is number=>typeof x==="number"&&
 Number.isFinite(x)&&x>=0&&x<=1_000_000&&Math.abs(x*100-Math.round(x*100))<0.00001;
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const exact=(value:Record<string,unknown>,keys:readonly string[])=>
 Object.keys(value).every(key=>keys.includes(key));
const maxBytes=6_000;
export function parseLiveAiRequest(input:unknown):LiveAiRequest {
 if(!record(input)||!exact(input,["question","language","history","context","parentConsent"])||
  input["parentConsent"]!==true||
  typeof input["question"]!=="string"||input["question"].trim().length<2||
  input["question"].length>600||
  (input["language"]!=="ar"&&input["language"]!=="en")||
  !Array.isArray(input["history"])||input["history"].length>6)
  throw new Error("Invalid family AI request");
 const history:LiveAiTurn[]=[];
 for(const item of input["history"]){
  if(!record(item)||!exact(item,["role","content"])||
   (item["role"]!=="user"&&item["role"]!=="assistant")||
   typeof item["content"]!=="string"||item["content"].trim().length<1||
   item["content"].length>800)
   throw new Error("Invalid conversation history");
  if(detectSensitiveAiText(item["content"]))throw new Error("Remove sensitive details from the AI conversation before sending");
  history.push({role:item["role"],content:item["content"].trim()});
 }
 let context:LiveAiFinancialSummary|undefined;
 if(input["context"]!==undefined){
  const c=input["context"];
  if(!record(c)||!exact(c,["monthlyIncomeJod","plannedExpensesJod",
   "recordedSpentJod","savingsTargetJod","recordedBillScheduleCount","cashOnHandJod"])||
   !money(c["monthlyIncomeJod"])||!money(c["plannedExpensesJod"])||
   !money(c["recordedSpentJod"])||!money(c["savingsTargetJod"])||
   !Number.isInteger(c["recordedBillScheduleCount"])||
   (c["recordedBillScheduleCount"] as number)<0||(c["recordedBillScheduleCount"] as number)>500||
   (c["cashOnHandJod"]!==undefined&&!money(c["cashOnHandJod"])))
   throw new Error("Invalid or excessive financial summary");
  context={
   monthlyIncomeJod:c["monthlyIncomeJod"],
   plannedExpensesJod:c["plannedExpensesJod"],
   recordedSpentJod:c["recordedSpentJod"],
   savingsTargetJod:c["savingsTargetJod"],
   recordedBillScheduleCount:c["recordedBillScheduleCount"] as number,
   ...(c["cashOnHandJod"]!==undefined?{cashOnHandJod:c["cashOnHandJod"] as number}:{})
  };
 }
 if(detectSensitiveAiText(input["question"]))
  throw new Error("Remove sensitive details from the AI question before sending");
 const result:LiveAiRequest={question:input["question"].trim(),
  language:input["language"],history,parentConsent:true,...(context?{context}:{})};
 if(new TextEncoder().encode(JSON.stringify(result)).byteLength>maxBytes)
  throw new Error("The AI question is too long");
 return result;
}
export function parseLiveAiAnswer(raw:unknown):string {
 if(!record(raw)||typeof raw["answer"]!=="string"||
  raw["answer"].trim().length<1||raw["answer"].length>4200)
  throw new Error("Invalid response from live family AI service");
 return raw["answer"].trim();
}
export const LIVE_AI_FUNCTION="dabberna-family-ai";
