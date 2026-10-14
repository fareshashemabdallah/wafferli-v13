import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Cake, ChevronRight, Gift, Heart, Plus, Sun } from "lucide-react";
import { useMemo } from "react";
import { calendarWithMemberBirthdays,dateKey,formatMomentDate,kindNames,nextJordanWeekend,shiftDays,upcomingMoments,type FamilyMoment } from "@/lib/familyCalendar";
import { sampleMembers,type Member } from "@/lib/money";
import { useI18n } from "@/lib/i18n";
import { useLocalState } from "@/lib/storage";

export function FamilyCalendarHighlights() {
 const {lang}=useI18n();
 const ar=lang==="ar";
 const [saved,,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const events=useMemo(()=>calendarWithMemberBirthdays(saved,members,lang),[saved,members,lang]);
 const ready=eventsReady&&membersReady;
 const now=useMemo(()=>new Date(),[]);
 const today=dateKey(now);
 const upcoming=useMemo(()=>upcomingMoments(events,now,35).slice(0,3),[events,now]);
 const friday=dateKey(nextJordanWeekend(now));
 const weekdays=Array.from({length:7},(_,i)=>shiftDays(now,i));
 const fmt=(d:Date)=>new Intl.DateTimeFormat(ar?"ar-JO":"en-US",{weekday:"short"}).format(d);
 return <section className="mt-4 space-y-3" aria-label={ar?"تقويم العائلة":"Family calendar"}>
  <div className="flex items-center justify-between gap-2">
   <div>
    <p className="text-xs font-medium tracking-wide text-brand">{ar?"المناسبات الصغيرة تصنع ذكريات جميلة":"MAKE ROOM FOR THE MOMENTS THAT MATTER"}</p>
    <h2 className="mt-1 text-xl font-semibold text-ink">{ar?"أيامنا معاً":"Our moments together"}</h2>
   </div>
   <Link to="/calendar" className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-brand">
    <CalendarDays className="size-4" aria-hidden="true"/>{ar?"التقويم":"Calendar"}
   </Link>
  </div>
  <div className="card-soft p-4 sm:p-5">
   <div className="grid grid-cols-7 gap-1.5">
    {weekdays.map(d=>{
     const key=dateKey(d);
     const todayCell=key===today,weekend=d.getDay()===5||d.getDay()===6;
     const hasEvent=events.some(e=>e.annual?e.date.slice(5)===key.slice(5)&&key>=e.date:e.date===key);
     return <Link key={key} to="/calendar" aria-label={(ar?"عرض يوم ":"View day ")+key}
        className={"flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl border text-center transition hover:border-brand/40 " + (todayCell?"border-brand bg-mint text-brand":"border-transparent "+(weekend?"bg-[#FCF4E7] text-ink":"bg-muted/40 text-ink"))}>
       <span className="text-[10px] font-medium text-muted-foreground">{fmt(d)}</span>
       <span className="text-base font-semibold tabular-nums">{d.getDate()}</span>
       <span className={"size-1.5 rounded-full "+(hasEvent?"bg-[#C48E75]":todayCell?"bg-brand":"bg-transparent")}/>
     </Link>;
    })}
   </div>
   <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#FBF4E9] p-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#B48960]"><Sun className="size-5"/></span>
    <div className="flex-1">
     <p className="text-sm font-semibold text-ink">{ar?"عطلة نهاية الأسبوع":"Your next weekend"}</p>
     <p className="mt-0.5 text-xs text-muted-foreground">{ar?"الجمعة والسبت — أقرب جمعة ":"Friday & Saturday · Next Friday "} · {formatMomentDate(friday,ar)}. {ar?"اختر تجربة تناسب العائلة وميزانيتها.":"Make time for something everyone will enjoy."}</p>
    </div>
   </div>
   <div className="mt-4">
    <div className="flex items-center justify-between gap-2">
     <h3 className="text-sm font-semibold">{ar?"المناسبات القادمة":"Coming up"}</h3>
     <Link to="/calendar" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">{ar?"أضف مناسبة":"Add an occasion"} <Plus className="size-3.5"/></Link>
    </div>
    {!ready ? <p className="mt-2 text-sm text-muted-foreground">{ar?"جارٍ تحميل التقويم...":"Loading your calendar…"}</p>
    :upcoming.length===0 ? <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-3">
      <Gift className="size-5 shrink-0 text-[#C28A70]"/>
      <p className="text-sm text-muted-foreground">{ar?"لا توجد مناسبات محفوظة بعد. ابدأ بأعياد الميلاد أو مواعيد المدرسة أو المناسبات العائلية.":"Nothing saved yet. Add a birthday, a school event or a special family day."}</p>
     </div>
    : <div className="mt-2 space-y-2">{upcoming.map(item=><div key={item.id+item.occursOn} className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5">
       <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-brand">{item.kind==="birthday"?<Cake className="size-4"/>:item.kind==="celebration"?<Heart className="size-4"/>:<CalendarDays className="size-4"/>}</span>
       <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{kindNames[item.kind]?.[ar?"ar":"en"]??item.kind} · {formatMomentDate(item.occursOn,ar)}</p></div>
       <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"/>
      </div>)}</div>}
   </div>
  </div>
 </section>;
}
