import { Link } from "@tanstack/react-router";
import { CalendarHeart } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { type FamilyMoment } from "@/lib/familyCalendar";
import { sampleMembers, type Member } from "@/lib/money";
import { daysUntil, leadAdvice, upcomingPlanEvents } from "@/lib/occasionAdvisor";
import { useLocalState } from "@/lib/storage";
import { defaultFamilyPreferences } from "@/lib/familyPreferences";

export function OccasionPreview(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [events,,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const now=useMemo(()=>new Date(),[]);
 const occasion=useMemo(()=>upcomingPlanEvents(events,members,now,90,ar)[0],[events,members,now,ar]);
 if(!eventsReady||!membersReady||!occasion||prefs.notificationFrequency==="off"||!prefs.lifestyle)return null;
 const days=daysUntil(occasion.occursOn,now);
 return <section className="mt-4 rounded-2xl border border-[#EADACC] bg-[#FFF9F1] p-4" aria-label={ar?"المناسبة القادمة":"Upcoming occasion"}>
  <div className="flex items-start gap-3">
   <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#AF7959]"><CalendarHeart className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <p className="text-xs font-semibold text-[#976C4C]">{ar?"لنخطط قبل الموعد":"SOMETHING LOVELY IS COMING"}</p>
    <h2 className="mt-1 font-semibold">{occasion.title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{days===0?(ar?"اليوم":"Today"):(ar?"بعد ":"In ")+days+(ar?" يوم":" days")} · {leadAdvice(days,ar)}</p>
    <Link to="/occasions" className="mt-3 inline-block text-sm font-semibold text-brand">{ar?"حضّر هدية أو تجربة تناسب عائلتك":"Explore thoughtful gifts and experiences"} →</Link>
   </div>
  </div>
 </section>;
}