import {useEffect,useState,type FormEvent} from "react";
import {HeartHandshake,ShieldCheck,Send} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import type {DecisionPlan} from "@/lib/familyDecisionEngine";
import {communityDb as db,itemKey} from "@/lib/community";
import type {User} from "@supabase/supabase-js";

/** Public sharing is a separate explicit opt-in after a privately recorded
 * firsthand experience. It never sends child profiles, cash or plan amounts. */
export function ShareFamilyExperience(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [plans,setPlans,ready]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [user,setUser]=useState<User|null>(null);
 const [email,setEmail]=useState(""),[alias,setAlias]=useState(""),[body,setBody]=useState("");
 const [agreed,setAgreed]=useState(false),[loading,setLoading]=useState(false);
 const [notice,setNotice]=useState("");
 const candidate=(plans as DecisionPlan[]).filter(p=>p.kind==="outing"&&p.status==="completed"&&
  p.decisionContext?.reflection&&p.decisionContext?.city&&p.decisionContext?.placeId&&!p.decisionContext?.publicSharedAt)
  .sort((a,b)=>(b.completedAt??"").localeCompare(a.completedAt??""))[0];
 useEffect(()=>{
  let mounted=true;
  void db.auth.getUser().then(({data}:{data:{user:User|null}})=>{if(mounted)setUser(data.user);}).catch(()=>{});
  const {data}=db.auth.onAuthStateChange((_event:string,session:{user:User}|null)=>{
   if(mounted)setUser(session?.user??null);
  });
  return ()=>{mounted=false;data.subscription.unsubscribe();};
 },[]);
 if(!ready||!candidate)return null;
 const sendLogin=(e:FormEvent)=>{
  e.preventDefault();setLoading(true);setNotice("");
  void db.auth.signInWithOtp({email:email.trim(),options:{
   emailRedirectTo:window.location.origin+import.meta.env.BASE_URL+"#/explore"
  }}).then(({error}:{error:Error|null})=>{
   setNotice(error?error.message:t("Check your email for a private sign-in link.","تفقد بريدك لرابط الدخول."));
  }).catch(()=>setNotice(t("Could not send a sign-in link.","تعذّر إرسال رابط الدخول.")))
   .finally(()=>setLoading(false));
 };
 const publish=(e:FormEvent)=>{
  e.preventDefault();
  if(!user||!agreed)return;
  const name=alias.trim(),experience=body.trim();
  if(name.length<2||experience.length<12){
   setNotice(t("Add a display name and at least 12 characters about your actual experience.","أدخل اسم عرض وتجربتك الفعلية بما لا يقل عن ١٢ حرف."));return;
  }
  if(!candidate.decisionContext?.city)return;
  const key=itemKey(candidate.decisionContext.category==="playground"?"playground":"activity",
   candidate.title,candidate.decisionContext.city);
  setLoading(true);setNotice("");
  void db.from("family_experience_reviews").insert({
   author_id:user.id,author_name:name.slice(0,40),
   item_type:candidate.decisionContext.category==="playground"?"playground":"activity",
   item_key:key,item_name:candidate.title,location:candidate.decisionContext.city,
   rating:null,experience:experience.slice(0,1500),experience_type:"personal"
  }).then(({error}:{error:Error|null})=>{
   if(error){setNotice(error.message);return;}
   setPlans(old=>old.map(p=>p.id===candidate.id?{
    ...p,decisionContext:{...(p as DecisionPlan).decisionContext,
     publicSharedAt:new Date().toISOString()}
   }:p));
   setNotice(t("Experience contributed to the community. Thank you for sharing genuinely.","تمت مشاركة تجربتك مع الأهالي. شكراً لصدقك."));
   setBody("");setAgreed(false);
  }).catch(()=>setNotice(t("Could not publish your experience. Nothing was posted.","تعذّر نشر التجربة.")))
   .finally(()=>setLoading(false));
 };
 return <details className="rounded-2xl border border-[#E2DEEB] bg-[#FBF9FF] p-4">
  <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-extrabold text-[#76578E]"><HeartHandshake className="size-5"/>{t("Help another parent — share a genuine experience (optional)","ساعد أهل غيرك — شارك تجربتك الحقيقية (اختياري)")}</summary>
  <p className="mt-2 text-sm font-bold">{candidate.title}</p>
  <p className="mt-1 flex gap-2 text-xs leading-relaxed text-[#756F7B]"><ShieldCheck className="size-4 shrink-0"/>{t("Only the text you type below and your chosen display name will be published. Your private feedback, budgets and family information remain private. Do not include children's names or contact details.","رح يننشر بس النص واسم العرض اللي تختارهم. رأيك الخاص وميزانيتك وبيانات عيلتك بتظل خاصة. لا تكتب أسماء أطفال أو معلومات اتصال.")}</p>
  {!user?<form className="mt-3 flex flex-wrap gap-2" onSubmit={sendLogin}>
   <label className="min-w-0 flex-1 text-xs font-semibold">{t("Email for optional sign-in","البريد لتسجيل الدخول الاختياري")}
    <input type="email" required value={email} onChange={e=>setEmail(e.target.value.slice(0,120))} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/>
   </label>
   <button disabled={loading} type="submit" className="mt-5 min-h-11 rounded-xl bg-[#76578E] px-4 text-xs font-bold text-white disabled:opacity-50">{t("Sign in to share","ادخل للمشاركة")}</button>
  </form>:<form onSubmit={publish} className="mt-3 space-y-3">
   <label className="block text-xs font-bold">{t("Display name (public)","اسم العرض (عام)")}
    <input required minLength={2} maxLength={40} value={alias} onChange={e=>setAlias(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/></label>
   <label className="block text-xs font-bold">{t("Your experience in your own words (public)","تجربتك بكلماتك (عامة)")}
    <textarea required minLength={12} maxLength={1500} rows={3} value={body} onChange={e=>setBody(e.target.value)} className="mt-1 w-full rounded-xl border bg-white p-3 text-sm" placeholder={t("What worked? What did not?","شو كان منيح؟ وشو ما عجبك؟")}/></label>
   <label className="flex items-start gap-2 text-xs leading-relaxed text-[#655F6D]"><input type="checkbox" required checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1"/>{t("I experienced this personally and agree to publish my own words publicly. I am not being paid to write a positive review.","أنا جربت بنفسي وبوافق أنشر كلامي علناً. وما في مقابل مالي لرأي إيجابي.")}</label>
   <button type="submit" disabled={loading||!agreed} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#76578E] px-4 text-xs font-bold text-white disabled:opacity-50"><Send className="size-4"/>{t("Share my genuine experience","شارك تجربتي الصادقة")}</button>
  </form>}
  {notice&&<p role="status" className="mt-3 rounded-xl bg-white p-3 text-xs">{notice}</p>}
 </details>;
}
