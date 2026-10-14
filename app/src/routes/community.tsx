import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, HeartHandshake, MessageCircle, Send, ShieldAlert, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { PlanContextBanner } from "@/components/PlanContextBanner";
import {activeDecisionKey,activeJourney,type DecisionJourney} from "@/lib/decisionJourney";
import {useLocalState} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { communityDb as db, type Group, type ChatMessage, type GroupMember } from "@/lib/community";
import { useI18n } from "@/lib/i18n";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/community")({
 head:()=>({meta:[{title:"Family & Friends Circles — Dabberna"},{name:"description",content:"Invite-only family circles for parents, friends and outing discussions."}]}),
 component:Community
});
function Community(){
 const {lang}=useI18n(); const ar=lang==="ar";
 const [savedDecision]=useLocalState<DecisionJourney|null>(activeDecisionKey,null);
 const linkedOccasion=activeJourney(savedDecision);
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 const [email,setEmail]=useState(""),[name,setName]=useState(""),[newName,setNewName]=useState(""),[desc,setDesc]=useState("");
 const [invite,setInvite]=useState(""),[groups,setGroups]=useState<Group[]>([]),[members,setMembers]=useState<GroupMember[]>([]);
 const [active,setActive]=useState(""),[messages,setMessages]=useState<ChatMessage[]>([]),[body,setBody]=useState("");
 const [context,setContext]=useState<"general"|"outing"|"advice">("general"),[topic,setTopic]=useState("");
 const [notice,setNotice]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let alive=true;
  db.auth.getUser().then(({data}:{data:{user:User|null}})=>{if(alive){setUser(data.user);setLoading(false);}}).catch(()=>{if(alive)setLoading(false);});
  const {data}=db.auth.onAuthStateChange((_event:string,session:{user:User}|null)=>setUser(session?.user??null));
  const hash=new URLSearchParams(window.location.hash.split("?")[1]??"");
  setInvite(hash.get("invite")??"");
  setContext(hash.get("context")==="outing"?"outing":hash.get("context")==="advice"?"advice":"general");
  setTopic((hash.get("topic")??"").slice(0,120));
  return ()=>{alive=false;data.subscription.unsubscribe();};
 },[]);
 const loadGroups=async()=>{
  const {data,error}=await db.from("family_groups").select("id,name,description,invite_code,created_at").order("created_at",{ascending:false});
  if(error)throw error;
  setGroups((data??[]) as Group[]);
 };
 const loadMessages=async(groupId:string)=>{
  const [m,u]=await Promise.all([
   db.from("family_group_messages").select("id,group_id,author_id,context_type,context_title,body,created_at").eq("group_id",groupId).order("created_at",{ascending:true}).limit(150),
   db.from("family_group_members").select("group_id,user_id,display_name,role").eq("group_id",groupId)
  ]);
  if(m.error)throw m.error;
  setMessages((m.data??[]) as ChatMessage[]);setMembers((u.data??[]) as GroupMember[]);
 };
 useEffect(()=>{if(user)loadGroups().catch(e=>setError(String(e.message??e)));else {setGroups([]);setActive("");}},[user?.id]);
 useEffect(()=>{if(!user||!active)return;loadMessages(active).catch(e=>setError(String(e.message??e)));
  const id=window.setInterval(()=>loadMessages(active).catch(()=>{}),6000);
  return ()=>window.clearInterval(id);
 },[active,user?.id]);
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError("");setNotice("");try{await fn();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const signIn=(e:FormEvent)=>{e.preventDefault();void run(async()=>{const {error}=await db.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin+import.meta.env.BASE_URL+"#/community"}});if(error)throw error;setNotice(ar?"تحقّق من بريدك الإلكتروني لفتح رابط الدخول.":"Check your email for a sign-in link.");});};
 const create=(e:FormEvent)=>{e.preventDefault();void run(async()=>{
  const {data,error}=await db.rpc("create_family_group",{p_name:newName.trim(),p_description:desc.trim(),p_display_name:name.trim()});
  if(error)throw error;await loadGroups();setActive(data.id);setNewName("");setDesc("");setNotice(ar?"تم إنشاء المجموعة":"Group created");
 });};
 const join=(e:FormEvent)=>{e.preventDefault();void run(async()=>{
  const {data,error}=await db.rpc("join_family_group",{p_invite_code:invite.trim(),p_display_name:name.trim()});
  if(error)throw error;await loadGroups();setActive(data);setInvite("");setNotice(ar?"أصبحت عضواً في المجموعة":"You joined the circle");
 });};
 const send=(e:FormEvent)=>{e.preventDefault();void run(async()=>{
  if(!active||!user||!body.trim())return;
  const {error}=await db.from("family_group_messages").insert({group_id:active,author_id:user.id,context_type:context,context_title:topic.slice(0,120),body:body.trim().slice(0,1500)});
  if(error)throw error;setBody("");await loadMessages(active);
 });};
 const selected=groups.find(g=>g.id===active);
 return <AppShell title={ar?"دوائر العائلة والأصدقاء":"Family & Friends Circles"}>
  <div className="hero-surface rounded-3xl p-5">
   <div className="flex items-center gap-3"><HeartHandshake className="size-7 text-brand"/><h2 className="text-xl font-semibold">{ar?"مجتمعك الموثوق، باختيارك":"Your own trusted circle"}</h2></div>
   <p className="mt-2 text-sm">{ar?"أنشئ مجموعة خاصة لأهالي المدرسة أو الأصدقاء، ادعُ من تشاء، وتبادل الأسئلة والخبرات عن النزهات والخدمات.":"Create a private group for school parents or friends, invite people you trust and discuss outings, advice and everyday questions."}</p>
  </div>
  <div className="mt-4"><PlanContextBanner/></div>
  <div className="mt-4 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground"><ShieldAlert className="me-2 inline size-4"/>{ar?"المحادثات لأعضاء المجموعة فقط. لا تشارك بيانات أطفال حساسة أو معلومات مالية أو صحية.":"Group chats are visible only to members. Avoid private child, financial, or health details. Invites are bearer links: share them thoughtfully."}</div>
  {loading?<p className="mt-4">{ar?"جارٍ التحميل...":"Loading…"}</p>:!user?
   <form onSubmit={signIn} className="card-soft mt-4 space-y-3 p-5">
    <h3 className="font-semibold">{ar?"سجل الدخول بالبريد الإلكتروني":"Sign in with email"}</h3>
    <p className="text-sm text-muted-foreground">{ar?"سنرسل رابط دخول إلى بريدك دون كلمة مرور.":"We'll email you a passwordless sign-in link."}</p>
    <Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <Button disabled={busy} type="submit">{ar?"أرسل رابط الدخول":"Send sign-in link"}</Button>
   </form>:
  <>
   <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
    <p className="text-xs text-muted-foreground">{user.email}</p>
    <Button size="sm" variant="outline" onClick={()=>void db.auth.signOut()}>{ar?"تسجيل الخروج":"Sign out"}</Button>
   </div>
   <label className="mt-4 block text-sm font-medium">{ar?"اسمك داخل المجموعات":"Your group display name"}
    <Input className="mt-1" maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder={ar?"مثلاً: أم سارة":"e.g. Sara's parent"}/>
   </label>
   <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <form onSubmit={create} className="card-soft space-y-2 p-4">
     <h3 className="flex items-center gap-2 font-semibold"><Users className="size-5 text-brand"/>{ar?"أنشئ مجموعة":"Create a circle"}</h3>
     <Input required minLength={3} maxLength={80} value={newName} onChange={e=>setNewName(e.target.value)} placeholder={ar?"أهالي صف الروضة":"Kindergarten parents"}/>
     <Input maxLength={240} value={desc} onChange={e=>setDesc(e.target.value)} placeholder={ar?"وصف المجموعة (اختياري)":"Group description (optional)"}/>
     <Button disabled={busy||name.trim().length<2} type="submit">{ar?"إنشاء":"Create"}</Button>
    </form>
    <form onSubmit={join} className="card-soft space-y-2 p-4">
     <h3 className="font-semibold">{ar?"انضم بدعوة":"Join with an invite"}</h3>
     <Input required value={invite} onChange={e=>setInvite(e.target.value)} placeholder={ar?"رمز الدعوة":"Invitation code"}/>
     <Button disabled={busy||name.trim().length<2} type="submit" variant="outline">{ar?"انضم":"Join group"}</Button>
    </form>
   </div>
   <section className="mt-5">
    <h2 className="mb-2 font-semibold">{ar?"مجموعاتي":"My circles"}</h2>
    {!groups.length&&<p className="text-sm text-muted-foreground">{ar?"أنشئ مجموعة أو انضم بدعوة للبدء.":"Create or join a circle to start chatting."}</p>}
    <div className="flex flex-wrap gap-2">{groups.map(g=><Button size="sm" key={g.id} variant={g.id===active?"default":"outline"} onClick={()=>setActive(g.id)}>{g.name}</Button>)}</div>
   </section>
   {selected&&<section className="card-soft mt-4 space-y-3 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div><h3 className="font-semibold">{selected.name}</h3><p className="text-xs text-muted-foreground">{selected.description} · {members.length} {ar?"أعضاء":"members"}</p></div>
     <Button variant="outline" size="sm" onClick={()=>{const url=window.location.origin+import.meta.env.BASE_URL+"#/community?invite="+encodeURIComponent(selected.invite_code);void navigator.clipboard.writeText(url).then(()=>setNotice(ar?"تم نسخ رابط الدعوة":"Invite link copied")).catch(()=>setError(ar?"تعذر نسخ الرابط":"Unable to copy link"));}}><Copy className="size-4"/>{ar?"نسخ الدعوة":"Copy invitation"}</Button>
    </div>
    <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-muted/40 p-3">
     {!messages.length&&<p className="text-sm text-muted-foreground">{ar?"ابدأ المحادثة مع مجموعتك":"Start a conversation with your circle."}</p>}
     {messages.map(m=><div key={m.id} className="rounded-xl border bg-card p-3">
      <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{members.find(x=>x.user_id===m.author_id)?.display_name??(ar?"عضو":"Member")}</span><span>{new Date(m.created_at).toLocaleString(ar?"ar-JO":"en-US")}</span></div>
      {m.context_type!=="general"&&<p className="mt-1 text-xs font-semibold text-brand">{m.context_type==="outing"?(ar?"نزهة":"Outing"):(ar?"نصيحة":"Advice")}: {m.context_title}</p>}
      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{m.body}</p>
     </div>)}
    </div>
    <form onSubmit={send} className="space-y-2">
     {linkedOccasion&&<div className="rounded-xl border border-[#D7E4D5] bg-[#F5F9F2] p-3">
      <p className="text-xs text-muted-foreground">{ar?"لن تُشارك المناسبة إلا إذا اخترت إضافتها ثم إرسال الرسالة.":"Your occasion is private unless you deliberately add it to a message and send it."}</p>
      <button type="button" className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand" onClick={()=>{setContext(linkedOccasion.goal==="outing"?"outing":"advice");setTopic(linkedOccasion.occasionTitle.slice(0,120));}}>
       {ar?"أضف المناسبة كموضوع للنقاش":"Use occasion as discussion topic"}
      </button>
     </div>}
     <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs">{ar?"نوع النقاش":"Discussion type"}<select className="mt-1 w-full rounded-xl border bg-card p-2" value={context} onChange={e=>setContext(e.target.value as typeof context)}><option value="general">{ar?"سؤال عام":"General"}</option><option value="outing">{ar?"نزهة":"Outing"}</option><option value="advice">{ar?"طلب توصية":"Advice request"}</option></select></label>
      <label className="text-xs">{ar?"عنوان الموضوع (اختياري)":"Topic (optional)"}<Input className="mt-1" maxLength={120} value={topic} onChange={e=>setTopic(e.target.value)}/></label>
     </div>
     <textarea required maxLength={1500} value={body} onChange={e=>setBody(e.target.value)} rows={3} className="w-full resize-y rounded-xl border bg-card p-3 text-sm" placeholder={ar?"هل جرّب أحدكم هذا الطبيب أو المكان؟":"Has anyone tried this doctor or place?"}/>
     <Button disabled={busy||!body.trim()} type="submit"><Send className="size-4"/>{ar?"إرسال للمجموعة":"Send to circle"}</Button>
     <p className="text-xs text-muted-foreground">{ar?"تتحدث فقط مع أعضاء المجموعة. الرسائل تظهر بالتحديث التلقائي كل ست ثوانٍ.":"Only members can view this chat. Messages refresh every six seconds."}</p>
    </form>
   </section>}
  </>}
  {notice&&<p className="mt-3 rounded-xl bg-mint p-3 text-sm" role="status">{notice}</p>}
  {error&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
  <div className="mt-6 text-sm text-muted-foreground"><Link to="/experience" className="font-semibold text-brand">{ar?"ابحث عن تجارب الآخرين لمكان أو منتج محدد":"Look up experience notes for a specific place or product"} →</Link></div>
 </AppShell>
}
