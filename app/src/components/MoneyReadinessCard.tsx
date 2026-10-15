import {CheckCircle2,Info,ShieldAlert} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {getFinancialReadiness,monthOf} from "@/lib/financialReadiness";
import type {MoneyState} from "@/lib/money";
type Props={state:MoneyState;setState:(fn:(s:MoneyState)=>MoneyState)=>void;goTo:(tab:"overview"|"spending"|"planning")=>void};
export function MoneyReadinessCard({state,setState,goTo}:Props){
 const {lang}=useI18n(),ar=lang==="ar",r=getFinancialReadiness(state);
 if(state.demo)return null;
 const title=r.level==="ready"?(ar?"الأرقام جاهزة للتقدير":"Figures ready for an estimate"):
  r.level==="caution"?(ar?"هناك التزامات تحتاج مراجعة":"Review upcoming commitments"):
  (ar?"خطوة صغيرة لتحسين دقة النصيحة":"One more step for clearer advice");
 const details=["income","savings","cash","bills","cash-date","risk"] as const;
 const step=(k:typeof details[number])=>k==="income"?(ar?"أكمل الدخل ومخصصات المصاريف":"Complete income & spending budgets"):
  k==="savings"?(ar?"أدخل هدف الادخار الشهري":"Enter a monthly savings target"):
  k==="cash"?(ar?"أدخل رصيدك النقدي الفعلي":"Enter your actual cash balance"):
  k==="bills"?(ar?"أضف الفواتير المستحقة أو أكد عدم وجودها":"Add dated bills or confirm you have none"):
  k==="cash-date"?(ar?"أكد رصيدك الحالي بتحديثه":"Refresh the date of your cash balance"):
  (ar?"راجع الفواتير المتأخرة أو العجز المتوقع":"Review overdue bills or forecast shortages");
 return <section className="rounded-2xl border border-[#D8E4D8] bg-[#F5F8F2] p-4" aria-label={ar?"جاهزية البيانات المالية":"Financial data readiness"}>
  <div className="flex items-start gap-3">
   {r.level==="ready"?<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#47765B]"/>:<ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#916D43]"/>}
   <div className="min-w-0 flex-1">
    <p className="text-sm font-semibold">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.level==="ready"?
     (ar?"تم إدخال ميزانية ورصيد وفواتير مراجعة هذا الشهر. التقدير ليس ضماناً للسيولة ولا يشمل المصاريف غير المسجلة.":
     "A monthly budget, current cash and this month's bills have been reviewed. This is still an estimate, not verified bank cash or unrecorded expenses."):
     (ar?"قبل ما نعطي توصية عن الصرف، نحتاج: ":"Before relying on spending recommendations: ")+(r.next==="none"?"":step(r.next))}</p>
   </div>
  </div>
  {r.level!=="ready"&&r.next!=="none"&&<div className="mt-3 flex flex-wrap gap-2">
    {r.next==="bills"&&(state.commitments??[]).length===0&&<button type="button" onClick={()=>{
      if(!window.confirm(ar?"هل تؤكد أنه لا توجد فواتير أو التزامات مجدولة غير مدفوعة هذا الشهر؟ هذا التأكيد ينتهي بنهاية الشهر.":"Confirm you have no unpaid scheduled bills or commitments this month? This confirmation expires next month."))return;
      setState(prev=>({...prev,noBillsConfirmedMonth:monthOf()}));
    }} className="min-h-10 rounded-full border border-[#CADECC] bg-white px-3 text-xs font-semibold text-brand">{ar?"أؤكد: ما عندي فواتير مجدولة":"Confirm: no scheduled bills"}</button>}
    <button type="button" className="min-h-10 rounded-full bg-brand px-4 text-xs font-semibold text-white" onClick={()=>goTo("planning")}>
     {r.next==="cash"||r.next==="cash-date"?(ar?"حدّث الرصيد":"Update cash balance"):
      r.next==="bills"?(ar?"إدارة الفواتير":"Review bills"):
      r.next==="risk"?(ar?"راجع الالتزامات":"Review commitments"):(ar?"أكمل بياناتي":"Complete my figures")}
    </button>
   </div>}
  <details className="mt-3 border-t border-[#D8E4D8] pt-3">
   <summary className="cursor-pointer text-xs font-semibold text-brand">{ar?"شو مكتمل وشو بعد ناقص؟":"See what's ready and what's missing"}</summary>
   <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
    {[
     [r.budgetReady,ar?"ميزانية الشهر":"Monthly budget"],
     [r.savingsReady,ar?"هدف الادخار":"Savings target"],
     [r.cashKnown,ar?"رصيد النقد":"Cash balance"],
     [r.cashFresh,ar?"تحديث الرصيد":"Recent cash update"],
     [r.billsReviewed,ar?"الفواتير المجدولة":"Scheduled bills"]
    ].map(([yes,label])=><div key={String(label)} className="rounded-lg bg-white px-3 py-2">
      <span className={yes?"text-[#47765B]":"text-[#A06A46]"}>{yes?"✓ ":"○ "}</span>{label}
    </div>)}
   </div>
   <p className="mt-2 flex gap-1.5 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0"/>{ar?"عند عدم وجود فواتير، يمكنك تأكيد ذلك لهذا الشهر فقط. الهدف هو تجنّب اعتبار عدم التسجيل كأنه لا يوجد أي التزامات.":"Confirming no bills is only for the current month; an empty list otherwise doesn't mean your household has zero commitments."}</p>
  </details>
 </section>;
}
