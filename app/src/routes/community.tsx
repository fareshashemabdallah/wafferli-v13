import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, HeartHandshake, LockKeyhole, LogOut, MessageCircle, Plus, ShieldCheck, Users, UserRoundPlus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  communityAuth, communityInviteLink, createCommunityGroup, inviteCommunityMember,
  acceptCommunityInvite, getCommunityGroups, getCommunityMembers, leaveCommunityGroup,
  type CommunityGroup, type CommunityMember, type ReviewType
} from "@/lib/community";
import { CommunityChat } from "@/components/CommunityChat";
import { CommunityReviews } from "@/components/CommunityReviews";

type TopicKind = "general"|"outing"|"advice";
export const Route=createFileRoute("/community")({
  validateSearch:(search:Record<string,unknown>)=>({
    invite:typeof search.invite==="string"?search.invite.slice(0,80):undefined,
    topic:typeof search.topic==="string"?search.topic.slice(0,120):"",
    kind:search.kind==="outing"||search.kind==="advice"?search.kind as TopicKind:"general" as TopicKind,
    category:typeof search.category==="string"?search.category:"restaurant",
    item:typeof search.item==="string"?search.item.slice(0,100):"",
    area:typeof search.area==="string"?search.area.slice(0,80):""
  }),
  head:()=>({meta:[{title:"Community — Dabberna"},{name:"description",content:"Private family networks, outing chat and firsthand reviews visible only when viewing a named place or item."}]}),
  component:Community
});
function Community(){
  const {lang}=useI18n();const ar=lang==="ar";
  const search=Route.useSearch();
  const [user,setUser]=useState<User|null>(null),[authReady,setAuthReady]=useState(false);
  const [email,setEmail]=useState(""),[code,setCode]=useState(""),[mailSent,setMailSent]=useState(false);
  const [nickname,setNickname]=useState("");
  const [groups,setGroups]=useState<CommunityGroup[]>([]),[selected,setSelected]=useState("");
  const [members,setMembers]=useState<CommunityMember[]>([]);
  const [groupName,setGroupName]=useState(""),[description,setDescription]=useState("");
  const [shareLink,setShareLink]=useState("");
  const [panel,setPanel]=useState<"chat"|"reviews">(search.item?"reviews":"chat");
  const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true;
    communityAuth.current().then(({data})=>{if(active){setUser(data.user);setAuthReady(true);}}).catch(()=>{if(active)setAuthReady(true);});
    const {data:{subscription}}=communityAuth.subscribe(u=>{if(active){setUser(u);setAuthReady(true);}});
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);
  const refresh=useCallback(async()=>{
    if(!user){setGroups([]);setSelected("");return;}
    const gs=await getCommunityGroups();setGroups(gs);
    setSelected(previous=>gs.some(g=>g.id===previous)?previous:(gs[0]?.id??""));
  },[user]);
  useEffect(()=>{refresh().catch(e=>setError(e instanceof Error?e.message:String(e)));},[refresh]);
  useEffect(()=>{
    if(!selected){setMembers([]);return;}
    getCommunityMembers(selected).then(setMembers).catch(()=>setMembers([]));
  },[selected]);
  const execute=async(action:()=>Promise<void>)=>{
    setError("");setNotice("");setBusy(true);
    try{await action();}catch(e){setError(e instanceof Error?e.message:"Something went wrong");}
    finally{setBusy(false);}
  };
  const invite=async()=>execute(async()=>{
    if(!selected) return;
    const token=await inviteCommunityMember(selected);
    const link=communityInviteLink(token);
    setShareLink(link);
    setNotice(ar?"رابط الدعوة صالح لأسبوع. يمكن لأي شخص يملك الرابط الانضمام بحساب موثّق، لذا شاركه مع أشخاص تثق بهم فقط.":"Invitation link expires in seven days. Anyone with it can join with a signed-in account; share only with trusted people.");
    if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(link).catch(()=>{});
  });
  const sendEmail=async(e:FormEvent)=>{e.preventDefault();await execute(async()=>{
    const {error}=await communityAuth.sendEmail(email.trim());
    if(error)throw Error(error.message);
    setMailSent(true);
    setNotice(ar?"أرسلنا رابط تسجيل الدخول أو رمز التحقق إلى بريدك.":"Check your email for a sign-in link or verification code.");
  });};
  const confirm=async(e:FormEvent)=>{e.preventDefault();await execute(async()=>{
    const {error}=await communityAuth.confirmCode(email.trim(),code.trim());
    if(error)throw Error(error.message);
    setCode("");setNotice(ar?"تم تسجيل الدخول":"Signed in");
  });};
  const join=async()=>execute(async()=>{
    if(!search.invite)return;
    await acceptCommunityInvite(search.invite,nickname.trim());
    await refresh();
    setNotice(ar?"انضممت إلى المجموعة. يمكنك الآن مراسلة الأعضاء.":"You joined the group; you can now chat with its members.");
  });
  const create=async(e:FormEvent)=>{e.preventDefault();await execute(async()=>{
    const id=await createCommunityGroup(groupName.trim(),description.trim(),nickname.trim());
    setGroupName("");setDescription("");
    await refresh();setSelected(id);
    setNotice(ar?"تم إنشاء المجموعة. ادعُ الأعضاء باستخدام رابط خاص.":"Group created. Invite your members using a private link.");
  });};
  return <AppShell title={ar?"مجتمع العائلة":"Family Community"}>
    <section className="rounded-3xl border border-border bg-mint/60 p-5">
      <div className="flex items-start gap-3"><HeartHandshake className="size-8 shrink-0 text-brand"/>
        <div><h2 className="text-xl font-semibold">{ar?"دوائرك الموثوقة":"Your trusted circles"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{ar?"أنشئ مجموعات للأصدقاء أو أولياء الأمور، تناقشوا حول النزهات والخدمات، وشاركوا التجارب الشخصية عند البحث عن مكان محدد.":"Private groups for school parents, friends and family. Discuss outings and advice; read firsthand experiences only when looking up a particular place or item."}</p>
        </div>
      </div>
    </section>
    {!authReady?<p className="mt-5 text-sm text-muted-foreground">{ar?"جارٍ التحقق من الحساب…":"Checking your account…"}</p>:
    !user?<section className="card-soft mt-5 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><LockKeyhole className="size-5"/>{ar?"تسجيل الدخول للمجموعات الخاصة":"Sign in for private groups"}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{ar?"الدخول بالبريد الإلكتروني مطلوب لحماية المحادثات. بيانات الميزانية العائلية لا تتم مشاركتها مع أعضاء المجموعات.":"Email sign-in protects private conversations. Your financial and household records are never shared with groups."}</p>
      <form onSubmit={sendEmail} className="mt-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="community-email">{ar?"البريد الإلكتروني":"Email"}</label>
        <Input id="community-email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="min-w-48 flex-1"/>
        <Button type="submit" disabled={busy}>{ar?"إرسال رابط الدخول":"Email sign-in link"}</Button>
      </form>
      {mailSent&&<form onSubmit={confirm} className="mt-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="community-code">{ar?"رمز التحقق":"Verification code"}</label>
        <Input id="community-code" required value={code} onChange={e=>setCode(e.target.value)} placeholder={ar?"رمز التحقق من البريد (إن وجد)":"Email code (if supplied)"} className="min-w-48 flex-1"/>
        <Button type="submit" variant="outline" disabled={busy}>{ar?"تأكيد":"Verify"}</Button>
      </form>}
    </section>:
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground"><ShieldCheck className="me-1 inline size-4"/>{ar?"جلسة شخصية آمنة، وليست مرتبطة ببيانات الميزانية":"Signed-in community account; financial data stays separate"}</p>
        <Button variant="outline" size="sm" onClick={()=>communityAuth.signOut().catch(()=>{})}><LogOut className="size-4"/>{ar?"خروج":"Sign out"}</Button>
      </div>
      <section className="card-soft mt-4 p-4">
        <h2 className="flex items-center gap-2 font-semibold"><Users className="size-5 text-brand"/>{ar?"مجموعاتك":"Your groups"}</h2>
        {groups.length>0&&<div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <select className="min-h-11 rounded-xl border border-border bg-card p-3" value={selected} onChange={e=>{setSelected(e.target.value);setShareLink("");}}>
            {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Button onClick={invite} variant="outline" disabled={!selected||busy}><Copy className="size-4"/>{ar?"دعوة أعضاء":"Invite members"}</Button>
        </div>}
        {shareLink&&<p className="mt-2 break-all rounded-xl bg-muted p-3 text-sm"><a className="underline" href={shareLink}>{shareLink}</a></p>}
        {groups.length===0&&<p className="mt-3 text-sm text-muted-foreground">{ar?"لا توجد مجموعات بعد. أنشئ واحدة أو افتح دعوة وصلتك.":"No groups yet. Create one or use an invitation from a friend."}</p>}
        {selected&&members.length>0&&<p className="mt-2 text-xs text-muted-foreground">{ar?"الأعضاء":"Members"}: {members.map(m=>m.display_name).join(" · ")}</p>}
        {selected && <Button className="mt-3" size="sm" variant="ghost" onClick={()=>execute(async()=>{
          await leaveCommunityGroup(selected);await refresh();
        })} disabled={busy || groups.find(g=>g.id===selected)?.creator_id===user.id}>{ar?"مغادرة المجموعة":"Leave group"}</Button>}
      </section>
      {search.invite&&<section className="card-soft mt-4 p-4">
        <h2 className="flex items-center gap-2 font-semibold"><UserRoundPlus className="size-5"/>{ar?"دعوة إلى مجموعة":"Group invitation"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ar?"لن يتم ضمّك حتى تضغط على زر الانضمام. لا تشارك هذا الرابط علناً.":"Joining requires your confirmation. Keep this invite link private."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input placeholder={ar?"الاسم الظاهر للآخرين":"Your display name (not an email)"} value={nickname} maxLength={40} onChange={e=>setNickname(e.target.value)} className="min-w-48 flex-1"/>
          <Button disabled={busy||nickname.trim().length<2} onClick={join}>{ar?"انضم إلى المجموعة":"Join group"}</Button>
        </div>
      </section>}
      <section className="card-soft mt-4 p-4">
        <h2 className="flex items-center gap-2 font-semibold"><Plus className="size-5"/>{ar?"أنشئ مجموعة":"Create a group"}</h2>
        <form onSubmit={create} className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-sm">{ar?"اسم المجموعة":"Group name"}<Input className="mt-1" required minLength={3} maxLength={70} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder={ar?"أهالي المدرسة":"School parents"}/></label>
          <label className="text-sm">{ar?"اسمك الظاهر في المجموعة":"Your display name"}<Input className="mt-1" required minLength={2} maxLength={40} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder={ar?"الاسم الأول":"First name"}/></label>
          <label className="text-sm sm:col-span-2">{ar?"الوصف (اختياري)":"Description (optional)"}<Input className="mt-1" maxLength={250} value={description} onChange={e=>setDescription(e.target.value)}/></label>
          <Button disabled={busy} className="sm:col-span-2"><Plus className="size-4"/>{ar?"إنشاء المجموعة":"Create private group"}</Button>
        </form>
      </section>
      {selected&&<section className="mt-5">
        <div className="mb-3 flex gap-2">
          <Button variant={panel==="chat"?"default":"outline"} onClick={()=>setPanel("chat")}><MessageCircle className="size-4"/>{ar?"المحادثات":"Group chat"}</Button>
          <Button variant={panel==="reviews"?"default":"outline"} onClick={()=>setPanel("reviews")}>{ar?"تجارب وآراء":"Experience reviews"}</Button>
        </div>
        {panel==="chat"
          ?<CommunityChat key={selected+search.kind+search.topic} groupId={selected} currentUserId={user.id} kind={search.kind} topic={search.topic}/>
          :<CommunityReviews key={selected+search.category+search.item+search.area} groupId={selected} currentUserId={user.id}
            initialType={search.category as ReviewType} initialName={search.item} initialArea={search.area}/>}
      </section>}
    </>}
    {(error||notice)&&<div role="status" className={"mt-4 rounded-xl p-3 text-sm "+(error?"border border-destructive/30 bg-red-50 text-red-800":"bg-mint text-ink")}>{error||notice}</div>}
    <p className="mt-5 text-xs text-muted-foreground">{ar?"لا تنشروا أسماء الأطفال أو بياناتهم الصحية، أو معلومات شخصية عن الآخرين. الآراء مسؤولية أصحابها وليست توصيات من دبّرنا. بلّغوا عن أي محتوى مسيء.":"Do not post children's names, health details or third-party private information. Opinions belong to their authors, not Dabberna. Report abusive or misleading content."}</p>
    <Link to="/explore" className="mt-3 inline-block text-sm font-semibold text-brand">{ar?"العودة للاستكشاف":"Back to Discover"} ↗</Link>
  </AppShell>;
}
