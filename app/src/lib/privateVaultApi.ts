import {supabase} from "@/integrations/supabase/client";
import {type EncryptedVaultEnvelope,validVaultEnvelope} from "./privateVaultCrypto";

/** This flag is false in the public pilot. Deployment of the staged SQL,
 * real Supabase RLS tests, service review and explicit user consent are required.
 */
export const PRIVATE_VAULT_ENABLED=
 import.meta.env["VITE_ENABLE_PRIVATE_VAULT"]==="true";

export type PersonalVaultRow={
 user_id:string;
 revision:number;
 envelope:EncryptedVaultEnvelope;
 updated_at:string;
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isRecord=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
export const isPersonalVaultRow=(row:unknown):row is PersonalVaultRow=>
 isRecord(row)&&typeof row["user_id"]==="string"&&uuid.test(row["user_id"])&&
 typeof row["revision"]==="number"&&Number.isSafeInteger(row["revision"])&&row["revision"]>=1&&
 validVaultEnvelope(row["envelope"])&&typeof row["updated_at"]==="string"&&
 Number.isFinite(Date.parse(row["updated_at"]));

type VaultRead={data:unknown;error:{message:string}|null};
type Db={
 from:(table:string)=>{select:(cols:string)=>{eq:(k:string,v:string)=>{maybeSingle:()=>Promise<VaultRead>}}};
 rpc:(fn:string,args?:Record<string,unknown>)=>Promise<VaultRead>;
};
const db=supabase as unknown as Db;
async function ownUserId():Promise<string>{
 if(!PRIVATE_VAULT_ENABLED)throw new Error("Encrypted personal vault is not enabled");
 const {data,error}=await supabase.auth.getUser();
 if(error||!data.user?.id||!uuid.test(data.user.id))
  throw new Error("Verified sign-in is required");
 return data.user.id;
}
export async function fetchPersonalVault():Promise<PersonalVaultRow|null>{
 const userId=await ownUserId();
 const {data,error}=await db.from("dabberna_private_vault_v1")
  .select("user_id,revision,envelope,updated_at").eq("user_id",userId).maybeSingle();
 if(error)throw new Error(error.message);
 if(data===null)return null;
 if(!isPersonalVaultRow(data)||data.user_id!==userId)
  throw new Error("Could not verify personal vault ownership");
 return data;
}
export async function uploadPersonalVault(envelope:EncryptedVaultEnvelope,expectedRevision:number):Promise<number>{
 await ownUserId();
 if(!validVaultEnvelope(envelope)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0)
  throw new Error("Invalid encrypted vault or revision");
 const {data,error}=await db.rpc("dabberna_put_private_vault",{
  p_expected_revision:expectedRevision,p_envelope:envelope
 });
 if(error)throw new Error(error.message);
 if(typeof data!=="number"||!Number.isSafeInteger(data)||
    data!==expectedRevision+1)throw new Error("Invalid server revision response");
 return data;
}
export async function removePersonalVault():Promise<boolean>{
 await ownUserId();
 const {data,error}=await db.rpc("dabberna_delete_private_vault");
 if(error)throw new Error(error.message);
 if(typeof data!=="boolean")throw new Error("Invalid deletion response");
 return data;
}
