import { supabase } from "@/integrations/supabase/client";
export const communityDb = supabase as any;
export const itemKey = (type:string,name:string,area:string) =>
  [type.trim().toLowerCase(),name.trim().toLocaleLowerCase().replace(/\s+/g," "),area.trim().toLocaleLowerCase().replace(/\s+/g," ")].join("|");
export const opinionNoticeEn = "Personal opinion of an individual user, not Dabberna's recommendation or an independently verified fact. Verify important information yourself.";
export const opinionNoticeAr = "هذا رأي شخصي لمستخدم ولا يمثّل توصية من دبّرنا أو حقيقة تم التحقق منها بشكل مستقل. يرجى التأكد من المعلومات المهمة بنفسك.";
export type Group = {id:string;name:string;description:string;invite_code:string;created_at:string};
export type GroupMember = {group_id:string;user_id:string;display_name:string;role:string};
export type ChatMessage = {id:string;group_id:string;author_id:string;context_type:string;context_title:string;body:string;created_at:string};
export type ExperienceReview = {id:string;author_id:string;author_name:string;item_type:string;item_key:string;item_name:string;location:string;rating:number|null;experience:string;experience_type:string;created_at:string};
