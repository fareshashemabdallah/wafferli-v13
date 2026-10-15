import {supabase} from "@/integrations/supabase/client";
import {HOUSEHOLD_ACCOUNTS_ENABLED} from "./householdAccounts";
import {type ExpenseSharePreview,validSharedExpenseRow,type SharedExpenseRow} from "./expenseSharing";

export const HOUSEHOLD_EXPENSE_SHARING_ENABLED=
 HOUSEHOLD_ACCOUNTS_ENABLED&&import.meta.env["VITE_ENABLE_HOUSEHOLD_EXPENSE_SHARING"]==="true";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
type RpcResult={data:unknown;error:{message:string}|null};
type QueryResponse={data:unknown;error:{message:string}|null};
type ExpenseQuery={select:(columns:string)=>{eq:(field:string,value:string)=>{order:(field:string,options:{ascending:boolean})=>{limit:(n:number)=>Promise<QueryResponse>}}}};
type Api={
 rpc:(name:string,values:Record<string,string|number|boolean>)=>Promise<RpcResult>;
 from:(name:string)=>ExpenseQuery;
};
const api=supabase as unknown as Api;
const assertEnabled=()=>{
 if(!HOUSEHOLD_EXPENSE_SHARING_ENABLED)throw new Error("Household expense sharing is not enabled");
};
const checkId=(id:string)=>{
 if(!UUID.test(id))throw new Error("Invalid household or expense ID");
 return id;
};
/** Reads provider-authenticated household rows via RLS. No local finance
 * state is uploaded, and return values are validated before display. */
export async function fetchSharedHouseholdExpenses(householdId:string):Promise<SharedExpenseRow[]>{
 assertEnabled();checkId(householdId);
 const {data,error}=await api.from("dabberna_shared_expenses_v1")
 .select("id,household_id,created_by,source_fingerprint,category,amount_fils,occurred_on,currency,consented_at")
 .eq("household_id",householdId).order("occurred_on",{ascending:false}).limit(200);
 if(error)throw new Error(error.message);
 if(!Array.isArray(data)||!data.every(validSharedExpenseRow)||
    data.some((row:SharedExpenseRow)=>row.household_id!==householdId))
  throw new Error("Could not verify household expense records");
 return data;
}
/** The trusted server requires a separate per-item consent bit and sets
 * created_by from auth.uid(); the browser cannot designate another owner. */
export async function publishOneSharedExpense(
 householdId:string,preview:ExpenseSharePreview,sourceFingerprint:string,
 explicitlyConfirmed:boolean
):Promise<string>{
 assertEnabled();checkId(householdId);
 if(explicitlyConfirmed!==true)throw new Error("Explicit per-item consent required");
 if(!SHA.test(sourceFingerprint)||!Number.isSafeInteger(preview.amountFils)||
    preview.amountFils<1||preview.amountFils>100000000||
    !preview.category.trim()||preview.category.length>80||
    !/^\d{4}-\d{2}-\d{2}$/.test(preview.occurredOn))
   throw new Error("Invalid expense sharing preview");
 const {data,error}=await api.rpc("dabberna_share_one_expense",{
  p_household_id:householdId,
  p_source_fingerprint:sourceFingerprint,
  p_category:preview.category,
  p_amount_fils:preview.amountFils,
  p_occurred_on:preview.occurredOn,
  p_explicit_consent:true
 });
 if(error)throw new Error(error.message);
 if(typeof data!=="string"||!UUID.test(data))throw new Error("Invalid share receipt");
 return data;
}
/** Withdrawal removes only the current member's own published item; access
 * and ownership are checked by the server's authenticated RPC. */
export async function withdrawSharedExpense(householdId:string,recordId:string):Promise<void>{
 assertEnabled();checkId(householdId);checkId(recordId);
 const {error}=await api.rpc("dabberna_unshare_one_expense",{
  p_household_id:householdId,p_expense_id:recordId
 });
 if(error)throw new Error(error.message);
}
