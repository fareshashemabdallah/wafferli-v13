import type {Expense,MoneyState} from "./money";

/** Sharing is a new act of consent. The old local .shared boolean is only
 * an eligibility label, NEVER an access grant or a sync instruction. */
export type ExpenseSharePreview={
 localExpenseId:string;
 category:string;
 amountFils:number;
 occurredOn:string;
};
export type SharedExpenseRow={
 id:string;
 household_id:string;
 created_by:string;
 source_fingerprint:string;
 category:string;
 amount_fils:number;
 occurred_on:string;
 currency:"JOD";
 consented_at:string;
};
const goodDate=(day:string,now:Date)=>
 /^\d{4}-\d{2}-\d{2}$/.test(day)&&
 !Number.isNaN(Date.parse(day+"T12:00:00Z"))&&
 new Date(day+"T12:00:00Z").toISOString().slice(0,10)===day&&
 day>="2000-01-01"&&
 day<=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const record=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==="object"&&!Array.isArray(x);
export const validSharedExpenseRow=(x:unknown):x is SharedExpenseRow=>
 record(x)&&
 ["id","household_id","created_by"].every(k=>typeof x[k]==="string"&&UUID.test(x[k] as string))&&
 typeof x["source_fingerprint"]==="string"&&SHA.test(x["source_fingerprint"])&&
 typeof x["category"]==="string"&&x["category"].trim().length>=1&&x["category"].length<=80&&
 typeof x["amount_fils"]==="number"&&Number.isSafeInteger(x["amount_fils"])&&
 (x["amount_fils"] as number)>=1&&(x["amount_fils"] as number)<=100000000&&
 typeof x["occurred_on"]==="string"&&goodDate(x["occurred_on"],new Date())&&
 x["currency"]==="JOD"&&typeof x["consented_at"]==="string"&&
 Number.isFinite(Date.parse(x["consented_at"] as string));

/** No notes, owner labels, child identity or financial balances leave the device.
 * This preview is the EXACT minimum set of user-visible fields we may send. */
export function prepareExpenseForShare(
 state:MoneyState,expense:Expense,now=new Date()
):ExpenseSharePreview|null {
 if(state.demo||expense.shared!==true||expense.status==="planned"||
    typeof expense.id!=="string"||expense.id.length<1||expense.id.length>120||
    !goodDate(expense.date,now)||typeof expense.amount!=="number"||
    !Number.isFinite(expense.amount)||expense.amount<=0||expense.amount>100000)return null;
 const hundredths=Math.round(expense.amount*100);
 if(Math.abs(expense.amount-hundredths/100)>0.000001)return null;
 const category=state.categories.find(c=>c.id===expense.categoryId)?.name.trim();
 if(!category||category.length>80)return null;
 return {
  localExpenseId:expense.id,
  category,
  amountFils:hundredths*10,
  occurredOn:expense.date
 };
}
/** Idempotency key is a SHA-256 fingerprint of a random local expense ID
 * scoped to one account and one household. It is not a bank/credit-card token.
 * Browser Web Crypto is required; fingerprint is never placed in a URL.
 */
export async function fingerprintLocalExpense(
 householdId:string,userId:string,localExpenseId:string
):Promise<string>{
 if(!UUID.test(householdId)||!UUID.test(userId)||
    !localExpenseId||localExpenseId.length>120)throw new Error("Invalid expense source reference");
 if(!globalThis.crypto?.subtle)throw new Error("Secure browser hashing is unavailable");
 const data=new TextEncoder().encode(JSON.stringify(["dabberna-expense-v1",householdId,userId,localExpenseId]));
 const bytes=new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256",data));
 return Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
}
/** A locally shared item is a distinct copy. Never silently replace or
 * reconcile it against someone's local Money ledger. */
export const formatSharedJod=(fils:number)=>(fils/1000).toFixed(3)+" JOD";
