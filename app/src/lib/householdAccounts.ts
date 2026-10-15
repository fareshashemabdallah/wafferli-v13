import {supabase} from "@/integrations/supabase/client";

/**
 * Household accounts are staged behind an explicit build flag.
 * The current GitHub Pages pilot intentionally leaves this FALSE; there is
 * no automatic import/sync of local Money, birthdays, plans or profiles.
 */
export const HOUSEHOLD_ACCOUNTS_ENABLED=
 import.meta.env["VITE_ENABLE_HOUSEHOLD_ACCOUNTS"]==="true";

export type AuthenticatedHousehold={
 household_id:string;
 household_name:string;
 my_role:"owner"|"adult";
 my_display_name:string;
};
export type HouseholdRosterMember={
 user_id:string;
 display_name:string;
 member_role:"owner"|"adult";
 joined_at:string;
};
export type PendingHouseholdInvite={
 invite_id:string;
 created_at:string;
 expires_at:string;
};

type RpcResult={data:unknown;error:{message:string}|null};
type RpcClient={rpc:(name:string,args?:Record<string,string|boolean>)=>Promise<RpcResult>};
const rpcClient=supabase as unknown as RpcClient;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invite=/^[0-9a-f]{64}$/i;
const isRecord=(value:unknown):value is Record<string,unknown>=>
 !!value&&typeof value==="object"&&!Array.isArray(value);
const isText=(x:unknown,min=1,max=150):x is string=>
 typeof x==="string"&&x.length>=min&&x.length<=max;
const isUuid=(value:unknown):value is string=>typeof value==="string"&&uuid.test(value);
const isTime=(value:unknown):value is string=>
 typeof value==="string"&&Number.isFinite(Date.parse(value));
const assertEnabled=()=>{if(!HOUSEHOLD_ACCOUNTS_ENABLED)throw new Error("Household accounts are not enabled in this pilot");};
const checkedName=(v:string,min:number,max:number)=>{
 const trimmed=v.trim();
 if(trimmed.length<min||trimmed.length>max)throw new Error("Please check the name length");
 return trimmed;
};
async function call(name:string,args?:Record<string,string|boolean>):Promise<unknown>{
 assertEnabled();
 const {data,error}=await rpcClient.rpc(name,args);
 if(error)throw new Error(error.message);
 return data;
}
export const isAuthenticatedHousehold=(x:unknown):x is AuthenticatedHousehold=>
 isRecord(x)&&isUuid(x['household_id'])&&isText(x['household_name'],2,70)&&
 (x['my_role']==="owner"||x['my_role']==="adult")&&isText(x['my_display_name'],2,40);
export const isHouseholdRosterMember=(x:unknown):x is HouseholdRosterMember=>
 isRecord(x)&&isUuid(x['user_id'])&&isText(x['display_name'],2,40)&&
 (x['member_role']==="owner"||x['member_role']==="adult")&&isTime(x['joined_at']);
export const isPendingHouseholdInvite=(x:unknown):x is PendingHouseholdInvite=>
 isRecord(x)&&isUuid(x['invite_id'])&&isTime(x['created_at'])&&isTime(x['expires_at']);

/** All records must originate from authenticated Supabase RPCs, never local profiles. */
export async function loadMyHouseholds():Promise<AuthenticatedHousehold[]> {
 const data=await call("dabberna_my_households");
 if(!Array.isArray(data)||!data.every(isAuthenticatedHousehold))
  throw new Error("Could not verify the household records");
 return data;
}
export async function createHousehold(name:string,displayName:string,adultAttested:boolean):Promise<string>{
 if(adultAttested!==true)throw new Error("Adult confirmation is required");
 const data=await call("dabberna_create_household",{
  p_name:checkedName(name,2,70),p_display_name:checkedName(displayName,2,40),p_adult_attested:true
 });
 if(!isUuid(data))throw new Error("Invalid household creation response");
 return data;
}
export async function createAdultInvitation(householdId:string):Promise<string>{
 if(!isUuid(householdId))throw new Error("Invalid household");
 const data=await call("dabberna_create_adult_invite",{p_household_id:householdId});
 if(typeof data!=="string"||!invite.test(data))throw new Error("Invalid invitation response");
 return data;
}
export async function acceptAdultInvitation(code:string,displayName:string,adultAttested:boolean):Promise<string>{
 if(adultAttested!==true)throw new Error("Adult confirmation is required");
 const normalized=code.trim().toLowerCase();
 if(!invite.test(normalized))throw new Error("Enter a valid invitation code");
 const data=await call("dabberna_accept_adult_invite",{
  p_code:normalized,p_display_name:checkedName(displayName,2,40),p_adult_attested:true
 });
 if(!isUuid(data))throw new Error("Invalid invitation acceptance response");
 return data;
}
export async function loadHouseholdRoster(householdId:string):Promise<HouseholdRosterMember[]>{
 if(!isUuid(householdId))throw new Error("Invalid household");
 const data=await call("dabberna_household_roster",{p_household_id:householdId});
 if(!Array.isArray(data)||!data.every(isHouseholdRosterMember))
  throw new Error("Could not verify household members");
 return data;
}
export async function loadPendingInvitations(householdId:string):Promise<PendingHouseholdInvite[]>{
 if(!isUuid(householdId))throw new Error("Invalid household");
 const data=await call("dabberna_pending_invites",{p_household_id:householdId});
 if(!Array.isArray(data)||!data.every(isPendingHouseholdInvite))
  throw new Error("Could not verify invitations");
 return data;
}
export async function revokeAdultMembership(householdId:string,userId:string):Promise<void>{
 if(!isUuid(householdId)||!isUuid(userId))throw new Error("Invalid member reference");
 await call("dabberna_revoke_adult",{p_household_id:householdId,p_user_id:userId});
}
export async function revokeInvitation(householdId:string,inviteId:string):Promise<void>{
 if(!isUuid(householdId)||!isUuid(inviteId))throw new Error("Invalid invitation reference");
 await call("dabberna_revoke_invite",{p_household_id:householdId,p_invite_id:inviteId});
}
export async function leaveHousehold(householdId:string):Promise<void>{
 if(!isUuid(householdId))throw new Error("Invalid household");
 await call("dabberna_leave_household",{p_household_id:householdId});
}
