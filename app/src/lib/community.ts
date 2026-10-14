import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Community data is remote, separate from the device-only family budget. */
const client = supabase as unknown as SupabaseClient<any>;
export type CommunityGroup = {
  id: string; name: string; description: string; creator_id: string;
};
export type CommunityMember = {group_id:string;user_id:string;display_name:string;role:"owner"|"member"};
export type CommunityMessage = {
  id:string;group_id:string;author_id:string;display_name:string;topic_kind:"general"|"outing"|"advice";
  topic_ref:string;body:string;created_at:string;
};
export type ExperienceReview = {
  id:string;author_id:string;display_name:string;rating:number;body:string;
  personal_experience:boolean;created_at:string;
};
export type ReviewType = "doctor"|"restaurant"|"playground"|"product"|"school"|"service"|"other";
export const reviewTypes: ReviewType[] = ["doctor","restaurant","playground","product","school","service","other"];

export const communityAuth = {
  current: () => supabase.auth.getUser(),
  subscribe: (cb:(user:User|null)=>void) => supabase.auth.onAuthStateChange((_event,session)=>cb(session?.user??null)),
  sendEmail: (email:string) => supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser:true, emailRedirectTo: window.location.origin+window.location.pathname+(window.location.hash.startsWith("#/community")?window.location.hash:"#/community") }
  }),
  confirmCode: (email:string,token:string) => supabase.auth.verifyOtp({email,token,type:"email"}),
  signOut: () => supabase.auth.signOut()
};
function requireResult<T>(result:{data:T|null;error:{message:string}|null},fallback="This feature is not connected to the community database."):T {
  if(result.error) throw Error(
    /function .* does not exist|schema cache|relation .* does not exist|not found/i.test(result.error.message)
      ? fallback : result.error.message
  );
  return result.data as T;
}
export async function getCommunityGroups():Promise<CommunityGroup[]>{
  return requireResult<CommunityGroup[]>((await client.from("community_groups").select("id,name,description,creator_id").order("created_at",{ascending:false})), "Community database setup is pending. Your existing household and outing tools are unaffected.");
}
export async function createCommunityGroup(name:string,description:string,nickname:string):Promise<string> {
  return requireResult<string>(await client.rpc("community_create_group",{p_name:name,p_description:description,p_nickname:nickname}));
}
export async function inviteCommunityMember(groupId:string):Promise<string> {
  return requireResult<string>(await client.rpc("community_create_invite",{p_group:groupId}));
}
export async function acceptCommunityInvite(token:string,nickname:string):Promise<string> {
  return requireResult<string>(await client.rpc("community_join_group",{p_token:token,p_nickname:nickname}));
}
export async function leaveCommunityGroup(groupId:string):Promise<void> {
  requireResult(await client.rpc("community_leave_group",{p_group:groupId}));
}
export async function getCommunityMembers(groupId:string):Promise<CommunityMember[]>{
  return requireResult<CommunityMember[]>(await client.from("community_members").select("group_id,user_id,display_name,role").eq("group_id",groupId));
}
export async function getCommunityMessages(groupId:string,kind:"general"|"outing"|"advice",topic:string):Promise<CommunityMessage[]>{
  return requireResult<CommunityMessage[]>(await client.from("community_messages")
    .select("id,group_id,author_id,display_name,topic_kind,topic_ref,body,created_at")
    .eq("group_id",groupId).eq("topic_kind",kind).eq("topic_ref",topic).order("created_at",{ascending:false}).limit(100));
}
export async function sendCommunityMessage(groupId:string,kind:"general"|"outing"|"advice",topic:string,body:string):Promise<string>{
  return requireResult<string>(await client.rpc("community_send_message",{p_group:groupId,p_kind:kind,p_topic:topic,p_body:body}));
}
export async function getExperienceReviews(groupId:string,type:ReviewType,name:string,area:string):Promise<ExperienceReview[]>{
  return requireResult<ExperienceReview[]>(await client.rpc("community_find_reviews",{p_group:groupId,p_type:type,p_name:name,p_area:area}));
}
export async function postExperienceReview(groupId:string,type:ReviewType,name:string,area:string,rating:number,body:string):Promise<string> {
  return requireResult<string>(await client.rpc("community_post_review",{p_group:groupId,p_type:type,p_name:name,p_area:area,p_rating:rating,p_body:body,p_personal_experience:true}));
}
export async function reportCommunityContent(kind:"message"|"review",id:string,reason:string):Promise<void>{
  requireResult(await client.rpc("community_report_content",{p_kind:kind,p_id:id,p_reason:reason}));
}
export async function hideCommunityContent(kind:"message"|"review",id:string):Promise<void>{
  requireResult(await client.rpc("community_hide_content",{p_kind:kind,p_id:id}));
}
export function communityInviteLink(token:string){
  return window.location.origin+window.location.pathname+"#/community?invite="+encodeURIComponent(token);
}
