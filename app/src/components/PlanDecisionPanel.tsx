import {Link} from "@tanstack/react-router";
import {ArrowRight,Calculator,Info,ShieldAlert,Wallet} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {QuickMoneySetup} from "@/components/QuickMoneySetup";
import {useI18n} from "@/lib/i18n";
import {fmtJOD} from "@/lib/storage";
import {evaluatePlan} from "@/lib/planDecision";
import {moneyAmount,type FamilyPlan} from "@/lib/familyPlans";
import {needsStarterBudget} from "@/lib/starterBudget";
import type {MoneyState} from "@/lib/money";

type Props={plan:FamilyPlan;money:MoneyState;plans:FamilyPlan[];
 onUpdate:(p:FamilyPlan)=>void;setMoney:(updater:(prev:MoneyState)=>MoneyState)=>void};
export function PlanDecisionPanel({plan,money,plans,onUpdate,setMoney}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const v=evaluatePlan(plan,money,plans);
 const [editing,setEditing]=useState(false),[limit,setLimit]=useState(""),[when,setWhen]=useState("");
 const [error,setError]=useState("");
 const explore=plan.kind==="purchase"?"/explore/smartbuy":plan.kind==="outing"?"/explore/together":plan.kind==="occasion"?"/occasions":"/explore";
 const openEdit=()=>{setLimit(plan.budgetJod===undefined?"":String(plan.budgetJod));setWhen(plan.date??"");setEditing(v=>!v);setError("");};
 const save=()=>{
  const amount=moneyAmount(limit);
  if(amount===null)return setError(ar?"أدخل مبلغاً صحيحاً بالدينار.":"Enter a valid JOD amount.");
  if(when&&!/^\d{4}-\d{2}-\d{2}$/.test(when))return setError(ar?"التاريخ غير صحيح":"Enter a valid date.");
  onUpdate({...plan,budgetJod:amount,...(when?{date:when}:{}),updatedAt:new Date().toISOString()});
  setEditing(false);setError("");toast.success(ar?"تم تحديث المقارنة.":"Plan comparison updated.");
 };
 const first=needsStarterBudget(money);
 const hasMonthly=v.unallocated!==null;
 const gap=v.monthlyGap;
 const needsMore=gap!==null&&gap<0;
 const cashIssue=v.cashAssessment==="caution"||v.cashAssessment==="shortfall";
 const suggest=v.monthlyFlexible.find(c=>c.room>=Math.abs(gap??0));
 return <section className="mt-4 space-y-3" aria-label={ar?"ماذا أفعل الآن؟":"What should I do next?"}>
  <div className="rounded-2xl border border-[#D9E5D6] bg-white p-4">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><p className="text-xs font-semibold text-brand">{ar?"القرار الحالي":"YOUR DECISION"}</p>
     <h3 className="mt-1 text-lg font-semibold">{ar?"هل يناسبنا هذا المصروف؟":"Can this plan fit our budget?"}</h3></div>
    <button type="button" className="min-h-10 rounded-full border border-[#D1E0D1] px-3 text-xs font-semibold text-brand" onClick={openEdit}>
     {ar?"عدّل التكلفة أو الموعد":"Edit cost or date"}</button>
   </div>
   <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#EDF3EA] px-3 py-3">
    <div><p className="text-xs text-muted-foreground">{ar?"تكلفة الخطة التي سنقارنها":"Plan cost being checked"}</p>
     <p className="mt-1 text-xl font-semibold tabular-nums">{v.cost===null?(ar?"غير محددة":"Not set yet"):fmtJOD(v.cost)}</p></div>
    <span className="text-xs text-muted-foreground">{v.month}</span>
   </div>
   {editing&&<div className="mt-3 space-y-3 rounded-xl border border-[#D7E4D8] p-3">
     <label className="block text-xs font-semibold">{ar?"سقف التكلفة (دينار)":"Estimated cost ceiling (JOD)"}
      <Input type="number" min={0} max={100000} step=".01" className="mt-1" value={limit} onChange={e=>setLimit(e.target.value)}/></label>
     <label className="block text-xs font-semibold">{ar?"التاريخ المتوقع":"Expected date"}
      <Input type="date" className="mt-1" value={when} onChange={e=>setWhen(e.target.value)}/></label>
     {error&&<p className="text-xs text-destructive" role="alert">{error}</p>}
     <div className="flex gap-2"><Button type="button" size="sm" onClick={save}>{ar?"حفظ":"Save"}</Button><Button type="button" size="sm" variant="ghost" onClick={()=>setEditing(false)}>{ar?"إلغاء":"Cancel"}</Button></div>
   </div>}
   {v.choiceExceedsLimit!==null&&v.choiceExceedsLimit>0&&<p className="mt-2 text-xs font-semibold text-[#9C5155]">{ar?"الخيار المختار أعلى من سقفك بـ ":"Your chosen option exceeds the ceiling by "}{fmtJOD(v.choiceExceedsLimit)}</p>}
  </div>
  {first?<div>
    <QuickMoneySetup money={money} setMoney={setMoney}/>
    <div className="mt-3 text-center">
      <Link to={explore} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">
       {ar?"مو جاهز للمعلومات المالية؟ قارن الخيارات أولاً":"Not ready to enter finances? Explore options first"} <ArrowRight className="size-4 rtl:rotate-180"/>
      </Link>
    </div>
   </div>:!hasMonthly?<div className="rounded-2xl border border-[#E6DBCA] bg-[#FFF7EB] p-4">
    <h4 className="font-semibold">{ar?"نحتاج نكمل ميزانية الشهر":"One more step to check your budget"}</h4>
    <p className="mt-2 text-sm leading-relaxed">{ar?"عندك بيانات مالية جزئية. افتح المالية وأكمل الدخل الشهري ومخصصات المصاريف وهدف الادخار. لا نريد تغيير سجلاتك الموجودة تلقائياً.":"Some financial information is already saved. Complete income, spending budgets and savings in Money. We won't overwrite your existing records."}</p>
    <Link to="/money" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
      {ar?"أكمل بياناتي المالية":"Complete my Money setup"} <ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </div>:v.cost===null?<div className="rounded-2xl bg-[#F2F6EE] p-4">
     <h4 className="font-semibold">{ar?"حدد تكلفة تقريبية أولاً":"Start with an estimated cost"}</h4>
     <Button className="mt-3" onClick={openEdit}>{ar?"أدخل المبلغ":"Enter cost"}</Button>
   </div>:<>
    <div className={"rounded-2xl border p-4 "+(needsMore?"border-[#EDC9CB] bg-[#FFF3F2]":"border-[#D2E5D7] bg-[#F1F7F0]")}>
      <p className="text-xs font-semibold">{ar?"التقييم المبدئي للشهر":"YOUR MONTHLY BUDGET CHECK"}</p>
      <h4 className="mt-2 text-lg font-semibold">{needsMore?
       (ar?"الخطة تحتاج مبلغ إضافي: ":"Your plan needs another ")+fmtJOD(Math.abs(gap!)):
       (ar?"الخطة تدخل ضمن المخصص غير الموزع":"This plan fits your unallocated monthly budget")}</h4>
      <div className="mt-3 grid grid-cols-2 gap-2">
       <div className="rounded-xl bg-white/80 p-3"><p className="text-xs text-muted-foreground">{ar?"غير موزع قبل الخطة":"Unallocated before plan"}</p><p className="mt-1 text-lg font-semibold tabular-nums">{fmtJOD(v.unallocated!)}</p></div>
       <div className="rounded-xl bg-white/80 p-3"><p className="text-xs text-muted-foreground">{ar?"بعد تكلفة الخطة":"After this plan"}</p><p className="mt-1 text-lg font-semibold tabular-nums">{fmtJOD(gap!)}</p></div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"هذا حساب ميزانية شهرية وليس مالاً مؤكداً في البنك.":"This is monthly planning room, not money verified in a bank account."}</p>
    </div>
    <div className="rounded-2xl border border-[#DCE6D8] bg-white p-4">
      <h4 className="text-base font-semibold">{ar?"شو نعمل هلأ؟":"Your best next step"}</h4>
      <p className="mt-2 text-sm leading-relaxed">{needsMore?suggest?
       (ar?"ينقصك "+fmtJOD(Math.abs(gap!))+"؛ يمكنك مراجعة مخصص "+suggest.name+" في المالية بدلاً من المساس بالادخار تلقائياً.":
       "You're short by "+fmtJOD(Math.abs(gap!))+". Consider reviewing the "+suggest.name+" budget in Money, rather than automatically reducing savings."):
       (ar?"التكلفة أعلى من المبلغ غير الموزع. قارن خيارات أقل سعراً، أو غيّر السقف، أو أجّل الخطة.":
       "This costs more than your unallocated funds. Compare cheaper options, reduce the cost or schedule it later."):
       (ar?"ابدأ بمقارنة الخيارات حسب السعر والجودة. وقبل الدفع راجع السيولة والفواتير.":
       "Compare options by price and quality. Before paying, check actual cash and upcoming bills.")}</p>
      {v.otherPlans>0&&<p className="mt-2 text-xs text-[#8D6944]">{ar?"تنبيه: لديك "+v.otherPlans+" خطط أخرى في الشهر نفسه، ولم تُخصم تكاليفها هنا.":"You have "+v.otherPlans+" other plans in this month; their costs aren't deducted here."}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
       {needsMore&&v.suggestedCeiling!==null&&v.costSource!=="option"&&v.suggestedCeiling<(plan.budgetJod??Infinity)&&
        <Button size="sm" variant="outline" onClick={()=>{
         if(!window.confirm(ar?"تأكيد خفض سقف الخطة إلى "+fmtJOD(v.suggestedCeiling!)+"؟":"Lower the plan ceiling to "+fmtJOD(v.suggestedCeiling!)+"?"))return;
         onUpdate({...plan,budgetJod:v.suggestedCeiling!,updatedAt:new Date().toISOString()});
         toast.success(ar?"تم تعديل سقف الخطة.":"Plan ceiling updated.");
        }}>{ar?"خفض السقف إلى ":"Lower ceiling to "}{fmtJOD(v.suggestedCeiling)}</Button>}
       <Link to={explore} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white">
        {ar?"قارن الخيارات الآن":"Compare options"} <ArrowRight className="size-4 rtl:rotate-180"/></Link>
       {needsMore&&<Link to="/money" className="inline-flex min-h-11 items-center rounded-full border border-[#D6E5D7] px-3 text-xs font-semibold text-brand">{ar?"راجع الميزانية":"Adjust my budget"}</Link>}
      </div>
    </div>
   </>}
  {!first&&hasMonthly&&v.cost!==null&&<details className="rounded-2xl border border-[#DEE5DE] bg-white px-4 py-3">
     <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand"><Calculator className="size-4"/>{ar?"كيف حسبنا هذا؟ وهل في سيولة للدفع؟":"See calculation & cash check"}</summary>
     <div className="mt-4 space-y-2 text-sm">
      <div className="flex justify-between gap-2"><span>{ar?"دخل شهري تقديري":"Estimated monthly income"}</span><strong>{fmtJOD(v.income)}</strong></div>
      {v.carryover!==0&&<div className="flex justify-between gap-2"><span>{ar?"ترحيل الشهر الماضي":"Last month's carryover"}</span><strong>{fmtJOD(v.carryover)}</strong></div>}
      <div className="flex justify-between gap-2"><span>{ar?"مخصصات المصاريف":"Budgeted expenses"}</span><strong>− {fmtJOD(v.budgets)}</strong></div>
      <div className="flex justify-between gap-2"><span>{ar?"هدف الادخار":"Savings goal"}</span><strong>− {fmtJOD(v.savings)}</strong></div>
      <div className="flex justify-between gap-2 border-t border-border pt-2"><span>{ar?"قبل الخطة":"Before plan"}</span><strong>{fmtJOD(v.unallocated!)}</strong></div>
      <div className="mt-3 flex gap-2 border-t border-border pt-3"><Wallet className="mt-1 size-4 shrink-0 text-brand"/><div>
       <p className="font-semibold">{ar?"السيولة النقدية منفصلة عن ميزانية الشهر":"Cash availability is a separate check"}</p>
       <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{v.cashAssessment==="missing"?
        (ar?"البيانات غير مكتملة للتحقق من الرصيد والفواتير.":"A cash balance and dated bills are needed before a cash assessment."):
        v.cashAssessment==="future"?(ar?"موعد الخطة خارج الثلاثين يوماً المقبلة. رصيد اليوم لا يضمن السيولة حينها.":"This plan is beyond 30 days; today's cash cannot establish future availability."):
        v.cashAssessment==="fits"?(ar?"الرصيد المدخل يغطي المبلغ بعد الفواتير المسجلة والاحتياطي، لكن المصاريف غير المجدولة غير محسوبة.":"Entered cash covers the amount after scheduled bills and reserve, excluding unscheduled costs."):
        v.cashAssessment==="caution"?(ar?"فواتير متأخرة أو عجز متوقع يحتاج مراجعة.":"Overdue bills or a forecast shortfall require review."):
        (ar?"الرصيد بعد الفواتير المسجلة لا يكفي للخطة.":"Entered cash after scheduled bills is insufficient.")}</p>
       {v.cashRemaining!==null&&<p className="mt-1 text-sm font-semibold">{ar?"بعد الفواتير والاحتياطي: ":"After bills and reserve: "}{fmtJOD(v.cashRemaining)}</p>}
       <Link to="/money" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">{ar?"مراجعة المالية":"Open Money"} <ArrowRight className="size-3"/></Link>
      </div></div>
     </div>
   </details>}
  <p className="flex gap-2 px-1 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0"/>{ar?"هذه توصيات مبنية على الأرقام المُدخلة، وليست موافقة مالية. لا نغيّر بيانات الميزانية أو البنك دون تأكيد.":"These are explanations based on entered figures, not a spending guarantee. Your Money records aren't changed without confirmation."}</p>
 </section>;
}
