import {Link} from "@tanstack/react-router";
import {ArrowUpRight,HeartHandshake,CalendarCheck2,X} from "lucide-react";
import {activeDecisionKey,activeJourney,type DecisionJourney} from "@/lib/decisionJourney";
import {useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";

export function PlanContextBanner({onUseBudget}:{onUseBudget?:(amount:number)=>void}) {
 const {lang}=useI18n(),ar=lang==="ar";
 const [saved,setSaved,ready]=useLocalState<DecisionJourney|null>(activeDecisionKey,null);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [active]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const plan=plans.find(x=>x.id===active&&x.status!=="completed");
 const context=activeJourney(saved);
 if(!ready||!plansReady)return null;
 if(plan){
  const ceiling=plan.budgetJod??plan.choice?.estimatedJod;
  return <aside className="mb-4 rounded-2xl border border-[#D7E6DA] bg-[#F0F6ED] p-3.5 sm:p-4" aria-label={ar?"خطة العائلة":"Active family plan"}>
   <div className="flex items-start gap-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand"><CalendarCheck2 className="size-5"/></span>
    <div className="min-w-0 flex-1">
     <p className="text-[11px] font-semibold tracking-wide text-brand">{ar?"نكمّل خطتنا":"CONTINUE YOUR PLAN"}</p>
     <p className="mt-1 text-sm font-semibold">{plan.title}</p>
     <p className="mt-1 text-xs text-muted-foreground">{ar?"الخطة وسقفها محفوظان على هذا الجهاز؛ لن نستخدم السقف إلا باختيارك.":"The plan and its ceiling stay on this device. Apply the budget here only if you choose."}</p>
     <div className="mt-2 flex flex-wrap items-center gap-2">
      {ceiling!==undefined&&<span className="rounded-full border border-[#CBDDCC] px-2 py-1 text-xs text-brand">{ar?"سقف الخطة: ":"Plan limit: "}{ceiling.toLocaleString("en-US")} JOD</span>}
      {ceiling!==undefined&&onUseBudget&&<button type="button" onClick={()=>onUseBudget(ceiling)} className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">{ar?"استخدم السقف هنا":"Use this ceiling"}</button>}
      <Link to="/plans" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">{ar?"العودة للخطة":"Open plan"} <ArrowUpRight className="size-3"/></Link>
     </div>
    </div>
   </div>
  </aside>;
 }
 if(!context)return null;
 return <aside className="mb-4 rounded-2xl border border-[#D7E6DA] bg-[#F0F6ED] p-3.5 sm:p-4" aria-label={ar?"الخطة المستمرة":"Continue your plan"}>
  <div className="flex items-start gap-3">
   <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand"><HeartHandshake className="size-4.5"/></span>
   <div className="min-w-0 flex-1">
    <p className="text-[11px] font-semibold tracking-wide text-brand">{ar?"تُكمِل خطّتك":"CONTINUE WHERE YOU LEFT OFF"}</p>
    <p className="mt-1 text-sm font-semibold">{context.occasionTitle}</p>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"احتفظنا بسياق المناسبة على هذا الجهاز. اختَر بنفسك كيفية استخدامه.":"Your occasion context stays on this device. Apply it only when useful."}</p>
    <div className="mt-2 flex flex-wrap items-center gap-2">
     {context.comfortableLimitJod!==null&&<span className="rounded-full border border-[#CBDDCC] px-2 py-1 text-xs text-brand">{ar?"سقف مريح: ":"Comfortable ceiling: "}{context.comfortableLimitJod.toLocaleString("en-US")} JOD</span>}
     {context.comfortableLimitJod!==null&&onUseBudget&&<button type="button" onClick={()=>onUseBudget(context.comfortableLimitJod!)} className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">{ar?"استخدم السقف في هذه الخطة":"Use this limit here"}</button>}
     <Link to="/occasions" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">{ar?"العودة للمناسبة":"Occasion plan"} <ArrowUpRight className="size-3"/></Link>
    </div>
   </div>
   <button type="button" onClick={()=>setSaved(null)} aria-label={ar?"إغلاق سياق المناسبة":"Dismiss occasion context"} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white"><X className="size-4"/></button>
  </div>
 </aside>;
}
