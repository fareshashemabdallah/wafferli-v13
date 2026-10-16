import {Link} from "@tanstack/react-router";
import {CalendarHeart,CheckCircle2,ArrowRight,ShieldCheck} from "lucide-react";
import {useState} from "react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,uid} from "@/lib/storage";
import {sampleMembers,type Member} from "@/lib/money";
import {upcomingPlanEvents,planKey,leadAdvice,daysUntil} from "@/lib/occasionAdvisor";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,makeFamilyPlan,upcomingFamilyPlans,type FamilyPlan} from "@/lib/familyPlans";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";

/** One reviewable event -> one plan. Existing birthdays are taken from family
 * profiles; no new manual event, calendar, gift or bank entry is required. */
export function FamilyNextActions({compact=false}:{compact?:boolean}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,setPlans,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [,setActive]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [error,setError]=useState("");
 if(!membersReady||!eventsReady||!plansReady||!prefsReady)return null;
 const now=new Date();
 const upcoming=prefs.lifestyle?upcomingPlanEvents(moments,members,now,45,ar):[];
 const next=upcoming[0];
 const source=next?"occasion:"+planKey(next):null;
 const linked=source?plans.find(p=>p.sourceRef===source):undefined;
 const activePlans=upcomingFamilyPlans(plans.filter(p=>p.status!=="completed"),now,3);
 const primary=activePlans[0];
 const create=()=>{
  if(!next||!source)return;
  setError("");
  const existing=plans.find(p=>p.sourceRef===source);
  if(existing){setActive(existing.id);return;}
  const result=makeFamilyPlan({id:uid(),title:next.title,kind:"occasion",
   date:next.occursOn,sourceRef:source},now);
  if(!result){setError(ar?"تعذّر تجهيز الخطة.":"Couldn't prepare a plan.");return;}
  setPlans(old=>old.some(p=>p.sourceRef===source)?old:[result,...old]);
  setActive(result.id);
 };
 if(!next&&!primary)return <section className="rounded-2xl border border-[#DFE8DB] bg-white p-4">
  <h2 className="text-base font-semibold">{ar?"خطط عيلتك بتبدأ من قرارك":"Your family plans, in one place"}</h2>
  <p className="mt-1 text-sm text-muted-foreground">{ar?
   "ما في مواعيد أو خطط قريبة سجلتها بعد. اطلب من دبّرنا يساعدك باختيار نشاط أو هدية، والخطة بتبقى هون بعد موافقتك.":
   "No upcoming saved family plans or dates yet. Ask Dabberna for an outing or a gift idea; an agreed plan can stay here for review."}</p>
  <Link to="/advisor" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand underline">
   {ar?"اسأل دبّرنا":"Ask Dabberna"}<ArrowRight className="size-4 rtl:rotate-180"/>
  </Link>
 </section>;
 return <section className="rounded-2xl border border-[#DEE8DB] bg-white p-4 sm:p-5"
  aria-label={ar?"ما يجب تحضيره للعائلة":"Family plans worth reviewing"}>
  <div className="flex items-center gap-2"><CalendarHeart className="size-5 text-brand"/>
   <h2 className="text-base font-semibold">{ar?"القادم لعيلتك":"Coming up for your family"}</h2>
  </div>
  {next&&<article className="mt-3 rounded-xl bg-[#F3F8EE] p-4">
   <p className="text-xs font-semibold text-brand">{next.occursOn}</p>
   <h3 className="mt-1 text-base font-semibold">{next.title}</h3>
   <p className="mt-1 text-sm text-muted-foreground">{leadAdvice(daysUntil(next.occursOn,now),ar)}</p>
   <div className="mt-3 flex flex-wrap items-center gap-3">
    {linked?<Link to="/plans" onClick={()=>setActive(linked.id)}
     className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand px-4 text-sm font-semibold text-white">
     <CheckCircle2 className="size-4"/>{ar?"افتح الخطة الموجودة":"Open existing plan"}
    </Link>:<button type="button" onClick={create}
     className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
     {ar?"حضّر خطة من هذا الموعد":"Prepare a plan from this date"}<ArrowRight className="size-4 rtl:rotate-180"/>
    </button>}
    <Link to="/occasions" className="inline-flex min-h-11 items-center text-xs font-semibold text-brand underline">
     {ar?"شوف أفكار مناسبة":"See occasion ideas"}
    </Link>
   </div>
   <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
    "التجهيز يحتاج موافقتك. ينقل الموعد مرة واحدة فقط؛ لا حجز ولا دفع ولا مصروف مسجّل.":
    "Only your action creates this plan and reuses its date. No booking, payment or expense is recorded."}</p>
  </article>}
  {error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  {primary&&<div className="mt-3">
   <p className="text-xs font-semibold text-muted-foreground">{ar?"خطة محفوظة تحتاج مراجعة":"SAVED PLAN TO REVIEW"}</p>
   <Link to="/plans" onClick={()=>setActive(primary.id)}
    className="mt-1 flex min-h-12 items-center justify-between gap-2 text-sm font-semibold text-brand">
    <span>{primary.title}{primary.date?" · "+primary.date:""}</span>
    <ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>
  </div>}
  {!compact&&<p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
   <ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   {ar?"هذا ملخص من التواريخ والخطط اللي حفظتها، وليس متابعة آلية للحجوزات أو الدفعات.":
    "Based on dates and plans you saved, not automated booking or payment monitoring."}
  </p>}
 </section>;
}
