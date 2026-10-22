import {Link} from "@tanstack/react-router";
import {ArrowRight,CalendarCheck2} from "lucide-react";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,upcomingFamilyPlans,type FamilyPlan} from "@/lib/familyPlans";
import {useLocalState,fmtJOD} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {sampleMembers,type Member} from "@/lib/money";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {canonicalPlanViews} from "@/lib/canonicalFamilyFacts";
export function HomePlanHighlight(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [plans,,ready]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [,setActive]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const [events]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 if(!ready)return null;
 const upcoming=upcomingFamilyPlans(canonicalPlanViews(plans,events,members,ar));
 if(!upcoming.length)return null;
 const plan=upcoming[0]!;
 return <section className="editorial-card mt-5 p-4 sm:p-5" aria-label={ar?"الخطط القادمة":"Upcoming family plans"}>
  <div className="flex items-start gap-3">
   <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#EAF1E8] text-brand"><CalendarCheck2 className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <p className="section-eyebrow">{ar?"على بالنا":"COMING UP IN OUR PLANS"}</p>
    <h2 className="mt-1 font-semibold">{plan.title}</h2>
    <p className="mt-1 text-xs text-muted-foreground">
     {plan.date??(ar?"موعد مرن":"Flexible date")}
     {plan.budgetJod!==undefined&&" · "+fmtJOD(plan.budgetJod)}
    </p>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"تم حفظ الخطّة على هذا الجهاز. راجع الخيار والميزانية قبل الالتزام.":"Saved on this device. Review the choice and budget before committing."}</p>
   </div>
   <Link to="/plans" onClick={()=>setActive(plan.id)} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-[#EAF1E8] px-3 text-xs font-semibold text-brand">{ar?"راجع":"Review"} <ArrowRight className="size-3 rtl:rotate-180"/></Link>
  </div>
  {upcoming.length>1&&<Link to="/plans" className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-brand">{ar?"كل الخطط":"All plans"} ({plans.filter(p=>p.status!=="completed").length}) →</Link>}
 </section>;
}
