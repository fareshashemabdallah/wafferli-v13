import {Link} from "@tanstack/react-router";
import {ArrowUpRight,HeartHandshake,X} from "lucide-react";
import {activeDecisionKey,activeJourney,type DecisionJourney} from "@/lib/decisionJourney";
import {useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";

export function PlanContextBanner({onUseBudget}:{onUseBudget?:(amount:number)=>void}) {
 const {lang}=useI18n(),ar=lang==="ar";
 const [saved,setSaved,ready]=useLocalState<DecisionJourney|null>(activeDecisionKey,null);
 const context=activeJourney(saved);
 if(!ready||!context)return null;
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
