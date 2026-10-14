import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Cake, CalendarDays, Gift, Heart } from "lucide-react";
import { useMemo } from "react";
import { allFamilyMoments, formatMomentDate, upcomingMoments, type FamilyMoment } from "@/lib/familyCalendar";
import { sampleMembers, type Member } from "@/lib/money";
import { daysUntil, leadAdvice } from "@/lib/occasionAdvisor";
import { defaultFamilyPreferences } from "@/lib/familyPreferences";
import { useI18n } from "@/lib/i18n";
import { useLocalState } from "@/lib/storage";

/** My Day should surface a real, timely family moment, never an empty calendar or duplicate "add" CTA. */
export function HomeJourneyHighlights() {
 const {lang}=useI18n(),ar=lang==="ar";
 const [events,,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const now=useMemo(()=>new Date(),[]);
 const upcoming=useMemo(
  ()=>upcomingMoments(allFamilyMoments(events,members,ar),now,60),
  [events,members,ar,now]
 );
 const occasion=upcoming[0];
 if(!eventsReady||!membersReady||!occasion)return null;
 const days=daysUntil(occasion.occursOn,now);
 const Icon=occasion.kind==="birthday"?Cake:occasion.kind==="anniversary"?Heart:Gift;
 return <section aria-label={ar?"المناسبات القادمة":"Upcoming occasions"} className="mt-5 rounded-2xl border border-[#E7E0D4] bg-[#FBF8F2] p-4 sm:p-5">
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#A77965]"><Icon className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#956E53]">{ar?"مناسبة تقترب":"A moment worth planning"}</p>
    <h2 className="mt-1 text-base font-semibold text-ink">{occasion.title}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{formatMomentDate(occasion.occursOn,ar)} · {days===0?(ar?"اليوم":"Today"):days===1?(ar?"غدًا":"Tomorrow"):(ar?"بعد ":"In ")+days+(ar?" يوم":" days")}</p>
    {prefs.lifestyle&&prefs.notificationFrequency!=="off"&&
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{leadAdvice(days,ar)}</p>}
   </div>
   <Link to="/occasions" aria-label={ar?"خطّط لهذه المناسبة":"Plan this occasion"}
     className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-brand">
     {ar?"خطّط":"Plan"} <ArrowUpRight className="inline size-3.5 rtl:-rotate-90"/>
   </Link>
  </div>
  <Link to="/calendar" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand">
   <CalendarDays className="size-3.5"/>{ar?"التقويم الكامل":"Family calendar"}
  </Link>
 </section>;
}
