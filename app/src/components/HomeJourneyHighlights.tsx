import {Link} from "@tanstack/react-router";
import {ArrowUpRight,CalendarDays,Cake,Compass,Gift,Heart,MapPin,ShieldCheck,ShoppingBasket,Sparkles,Stethoscope} from "lucide-react";
import {useMemo} from "react";
import {allFamilyMoments,dateKey,formatMomentDate,monthCells,occurrencesForDate,shiftDays,upcomingMoments,type FamilyMoment} from "@/lib/familyCalendar";
import {sampleMembers,type Member} from "@/lib/money";
import {daysUntil,leadAdvice} from "@/lib/occasionAdvisor";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";

export function HomeJourneyHighlights(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [events,,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const today=useMemo(()=>new Date(),[]);
 const personal=prefs.experienceMode==="individual"||(prefs.experienceMode!=="family"&&members.length===0);
 const combined=useMemo(()=>allFamilyMoments(events,members,ar),[events,members,ar]);
 const next=useMemo(()=>upcomingMoments(combined,today,60).slice(0,2),[combined,today]);
 const days=Array.from({length:7},(_,i)=>shiftDays(today,i));
 const fmtWeek=(d:Date)=>new Intl.DateTimeFormat(ar?"ar-JO":"en-US",{weekday:"narrow"}).format(d);
 const featured=next[0];
 const wait=featured?daysUntil(featured.occursOn,today):0;
 const quick=[
  {to:"/explore/together" as const,Icon:Compass,name:ar?"نخرج ونستمتع":"Go & enjoy",hint:ar?"نزهة تلائم الجميع":"Plan a good day"},
  {to:"/explore/smartbuy" as const,Icon:ShoppingBasket,name:ar?"قارن واختر":"Compare & choose",hint:ar?"قيمة حقيقية":"Choose real value"},
  {to:"/explore/services" as const,Icon:Stethoscope,name:ar?"اعثر على خدمة":"Find a service",hint:ar?"ما تحتاجه فعلًا":"What you really need"}
 ];
 return <div className="mt-5 space-y-5">
  <section aria-label={ar?"أسبوعك":"Your week"} className="rounded-3xl border border-border bg-white p-4 sm:p-5">
   <div className="flex items-center justify-between gap-3">
    <div>
     <p className="text-[11px] font-semibold tracking-wider text-[#B38364]">{ar?"أيام بسيطة، لحظات مهمة":"LITTLE MOMENTS, WELL PLANNED"}</p>
     <h2 className="mt-1 text-lg font-semibold text-ink">{personal?(ar?"أسبوعك القادم":"Your week ahead"):(ar?"أسبوعنا الجميل":"Our week ahead")}</h2>
    </div>
    <Link to="/calendar" className="inline-flex items-center gap-1 rounded-xl bg-mint px-3 py-2 text-xs font-semibold text-brand"><CalendarDays className="size-4"/>{ar?"التقويم":"Calendar"}</Link>
   </div>
   <div className="mt-3 grid grid-cols-7 gap-1.5">
    {days.map((d,i)=>{
     const key=dateKey(d),has=occurrencesForDate(combined,key).length>0;
     return <Link to="/calendar" key={key} aria-label={(ar?"عرض ":"View ")+key} className={"flex min-h-15 flex-col items-center justify-center gap-1 rounded-xl text-center text-sm transition hover:ring-1 hover:ring-brand/30 "+(i===0?"bg-brand text-white":d.getDay()===5||d.getDay()===6?"bg-[#FBF2E6] text-ink":"bg-[#F6F7F2] text-ink")}>
      <span className={"text-[11px] "+(i===0?"text-white/75":"text-muted-foreground")}>{fmtWeek(d)}</span>
      <span className="font-semibold tabular-nums">{d.getDate()}</span>
      <span className={"size-1.5 rounded-full "+(has?(i===0?"bg-[#F6CDAA]":"bg-[#C48E75]"):"bg-transparent")}/>
     </Link>;
    })}
   </div>
   {!eventsReady||!membersReady?<p className="mt-3 text-xs text-muted-foreground">{ar?"جارٍ التحميل":"Loading moments…"}</p>:
   featured?<div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#FBF6F0] p-3.5">
     <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#B87E70]">{featured.kind==="birthday"?<Cake className="size-5"/>:featured.kind==="anniversary"?<Heart className="size-5"/>:<Gift className="size-5"/>}</span>
     <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{featured.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatMomentDate(featured.occursOn,ar)} · {wait===0?(ar?"اليوم":"Today"):(ar?"بعد ":"In ")+wait+(ar?" يوم":" days")}</p>
      {prefs.lifestyle&&prefs.notificationFrequency!=="off"&&<p className="mt-1 text-xs text-muted-foreground">{leadAdvice(wait,ar)}</p>}
     </div>
     <Link to="/occasions" aria-label={ar?"حضّر لهذه المناسبة":"Plan for this occasion"} className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand">{ar?"حضّر":"Prepare"} <ArrowUpRight className="inline size-3"/></Link>
   </div>:
   <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-[#FBF6F0] p-3.5">
    <p className="text-sm text-muted-foreground">{ar?"أضف موعدًا مهمًا أو مناسبة تحب الاحتفال بها.":"Add a date that matters to you—big or small."}</p>
    <Link to="/calendar" className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand">{ar?"أضف":"Add"} +</Link>
   </div>}
  </section>
  <section aria-label={ar?"ما الذي تريد فعله؟":"Choose your next step"}>
   <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="text-lg font-semibold">{ar?"ماذا تحب أن تفعل؟":"What would you like to do?"}</h2>
    <Link to="/explore" className="text-xs font-semibold text-brand">{ar?"كل الخيارات":"All choices"} →</Link>
   </div>
   <div className="grid grid-cols-3 gap-2.5">
    {quick.map(({to,Icon,name,hint})=><Link to={to} key={to} className="flex min-h-35 flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-[0_5px_18px_-15px_rgba(35,62,48,0.36)] transition hover:-translate-y-0.5 hover:border-brand/30 sm:p-4">
      <span className="grid size-10 place-items-center rounded-2xl bg-mint text-brand"><Icon className="size-5"/></span>
      <span className="block"><span className="block text-sm font-semibold leading-tight">{name}</span><span className="mt-1 hidden text-xs text-muted-foreground sm:block">{hint}</span></span>
    </Link>)}
   </div>
  </section>
 </div>;
}
