import {Link} from "@tanstack/react-router";
import {ArrowRight,Calculator,CheckCircle2,Info,ShieldAlert,Wallet} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {fmtJOD} from "@/lib/storage";
import {evaluatePlan} from "@/lib/planDecision";
import {moneyAmount,type FamilyPlan} from "@/lib/familyPlans";
import type {MoneyState} from "@/lib/money";
type Props={plan:FamilyPlan;money:MoneyState;plans:FamilyPlan[];onUpdate:(p:FamilyPlan)=>void};
export function PlanDecisionPanel({plan,money,plans,onUpdate}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const v=evaluatePlan(plan,money,plans);
 const [edit,setEdit]=useState(false),[limit,setLimit]=useState(""),[when,setWhen]=useState("");
 const [error,setError]=useState("");
 const save=()=>{
  const amount=moneyAmount(limit);
  if(amount===null)return setError(ar?"اكتب مبلغاً صحيحاً بين صفر و١٠٠٬٠٠٠ دينار.":"Enter a valid JOD amount from 0 to 100,000.");
  if(when&&!/^\d{4}-\d{2}-\d{2}$/.test(when))return setError(ar?"تاريخ غير صحيح":"Enter a valid date.");
  onUpdate({...plan,budgetJod:amount,...(when?{date:when}:{}),updatedAt:new Date().toISOString()});
  setEdit(false);setError("");toast.success(ar?"تم تحديث الخطة والمقارنة.":"Plan updated; comparison refreshed.");
 };
 const validMonthly=v.unallocated!==null;
 const amountLabel=v.costSource==="option"?(ar?"سعر الخيار المختار":"Chosen option cost"):
  (ar?"سقف التكلفة التي حددتها":"Your planned cost ceiling");
 const attention=v.monthlyAssessment==="shortfall"||["shortfall","caution"].includes(v.cashAssessment)||!!(v.choiceExceedsLimit&&v.choiceExceedsLimit>0);
 const possibleSaving=v.monthlyGap!==null&&v.monthlyGap<0?Math.abs(v.monthlyGap):0;
 const flexible=v.monthlyFlexible.find(c=>c.room>=possibleSaving);
 const need=v.missing.filter(x=>x!=="plan-cost");
 return <section className="mt-4 rounded-2xl border border-[#D6E4D8] bg-[#F8FAF6] p-4 sm:p-5" aria-label={ar?"هل تناسب الخطة ميزانيتنا؟":"Plan affordability check"}>
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div><p className="section-eyebrow">{ar?"قرار مدروس":"MAKE A THOUGHTFUL DECISION"}</p>
     <h3 className="mt-1 text-lg font-semibold">{ar?"هل هذه الخطة تناسب ميزانيتنا؟":"Does this plan fit our finances?"}</h3>
     <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?"نقارن مبلغ الخطة مع المبلغ غير الموزّع في ميزانية الشهر، ونراجع السيولة المتاحة للفواتير إذا كانت بياناتك مكتملة.":"We compare this plan with your monthly income after existing spending budgets and savings, then separately check cash after scheduled bills."}</p>
    </div>
    <button className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#CFE1D0] bg-white px-3 text-xs font-semibold text-brand" type="button" onClick={()=>{
      setLimit(plan.budgetJod!==undefined?String(plan.budgetJod):"");setWhen(plan.date??"");setEdit(v=>!v);setError("");
    }}>{ar?"غيّر السقف أو الموعد":"Change cost or date"}</button>
   </div>
   {edit&&<div className="mt-3 rounded-xl border border-[#D8E5D7] bg-white p-3">
     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold">{ar?"السقف المالي بالدينار":"Plan cost ceiling (JOD)"}
       <Input type="number" min={0} max={100000} step=".01" className="mt-1" value={limit} onChange={e=>setLimit(e.target.value)}/>
      </label>
      <label className="text-xs font-semibold">{ar?"متى تريد تنفيذ الخطة؟":"When do you plan to do it?"}
       <Input type="date" className="mt-1" value={when} onChange={e=>setWhen(e.target.value)}/>
      </label>
     </div>
     {error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
     <div className="mt-3 flex gap-2"><Button size="sm" type="button" onClick={save}>{ar?"احفظ وأعد التقييم":"Save & recalculate"}</Button>
       <Button size="sm" variant="ghost" type="button" onClick={()=>setEdit(false)}>{ar?"إلغاء":"Cancel"}</Button></div>
   </div>}
   <div className="mt-4 rounded-2xl bg-white p-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs text-muted-foreground">{amountLabel}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{v.cost!==null?fmtJOD(v.cost):(ar?"لم تحدد بعد":"Not entered yet")}</p></div>
      <p className="text-xs text-muted-foreground">{ar?"شهر الخطة: ":"Plan month: "}{v.month}</p>
    </div>
    {v.costSource==="option"&&plan.budgetJod!==undefined&&<p className={"mt-2 text-xs "+(v.choiceExceedsLimit!==null&&v.choiceExceedsLimit>0?"font-semibold text-[#A64E52]":"text-muted-foreground")}>
      {ar?"السقف الذي حددته: ":"Your limit: "}{fmtJOD(plan.budgetJod)}
      {v.choiceExceedsLimit!==null&&v.choiceExceedsLimit>0&&" · "+(ar?"الخيار أغلى بـ ":"Chosen option is over limit by ")+fmtJOD(v.choiceExceedsLimit)}
    </p>}
   </div>
   {validMonthly?<div className="mt-3 rounded-2xl border border-[#DAE6DA] bg-white p-4">
      <div className="flex items-center gap-2"><Calculator className="size-4 text-brand"/><h4 className="font-semibold">{ar?"كم بقي غير موزّع في الميزانية؟":"What is left unallocated in your monthly budget?"}</h4></div>
      <p className="mt-1 text-xs text-muted-foreground">{ar?"هذه مقارنة تقديرية للشهر المختار، وليست رصيد بنك. لا نخصم الفواتير مرة ثانية لأنها جزء من المخصصات التي سجلتها.":"Estimated monthly plan, not bank cash. We do not subtract bills again if they are already included in your category budgets."}</p>
      <div className="mt-3 space-y-2 text-sm tabular-nums">
        <div className="flex justify-between gap-3"><span>{ar?"دخل شهري مقدّر":"Estimated monthly income"}</span><span>{fmtJOD(v.income)}</span></div>
        {v.carryover!==0&&<div className="flex justify-between gap-3"><span>{ar?"ترحيل من الشهر السابق":"Previous-month carryover"}</span><span>{v.carryover>0?"+":""}{fmtJOD(v.carryover)}</span></div>}
        <div className="flex justify-between gap-3"><span>{ar?"مخصصات المصاريف":"Expense category budgets"}</span><span>− {fmtJOD(v.budgets)}</span></div>
        <div className="flex justify-between gap-3"><span>{ar?"هدف الادخار":"Savings goal"}</span><span>− {fmtJOD(v.savings)}</span></div>
        <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold"><span>{ar?"غير موزّع قبل هذه الخطة":"Unallocated before this plan"}</span><span>{fmtJOD(v.unallocated!)}</span></div>
        {v.cost!==null&&<div className={"flex justify-between gap-3 rounded-lg px-2 py-2 font-semibold "+(v.monthlyGap!<0?"bg-[#FFF0F0] text-[#99494E]":"bg-[#EDF6EE] text-[#3E7451]")}>
          <span>{ar?"بعد تكلفة الخطة":"After this plan cost"}</span><span>{fmtJOD(v.monthlyGap!)}</span></div>}
      </div>
     </div>:<div className="mt-3 rounded-xl border border-[#E9DACA] bg-[#FFF8EE] p-3 text-sm">
      <p className="font-semibold">{ar?"لا يمكن مقارنة الميزانية الشهرية بعد":"Monthly budget comparison needs your figures"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{money.demo?
       (ar?"الأرقام الحالية تجريبية، وليست ميزانيتك.":"Money is still showing example figures, not your household budget."):
       (ar?"أدخل الدخل الشهري ومخصصات المصاريف وهدف الادخار في المالية أولاً.":"Enter monthly income, expense category budgets and your savings goal in Money first.")}</p>
     </div>}
   <div className="mt-3 rounded-2xl border border-[#DAE6DA] bg-white p-4">
     <div className="flex items-center gap-2"><Wallet className="size-4 text-brand"/><h4 className="font-semibold">{ar?"هل السيولة تغطي الدفع الآن؟":"Can recorded cash cover the payment?"}</h4></div>
     {v.cashAssessment==="missing"?<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
      {money.demo?(ar?"لم نستخدم أرقاماً تجريبية للحكم على قدرتك على الدفع.":"We cannot judge cash affordability from demo figures."):
      (ar?"لم تدخل رصيداً حقيقياً أو جدول فواتير كاملًا بتواريخ صحيحة. أدخله في المالية حتى نقارن قيمة الخطة بالرصيد بعد الفواتير والاحتياطي.":"Actual cash, unpaid bills or valid due dates are incomplete. Add them in Money to compare the plan with cash after scheduled bills and reserve.")}</p>:
      v.cashAssessment==="future"?<p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"موعد الخطة خارج نطاق الثلاثين يوماً. لا نعتبر رصيد اليوم دليلاً على سيولة ذلك الشهر؛ ميزانية الشهر أعلاه مرجع للتخطيط فقط.":"The plan is outside the next 30 days. Today's cash cannot confirm cash availability on that future date; use the monthly plan above for guidance."}</p>:
      <div className="mt-2">
       <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm">{ar?"رصيد اليوم بعد الفواتير المجدولة والاحتياطي":"Cash now after scheduled bills and reserve"}</span>
        <strong className="text-lg tabular-nums">{fmtJOD(v.cashRemaining??0)}</strong>
       </div>
       <p className={"mt-2 text-sm font-semibold "+(v.cashAssessment==="fits"?"text-[#3E7451]":"text-[#A04D50]")}>
       {v.cashAssessment==="fits"?(ar?"يغطي تكلفة الخطة بحسب المعلومات المدخلة، لكن المصاريف اليومية غير المجدولة غير محسوبة.":"Covers the estimated cost on the entered figures, excluding unscheduled everyday spending."):
       v.cashAssessment==="caution"?(ar?"تنبيه: توجد فواتير متأخرة أو نقص نقدي محتمل خلال الثلاثين يوماً.":"Caution: overdue commitments or a forecast shortage in the next 30 days."):
       (ar?"الرصيد المسجل لا يكفي لهذه التكلفة؛ الفرق: ":"Recorded cash is short by ")+fmtJOD(Math.abs(v.cashGap??0))}</p>
      </div>}
   </div>
   {need.length>0&&<Link to="/money" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand/20 bg-white px-3 text-sm font-semibold text-brand">
    {money.demo?(ar?"أدخل بياناتي المالية الحقيقية":"Start with my real Money data"):(ar?"أكمل الدخل والفواتير والرصيد في المالية":"Complete missing Money details")} <ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>}
   {v.cost===null?<div className="mt-4 rounded-xl bg-[#EAF2E9] p-3 text-sm">
      <p className="font-semibold">{ar?"الخطوة الأولى: حدّد مبلغاً تقريبياً":"First step: enter an estimated cost"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{ar?"يمكننا إظهار الفرق بالضبط بعد إدخال سقف الميزانية أو اختيار عرض بسعر محدد.":"Once you add a ceiling or a priced option, Dabberna will calculate the difference and suggest a practical next step."}</p>
      <Button type="button" variant="outline" className="mt-3" onClick={()=>{setLimit(plan.budgetJod!==undefined?String(plan.budgetJod):"");setWhen(plan.date??"");setEdit(true);}}>{ar?"حدّد التكلفة":"Set estimated cost"}</Button>
    </div>:
    <div className={"mt-4 rounded-2xl border p-4 "+(attention?"border-[#E9CECF] bg-[#FFF8F6]":"border-[#D6E6D6] bg-[#EEF6ED]")}>
      <div className="flex gap-2"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-brand"/>
       <div>
        <h4 className="font-semibold">{ar?"شو بننصحك تعمل؟":"What should you do next?"}</h4>
        <p className="mt-2 text-sm leading-relaxed">
        {v.monthlyGap===null?(ar?"ابدأ بإكمال ميزانية الشهر قبل الالتزام بهذا المبلغ.":"Complete your monthly budget before committing to this amount."):
         v.monthlyGap<0?flexible?
          (ar?"الخطة تحتاج "+fmtJOD(possibleSaving)+" إضافية. يمكن مراجعة "+flexible.name+"؛ فيها مخصص غير مصروف قدره "+fmtJOD(flexible.room)+". لا يتم نقل أي مخصص دون موافقتك.":
          "You need "+fmtJOD(possibleSaving)+" more than unallocated funds. "+flexible.name+" has "+fmtJOD(flexible.room)+" of unspent category budget that you could consider reducing in Money, with your approval."):
          (ar?"الخطة تتجاوز المبلغ غير الموزّع بمقدار "+fmtJOD(possibleSaving)+". فكّر بمقارنة خيارات أرخص أو تقليل مصروف مرن أو تأجيل الشراء.":"This plan exceeds unallocated funds by "+fmtJOD(possibleSaving)+". Compare lower-cost choices, review flexible budgets, or move the plan to a later month."):
         v.cashAssessment==="fits"?(ar?"الخطة تدخل ضمن الحساب المبدئي للميزانية والسيولة. قارن القيمة والجودة قبل اتخاذ القرار.":"The plan fits the preliminary budget and recorded cash check. Compare value and quality before deciding."):
         (ar?"ميزانية الشهر قد تتحمل هذا المبلغ، لكن السيولة تحتاج مراجعة قبل الدفع.":"The monthly plan has room, but cash availability needs review before payment.")}</p>
        {v.otherPlans>0&&<p className="mt-2 text-xs text-[#936342]">{ar?"هناك "+v.otherPlans+" خطط أخرى للشهر نفسه غير محتسبة في هذا المبلغ.":"There are "+v.otherPlans+" other planned costs this month. These are not deducted from the figure above."}</p>}
       </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
       {v.monthlyGap!==null&&v.monthlyGap<0&&v.suggestedCeiling!==null&&v.costSource!=="option"&&
         v.suggestedCeiling<plan.budgetJod!&&<Button size="sm" onClick={()=>{
           if(!window.confirm(ar?"هل تؤكد خفض سقف هذه الخطة إلى "+fmtJOD(v.suggestedCeiling!)+"؟ لن نغيّر فئات الميزانية أو رصيد البنك.":"Reduce this plan's ceiling to "+fmtJOD(v.suggestedCeiling!)+"? Money budgets and cash will remain unchanged."))return;
           onUpdate({...plan,budgetJod:v.suggestedCeiling!,updatedAt:new Date().toISOString()});
           toast.success(ar?"تم خفض السقف وأعدنا التقييم.":"Plan ceiling adjusted; comparison refreshed.");
         }}>{ar?"خفّض السقف إلى ":"Lower my limit to "}{fmtJOD(v.suggestedCeiling)}</Button>}
       {(v.monthlyGap!==null&&v.monthlyGap<0||v.cashAssessment==="caution"||v.cashAssessment==="shortfall")&&
        <Link to="/money" className="inline-flex min-h-10 items-center rounded-full border border-[#CFE0D1] bg-white px-3 text-xs font-semibold text-brand">{ar?"راجع مصاريفي والتزامـاتي":"Review spending and bills"} →</Link>}
       <Link to={plan.kind==="purchase"?"/explore/smartbuy":plan.kind==="outing"?"/explore/together":plan.kind==="occasion"?"/occasions":"/explore"} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-brand px-3 text-xs font-semibold text-white">
        {ar?"قارن خيارات مناسبة":"Compare suitable options"} <ArrowRight className="size-3.5 rtl:rotate-180"/>
       </Link>
      </div>
    </div>}
   <div className="mt-3 flex gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0"/><p>{ar?"هذه أداة مساعدة للقرار مبنية على أرقامك، وليست موافقة مالية أو اتصالاً بالبنك. تغيير سقف الخطة لا يغيّر الميزانية أو رصيدك.":"This is a decision aid based on entered figures, not a bank connection or spending approval. Changing a Plan ceiling does not change your Money budgets or cash."}</p></div>
  </section>;
}
