import {createFileRoute,Link} from "@tanstack/react-router";
import {Copy,KeyRound,LockKeyhole,ShieldCheck,UserPlus,Users,Trash2} from "lucide-react";
import {useEffect,useState,type FormEvent} from "react";
import type {User} from "@supabase/supabase-js";
import {AppShell} from "@/components/AppShell";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useI18n} from "@/lib/i18n";
import {supabase} from "@/integrations/supabase/client";
import {
 HOUSEHOLD_ACCOUNTS_ENABLED,acceptAdultInvitation,createAdultInvitation,createHousehold,
 leaveHousehold,loadHouseholdRoster,loadMyHouseholds,loadPendingInvitations,
 revokeAdultMembership,revokeInvitation,
 type AuthenticatedHousehold,type HouseholdRosterMember,type PendingHouseholdInvite
} from "@/lib/householdAccounts";

export const Route=createFileRoute("/household")({
 head:()=>({meta:[
  {title:"Household accounts — Dabberna"},
  {name:"description",content:"Private authenticated household memberships, separate from family and friends circles. Financial synchronization is not active."}
 ]}),
 component:HouseholdAccountsPage
});

function HouseholdAccountsPage(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [user,setUser]=useState<User|null>(null);
 const [authLoading,setAuthLoading]=useState(true);
 const [email,setEmail]=useState("");
 const [householdName,setHouseholdName]=useState("");
 const [displayName,setDisplayName]=useState("");
 const [invitationInput,setInvitationInput]=useState("");
 const [issuedCode,setIssuedCode]=useState("");
 const [households,setHouseholds]=useState<AuthenticatedHousehold[]>([]);
 const [activeId,setActiveId]=useState("");
 const [roster,setRoster]=useState<HouseholdRosterMember[]>([]);
 const [pending,setPending]=useState<PendingHouseholdInvite[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [loadingData,setLoadingData]=useState(false);

 useEffect(()=>{
  if(!HOUSEHOLD_ACCOUNTS_ENABLED)return;
  let mounted=true;
  supabase.auth.getUser().then(({data,error})=>{
   if(mounted){setUser(error?null:data.user);setAuthLoading(false);}
  }).catch(()=>{if(mounted){setUser(null);setAuthLoading(false);}});
  const {data}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(mounted){
    setUser(session?.user??null);
    if(!session){setHouseholds([]);setActiveId("");setIssuedCode("");setRoster([]);setPending([]);}
   }
  });
  return ()=>{mounted=false;data.subscription.unsubscribe();};
 },[]);

 const reload=async()=>{
  setLoadingData(true);
  try{
   const next=await loadMyHouseholds();
   setHouseholds(next);
   setActiveId(id=>next.some(h=>h.household_id===id)?id:next[0]?.household_id??"");
  }finally{setLoadingData(false);}
 };
 useEffect(()=>{
  if(!HOUSEHOLD_ACCOUNTS_ENABLED||!user){return;}
  let active=true;
  void loadMyHouseholds().then(list=>{
    if(active){setHouseholds(list);setActiveId(id=>list.some(h=>h.household_id===id)?id:list[0]?.household_id??"");}
  }).catch(e=>{if(active)setError(e instanceof Error?e.message:String(e));});
  return ()=>{active=false;};
 },[user?.id]);

 const chosen=households.find(h=>h.household_id===activeId);
 useEffect(()=>{
  if(!HOUSEHOLD_ACCOUNTS_ENABLED||!user||!chosen||chosen.my_role!=="owner"){
   setRoster([]);setPending([]);return;
  }
  let active=true;
  void Promise.all([loadHouseholdRoster(chosen.household_id),loadPendingInvitations(chosen.household_id)])
   .then(([members,invites])=>{if(active){setRoster(members);setPending(invites);}})
   .catch(e=>{if(active)setError(e instanceof Error?e.message:String(e));});
  return ()=>{active=false;};
 },[user?.id,chosen?.household_id,chosen?.my_role]);

 const run=async(action:()=>Promise<void>)=>{
  if(busy)return;
  setBusy(true);setError("");setMessage("");
  try{await action();}catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 };
 const sendLink=(e:FormEvent)=>{
  e.preventDefault();
  void run(async()=>{
   const address=email.trim();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw new Error(ar?"أدخل بريداً إلكترونياً صحيحاً":"Enter a valid email address");
   const redirect=window.location.origin+import.meta.env.BASE_URL+"#/household";
   const {error}=await supabase.auth.signInWithOtp({email:address,options:{emailRedirectTo:redirect}});
   if(error)throw error;
   setMessage(ar?"إذا كانت الخدمة متاحة، راجع بريدك لفتح رابط الدخول.":"If enabled, check your email for a sign-in link.");
  });
 };
 const create=(e:FormEvent)=>{
  e.preventDefault();
  void run(async()=>{
   const id=await createHousehold(householdName,displayName);
   await reload();setActiveId(id);setHouseholdName("");
   setMessage(ar?"تم إنشاء مساحة الأسرة. لم يتم رفع أي بيانات مالية.":"Household created. No financial data was uploaded.");
  });
 };
 const join=(e:FormEvent)=>{
  e.preventDefault();
  void run(async()=>{
   const id=await acceptAdultInvitation(invitationInput,displayName);
   await reload();setActiveId(id);setInvitationInput("");
   setMessage(ar?"تم قبول الدعوة. لم يتم مشاركة المصاريف أو نقلها.":"Invitation accepted. No spending data was transferred or shared.");
  });
 };
 const issue=()=>void run(async()=>{
  if(!chosen)throw new Error("Choose a household");
  const code=await createAdultInvitation(chosen.household_id);
  setIssuedCode(code);
  setPending(await loadPendingInvitations(chosen.household_id));
  setMessage(ar?"دعوة صالحة لمدة ٧٢ ساعة ولا تستخدم إلا مرة واحدة.":"Invitation valid for 72 hours and one use only.");
 });
 const removeMember=(member:HouseholdRosterMember)=>void run(async()=>{
  if(!chosen||!window.confirm(ar?"إلغاء وصول هذا الشخص لمساحة الأسرة؟":"Revoke this adult's household access?"))return;
  await revokeAdultMembership(chosen.household_id,member.user_id);
  setRoster(await loadHouseholdRoster(chosen.household_id));
  setMessage(ar?"أُلغي الوصول.":"Household access revoked.");
 });
 const revoke=(inviteId:string)=>void run(async()=>{
  if(!chosen||!window.confirm(ar?"إلغاء هذه الدعوة؟":"Revoke this unused invitation?"))return;
  await revokeInvitation(chosen.household_id,inviteId);
  setPending(await loadPendingInvitations(chosen.household_id));
  setIssuedCode("");
  setMessage(ar?"أُلغيت الدعوة.":"Invitation revoked.");
 });
 const exit=()=>void run(async()=>{
  if(!chosen||!window.confirm(ar?"مغادرة مساحة الأسرة؟":"Leave this household?"))return;
  await leaveHousehold(chosen.household_id);
  await reload();
  setMessage(ar?"تمت مغادرة مساحة الأسرة.":"You have left the household.");
 });
 const copyCode=()=>void run(async()=>{
  if(!issuedCode)return;
  await navigator.clipboard.writeText(issuedCode);
  setMessage(ar?"تم نسخ رمز الدعوة. شاركه فقط مع الشخص المقصود.":"Invitation code copied. Share privately with the intended adult.");
 });

 if(!HOUSEHOLD_ACCOUNTS_ENABLED)return <AppShell title={ar?"حسابات الأسرة":"Household accounts"}>
   <section className="editorial-card p-5">
    <div className="flex items-center gap-3"><LockKeyhole className="size-7 text-brand"/><h2 className="text-lg font-semibold">{ar?"نحضّر مساحة خاصة وآمنة للأسرة":"Secure household access is in preparation"}</h2></div>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ar?
      "المصاريف وخطط الأسرة لا تزال محفوظة على جهازك فقط. حسابات أفراد الأسرة والدعوات والمزامنة غير مفعّلة في هذه النسخة.":
      "Your finances and family plans remain on this device. Shared household accounts, invitations and financial synchronization are not enabled in the public pilot."}</p>
    <Link to="/space" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white">{ar?"رجوع للعائلة":"Return to My Family"}</Link>
   </section>
  </AppShell>;

 return <AppShell title={ar?"حسابات الأسرة":"Household accounts"}>
  <section className="page-intro p-4 sm:p-6">
   <div className="flex items-start gap-3"><ShieldCheck className="size-7 shrink-0 text-brand"/>
    <div><h2 className="text-lg font-semibold">{ar?"حسابات موثقة مع خصوصية واضحة":"Verified membership, clear privacy"}</h2>
     <p className="mt-2 text-sm leading-relaxed">{ar?
       "هذه مساحة عضوية منفصلة عن مجموعات الأصدقاء. الدخول والدعوات للبالغين فقط. ميزانية البيت والمصاريف الخاصة تبقى على هذا الجهاز—ولا تتم مزامنتها هنا.":
       "Household membership is separate from friends' circles. Invitations are for verified adult accounts only. Your private expenses, cash and family plans remain on this device; this page does not synchronize them."}</p></div>
   </div>
  </section>
  {error&&<p role="alert" className="mt-4 rounded-xl border border-[#EDC9C9] bg-[#FFF2F2] p-3 text-sm text-[#92474B]">{error}</p>}
  {message&&<p role="status" className="mt-4 rounded-xl bg-[#EDF5EB] p-3 text-sm text-brand">{message}</p>}
  {authLoading?<p className="mt-4 text-sm text-muted-foreground">{ar?"نتحقق من تسجيل الدخول":"Checking sign-in…"}</p>:!user?(
   <form onSubmit={sendLink} className="editorial-card mt-5 space-y-3 p-5">
    <h3 className="font-semibold">{ar?"ادخل بالبريد الإلكتروني":"Sign in with your email"}</h3>
    <p className="text-xs text-muted-foreground">{ar?"يتطلب تسجيل الدخول رابطاً عبر البريد. لا ترسل رمز الدعوة مع معلومات الأطفال أو البيانات المالية.":"Sign-in requires an email link. Don't include child details or financial information with an invitation."}</p>
    <Input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <Button disabled={busy} type="submit"><KeyRound className="size-4"/>{ar?"أرسل الرابط":"Send sign-in link"}</Button>
   </form>
  ):(
   <>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
     <p className="text-muted-foreground">{user.email??(ar?"تم تسجيل الدخول":"Signed in")}</p>
     <Button size="sm" variant="outline" disabled={busy} onClick={()=>void run(async()=>{
      const {error}=await supabase.auth.signOut();
      if(error)throw error;
      setIssuedCode("");
     })}>{ar?"تسجيل الخروج":"Sign out"}</Button>
    </div>
    <div className="editorial-card mt-4 space-y-3 p-4">
     <h3 className="font-semibold">{ar?"اسمك عند أفراد الأسرة":"Your household display name"}</h3>
     <Input value={displayName} maxLength={40} onChange={e=>setDisplayName(e.target.value)}
       placeholder={ar?"الاسم الذي تريد إظهاره":"Name to show other adults"}/>
     <p className="text-xs text-muted-foreground">{ar?"اختياري حتى تقرر إنشاء أو قبول دعوة. ليس له علاقة باسمك في مجموعات الأصدقاء.":"Used only when creating or joining a household; separate from your community display name."}</p>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
     <form onSubmit={create} className="editorial-card space-y-3 p-4">
      <h3 className="flex items-center gap-2 font-semibold"><Users className="size-5 text-brand"/>{ar?"إنشاء مساحة الأسرة":"Create a household"}</h3>
      <Input required minLength={2} maxLength={70} value={householdName} onChange={e=>setHouseholdName(e.target.value)}
       placeholder={ar?"مثل: بيتنا":"e.g. Our home"}/>
      <Button type="submit" disabled={busy||displayName.trim().length<2}>{ar?"أنشئ":"Create"}</Button>
     </form>
     <form onSubmit={join} className="editorial-card space-y-3 p-4">
      <h3 className="flex items-center gap-2 font-semibold"><UserPlus className="size-5 text-brand"/>{ar?"الانضمام بدعوة":"Join with an invitation"}</h3>
      <Input required minLength={64} maxLength={64} autoComplete="off" spellCheck={false}
       value={invitationInput} onChange={e=>setInvitationInput(e.target.value)}
       placeholder={ar?"رمز دعوة من الشخص المسؤول":"Private invitation code from the owner"}/>
      <Button type="submit" disabled={busy||displayName.trim().length<2||invitationInput.trim().length!==64}>{ar?"قبول الدعوة":"Accept invitation"}</Button>
     </form>
    </div>
    <section className="editorial-card mt-5 p-4">
     <h3 className="font-semibold">{ar?"المساحات التي انضممت إليها":"Your households"}</h3>
     {loadingData&&<p className="mt-2 text-xs text-muted-foreground">{ar?"جارٍ التحديث":"Refreshing…"}</p>}
     {households.length===0?<p className="mt-2 text-sm text-muted-foreground">{ar?"لا توجد عضوية مفعّلة بعد.":"No active membership yet."}</p>:
      <div className="mt-3 flex flex-wrap gap-2">{households.map(h=>
       <button key={h.household_id} type="button" onClick={()=>{setActiveId(h.household_id);setIssuedCode("");}}
        className={"min-h-11 rounded-xl border px-3 text-sm font-semibold "+(activeId===h.household_id?"border-brand bg-[#EAF2E8] text-brand":"border-border bg-white")}>
        {h.household_name} · {h.my_role==="owner"?(ar?"مسؤول":"Owner"):(ar?"بالغ":"Adult")}
       </button>)}</div>}
     {chosen&&<div className="mt-4 rounded-xl border border-border bg-white p-4">
      <h4 className="font-semibold">{chosen.household_name}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{ar?
       "العضوية موثّقة، لكن لا يتيح ذلك الاطلاع على مصاريف أي شخص. مشاركة المعلومات المالية تحتاج موافقة منفصلة وإعداداً أمنياً إضافياً.":
       "Membership does not grant access to another person's spending. Financial sharing requires a separate consent and security rollout."}</p>
      {chosen.my_role==="owner"?<>
       <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" disabled={busy} onClick={issue}><UserPlus className="size-4"/>{ar?"أنشئ دعوة لشخص بالغ":"Invite an adult"}</Button>
        <span className="text-xs text-muted-foreground">{ar?"صالحة ٧٢ ساعة، استخدام مرة واحدة":"72 hours · single use"}</span>
       </div>
       {issuedCode&&<div className="mt-3 rounded-xl border border-[#D6E5D4] bg-[#F2F7EF] p-3">
        <p className="text-xs font-semibold">{ar?"انسخ الرمز الآن، لن نعرضه مرة أخرى بعد إغلاق الصفحة.":"Copy this code now; it won't be shown again after you leave."}</p>
        <p className="mt-2 break-all font-mono text-xs">{issuedCode}</p>
        <div className="mt-2 flex flex-wrap gap-2">
         <Button size="sm" type="button" variant="outline" onClick={copyCode}><Copy className="size-4"/>{ar?"نسخ الرمز":"Copy code"}</Button>
         <Button size="sm" type="button" variant="ghost" onClick={()=>setIssuedCode("")}>{ar?"إخفاء الرمز":"Hide code"}</Button>
        </div>
       </div>}
       <div className="mt-4">
        <h5 className="text-sm font-semibold">{ar?"الأعضاء الحاليون":"Active adults"}</h5>
        {roster.map(m=><div key={m.user_id} className="mt-2 flex items-center justify-between gap-2 border-b border-border/70 py-2 text-sm">
         <div><p>{m.display_name}</p><p className="text-xs text-muted-foreground">{m.member_role==="owner"?(ar?"المسؤول":"Owner"):(ar?"بالغ":"Adult")}</p></div>
         {m.member_role==="adult"&&<Button disabled={busy} type="button" size="sm" variant="outline" onClick={()=>removeMember(m)}><Trash2 className="size-4"/>{ar?"إلغاء الوصول":"Revoke access"}</Button>}
        </div>)}
       </div>
       {pending.length>0&&<div className="mt-4">
        <h5 className="text-sm font-semibold">{ar?"دعوات لم تُستخدم":"Unused invitations"}</h5>
        {pending.map(p=><div key={p.invite_id} className="mt-2 flex items-center justify-between gap-2 border-b border-border/70 py-2 text-xs">
         <p>{ar?"تنتهي":"Expires"}: {new Date(p.expires_at).toLocaleString(ar?"ar-JO":"en-GB")}</p>
         <Button size="sm" type="button" variant="outline" disabled={busy} onClick={()=>revoke(p.invite_id)}>{ar?"إلغاء":"Revoke"}</Button>
        </div>)}
       </div>}
      </>:<Button type="button" size="sm" variant="outline" disabled={busy} className="mt-3" onClick={exit}>
       {ar?"مغادرة مساحة الأسرة":"Leave household"}
      </Button>}
     </div>}
    </section>
   </>
  )}
  <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{ar?
   "حسابات الأسرة ومجموعات الأصدقاء منفصلة تماماً. معلومات العائلة والصور والمصاريف الموجودة في هذا المتصفح لا تُنسخ تلقائياً عند تسجيل الدخول أو قبول الدعوة.":
   "Household accounts are entirely separate from community groups. Local profiles, photographs, expenses and plans are never uploaded automatically on sign-in or invitation acceptance."}</p>
 </AppShell>;
}
