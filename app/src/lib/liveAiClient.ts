import {supabase} from "@/integrations/supabase/client";
import {computeMoney,type MoneyState} from "./money";
import {LIVE_AI_FUNCTION,parseLiveAiAnswer,parseLiveAiRequest,
 type LiveAiRequest,type LiveAiFinancialSummary} from "./liveAiProtocol";

/** Available only after the server has been securely deployed and its quota
 * RPC audited. This is a BUILD flag, not evidence of actual server readiness.
 */
export const LIVE_AI_UI_ENABLED=import.meta.env["VITE_ENABLE_LIVE_AI"]==="true";
export function optionalLiveAiFinancialSummary(money:MoneyState):LiveAiFinancialSummary|null{
 if(money.demo)return null;
 const report=computeMoney(money);
 const costs=report.planned,spent=report.spent,income=report.monthlyIncome,target=report.savingsTarget;
 const valid=(x:number)=>Number.isFinite(x)&&x>=0&&x<=1_000_000;
 const round=(x:number)=>Math.round(x*100)/100;
 if(![costs,spent,income,target].every(valid))return null;
 const rawCash=money.cashOnHand;
 return {monthlyIncomeJod:round(income),plannedExpensesJod:round(costs),
  recordedSpentJod:round(spent),savingsTargetJod:round(target),
  recordedBillScheduleCount:Math.min(500,(money.commitments??[]).length),
  ...(typeof rawCash==="number"&&valid(rawCash)?{cashOnHandJod:round(rawCash)}:{})};
}
export async function askLiveFamilyAi(input:LiveAiRequest):Promise<string>{
 if(!LIVE_AI_UI_ENABLED)throw new Error("Live AI has not been enabled in this pilot");
 const checked=parseLiveAiRequest(input);
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token)throw new Error("Please sign in before using live AI");
 const {data,error}=await supabase.functions.invoke(LIVE_AI_FUNCTION,{
  body:checked,headers:{Authorization:"Bearer "+session.access_token}
 });
 if(error){
  // Display safe provider errors only: do not surface server secrets or raw dumps.
  const status=(error as {context?:{status?:number}}).context?.status;
  if(status===401)return Promise.reject(new Error("Your session expired. Sign in again."));
  if(status===429)return Promise.reject(new Error("Request limit reached. Try later."));
  if(status===503)return Promise.reject(new Error("Live AI has not been activated on the backend."));
  throw new Error("Live AI could not complete your question. No payment or action occurred.");
 }
 return parseLiveAiAnswer(data);
}
