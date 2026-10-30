import {frenchUI} from "@/lib/french";
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
import {planBudgetSetupSteps,PLAN_MONEY_FOCUS_KEY,type PlanSetupStep} from "@/lib/planBudgetSetup";
import type {MoneyState} from "@/lib/money";

type Props={plan:FamilyPlan;money:MoneyState;plans:FamilyPlan[];
 onUpdate:(p:FamilyPlan)=>void;setMoney:(updater:(prev:MoneyState)=>MoneyState)=>void};
export function PlanDecisionPanel({plan,money,plans,onUpdate,setMoney}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const v=evaluatePlan(plan,money,plans);
 const [editing,setEditing]=useState(false),[limit,setLimit]=useState(""),[when,setWhen]=useState("");
 const [error,setError]=useState("");
 const explore=plan.kind==="occasion"?"/occasions":"/advisor";
 const openEdit=()=>{setLimit(plan.budgetJod===undefined?"":String(plan.budgetJod));setWhen(plan.date??"");setEditing(v=>!v);setError("");};
 const save=()=>{
  const amount=moneyAmount(limit);
  if(amount===null)return setError(ar?"أدخل مبلغاً صحيحاً بالدينار.":(lang==="fr"?frenchUI("Enter a valid JOD amount."):"Enter a valid JOD amount."));
  if(when&&!/^\d{4}-\d{2}-\d{2}$/.test(when))return setError(ar?"التاريخ غير صحيح":(lang==="fr"?frenchUI("Enter a valid date."):"Enter a valid date."));
  onUpdate({...plan,budgetJod:amount,...(when?{date:when}:{}),updatedAt:new Date().toISOString()});
  setEditing(false);setError("");toast.success(ar?"تم تحديث المقارنة.":(lang==="fr"?frenchUI("Plan comparison updated."):"Plan comparison updated."));
 };
 const first=needsStarterBudget(money);
 const setupSteps=planBudgetSetupSteps(money);
 const setupLabels:Record<PlanSetupStep,{en:string;ar:string;enAction:string;arAction:string}>={
  demo:{en:"Personal money records haven't been started",ar:"لم تبدأ بيانات المال الحقيقية",enAction:"Start my Money",arAction:"ابدأ بماليتي"},
  income:{en:"Monthly income amount is missing",ar:"مبلغ الدخل الشهري غير مدخل",enAction:"Enter income",arAction:"أدخل الدخل"},
  categories:{en:"No monthly spending budget category has been entered",ar:"لا توجد فئة واحدة بمخصص شهري",enAction:"Add a spending category",arAction:"أضف فئة مصاريف"},
  review:{en:"Confirm the categories entered cover your usual household costs",ar:"راجع أن الفئات المسجلة تشمل مصاريف عائلتك المعتادة",enAction:"Review my spending categories",arAction:"راجع فئات المصاريف"}
 };
 const moneyLink=(key:PlanSetupStep)=>()=>{
  window.sessionStorage.setItem(PLAN_MONEY_FOCUS_KEY,key);
 };
 const setupGuide=<div className="rounded-2xl border border-[#E6DBCA] bg-[#FFF7EB] p-4" data-testid="plan-budget-missing">
  <h4 className="font-semibold">{ar?"هذا ما نحتاجه لمقارنة الخطة":(lang==="fr"?frenchUI("Here's exactly what's needed for the monthly plan check"):"Here's exactly what's needed for the monthly plan check")}</h4>
  <p className="mt-2 text-sm leading-relaxed">{ar?"نستخدم أرقامك المحفوظة ولا نطلب إدخالها مرة ثانية. المطلوب فقط البنود التالية:":(lang==="fr"?frenchUI("We keep what you've already entered. Only the items below still need attention:"):"We keep what you've already entered. Only the items below still need attention:")}</p>
  <div className="mt-3 space-y-2">
   {setupSteps.map(key=><div key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E7DCCB] bg-white p-3">
    <span className="flex min-w-0 flex-1 items-center gap-2 text-sm"><span aria-hidden="true" className="text-[#A06F43]">○</span>
      {ar?setupLabels[key].ar:setupLabels[key].en}</span>
    <Link to="/money" onClick={moneyLink(key)} className="min-h-10 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white">
      {ar?setupLabels[key].arAction:setupLabels[key].enAction} <ArrowRight className="size-3 rtl:rotate-180"/>
    </Link>
   </div>)}
   {!setupSteps.length&&<p className="text-sm font-semibold">{ar?"لا توجد بيانات إلزامية ناقصة":(lang==="fr"?frenchUI("No required monthly-budget information is missing"):"No required monthly-budget information is missing")}</p>}
  </div>
  <p className="mt-3 text-xs leading-relaxed text-[#806F5C]">{ar?"هدف الادخار وموعد الراتب والسيولة الحالية والفواتير المجدولة اختيارية لهذه المقارنة الشهرية. بيانات السيولة والفواتير تساعد بتقييم إمكانية الدفع بموعد محدد.":(lang==="fr"?frenchUI("Savings targets, payday dates, current cash and scheduled bills are optional for this monthly comparison. Cash and bills help with a separate date-specific payment check."):"Savings targets, payday dates, current cash and scheduled bills are optional for this monthly comparison. Cash and bills help with a separate date-specific payment check.")}</p>
  <Link to="/money" onClick={moneyLink(setupSteps[0]??"review")} className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand underline">
    {ar?"افتح لوحة المالية":(lang==="fr"?frenchUI("Open my Money dashboard"):"Open my Money dashboard")} <ArrowRight className="size-4 rtl:rotate-180"/>
  </Link>
 </div>;
 const hasMonthly=v.unallocated!==null;
 const gap=v.monthlyGap;
 const needsMore=gap!==null&&gap<0;
 const cashIssue=v.cashAssessment==="caution"||v.cashAssessment==="shortfall";
 const suggest=v.monthlyFlexible.find(c=>c.room>=Math.abs(gap??0));
 return <section className="mt-4 space-y-3" aria-label={ar?"ماذا أفعل الآن؟":(lang==="fr"?frenchUI("What should I do next?"):"What should I do next?")}>
  <div className="rounded-2xl border border-[#D9E5D6] bg-white p-4">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><p className="text-xs font-semibold text-brand">{ar?"القرار الحالي":(lang==="fr"?frenchUI("YOUR DECISION"):"YOUR DECISION")}</p>
     <h3 className="mt-1 text-lg font-semibold">{ar?"هل يناسبنا هذا المصروف؟":(lang==="fr"?frenchUI("Can this plan fit our budget?"):"Can this plan fit our budget?")}</h3></div>
    <button type="button" className="min-h-10 rounded-full border border-[#D1E0D1] px-3 text-xs font-semibold text-brand" onClick={openEdit}>
     {ar?"عدّل التكلفة أو الموعد":(lang==="fr"?frenchUI("Edit cost or date"):"Edit cost or date")}</button>
   </div>
   <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#EDF3EA] px-3 py-3">
    <div><p className="text-xs text-muted-foreground">{ar?"تكلفة الخطة التي سنقارنها":(lang==="fr"?frenchUI("Plan cost being checked"):"Plan cost being checked")}</p>
     <p className="mt-1 text-xl font-semibold tabular-nums">{v.cost===null?(ar?"غير محددة":(lang==="fr"?frenchUI("Not set yet"):"Not set yet")):fmtJOD(v.cost)}</p></div>
    <span className="text-xs text-muted-foreground">{v.month}</span>
   </div>
   {editing&&<div className="mt-3 space-y-3 rounded-xl border border-[#D7E4D8] p-3">
     <label className="block text-xs font-semibold">{ar?"سقف التكلفة (دينار)":(lang==="fr"?frenchUI("Estimated cost ceiling (JOD)"):"Estimated cost ceiling (JOD)")}
      <Input type="number" min={0} max={100000} step=".01" className="mt-1" value={limit} onChange={e=>setLimit(e.target.value)}/></label>
     <label className="block text-xs font-semibold">{ar?"التاريخ المتوقع":(lang==="fr"?frenchUI("Expected date"):"Expected date")}
      <Input type="date" className="mt-1" value={when} onChange={e=>setWhen(e.target.value)}/></label>
     {error&&<p className="text-xs text-destructive" role="alert">{error}</p>}
     <div className="flex gap-2"><Button type="button" size="sm" onClick={save}>{ar?"حفظ":(lang==="fr"?frenchUI("Save"):"Save")}</Button><Button type="button" size="sm" variant="ghost" onClick={()=>setEditing(false)}>{ar?"إلغاء":(lang==="fr"?frenchUI("Cancel"):"Cancel")}</Button></div>
   </div>}
   {v.choiceExceedsLimit!==null&&v.choiceExceedsLimit>0&&<p className="mt-2 text-xs font-semibold text-[#9C5155]">{ar?"الخيار المختار أعلى من سقفك بـ ":(lang==="fr"?frenchUI("Your chosen option exceeds the ceiling by "):"Your chosen option exceeds the ceiling by ")}{fmtJOD(v.choiceExceedsLimit)}</p>}
  </div>
  {first||!hasMonthly?<div className="space-y-3">
    {setupGuide}
    {first&&<QuickMoneySetup money={money} setMoney={setMoney}/>}
    <Link to={explore} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand underline">
     {ar?"قارن الخيارات الآن، حتى لو كانت الميزانية غير مكتملة":(lang==="fr"?frenchUI("Compare options without completing Money first"):"Compare options without completing Money first")} <ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </div>:v.cost===null?<div className="rounded-2xl bg-[#F2F6EE] p-4">
     <h4 className="font-semibold">{ar?"حدد تكلفة تقريبية أولاً":(lang==="fr"?frenchUI("Start with an estimated cost"):"Start with an estimated cost")}</h4>
     <Button className="mt-3" onClick={openEdit}>{ar?"أدخل المبلغ":(lang==="fr"?frenchUI("Enter cost"):"Enter cost")}</Button>
   </div>:<>
    <div className={"rounded-2xl border p-4 "+(needsMore?"border-[#EDC9CB] bg-[#FFF3F2]":"border-[#D2E5D7] bg-[#F1F7F0]")}>
      <p className="text-xs font-semibold">{ar?"التقييم المبدئي للشهر":(lang==="fr"?frenchUI("YOUR MONTHLY BUDGET CHECK"):"YOUR MONTHLY BUDGET CHECK")}</p>
      <h4 className="mt-2 text-lg font-semibold">{needsMore?
       (ar?"الخطة تحتاج مبلغ إضافي: ":(lang==="fr"?frenchUI("Your plan needs another "):"Your plan needs another "))+fmtJOD(Math.abs(gap!)):
       (ar?"الخطة تدخل ضمن المخصص غير الموزع":(lang==="fr"?frenchUI("This plan fits your unallocated monthly budget"):"This plan fits your unallocated monthly budget"))}</h4>
      <div className="mt-3 grid grid-cols-2 gap-2">
       <div className="rounded-xl bg-white/80 p-3"><p className="text-xs text-muted-foreground">{ar?"غير موزع قبل الخطة":(lang==="fr"?frenchUI("Unallocated before plan"):"Unallocated before plan")}</p><p className="mt-1 text-lg font-semibold tabular-nums">{fmtJOD(v.unallocated!)}</p></div>
       <div className="rounded-xl bg-white/80 p-3"><p className="text-xs text-muted-foreground">{ar?"بعد تكلفة الخطة":(lang==="fr"?frenchUI("After this plan"):"After this plan")}</p><p className="mt-1 text-lg font-semibold tabular-nums">{fmtJOD(gap!)}</p></div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"هذا حساب ميزانية شهرية وليس مالاً مؤكداً في البنك.":(lang==="fr"?frenchUI("This is monthly planning room, not money verified in a bank account."):"This is monthly planning room, not money verified in a bank account.")}</p>
    </div>
    <div className="rounded-2xl border border-[#DCE6D8] bg-white p-4">
      <h4 className="text-base font-semibold">{ar?"شو نعمل هلأ؟":(lang==="fr"?frenchUI("Your best next step"):"Your best next step")}</h4>
      <p className="mt-2 text-sm leading-relaxed">{needsMore?suggest?
       (ar?"ينقصك "+fmtJOD(Math.abs(gap!))+"؛ يمكنك مراجعة مخصص "+suggest.name+" في المالية بدلاً من المساس بالادخار تلقائياً.":
       "You're short by "+fmtJOD(Math.abs(gap!))+". Consider reviewing the "+suggest.name+" budget in Money, rather than automatically reducing savings."):
       (ar?"التكلفة أعلى من المبلغ غير الموزع. قارن خيارات أقل سعراً، أو غيّر السقف، أو أجّل الخطة.":(lang==="fr"?frenchUI("This costs more than your unallocated funds. Compare cheaper options, reduce the cost or schedule it later."):"This costs more than your unallocated funds. Compare cheaper options, reduce the cost or schedule it later.")):
       (ar?"ابدأ بمقارنة الخيارات حسب السعر والجودة. وقبل الدفع راجع السيولة والفواتير.":(lang==="fr"?frenchUI("Compare options by price and quality. Before paying, check actual cash and upcoming bills."):"Compare options by price and quality. Before paying, check actual cash and upcoming bills."))}</p>
      {v.otherPlans>0&&<p className="mt-2 text-xs text-[#8D6944]">{ar?"تنبيه: لديك "+v.otherPlans+" خطط أخرى في الشهر نفسه، ولم تُخصم تكاليفها هنا.":"You have "+v.otherPlans+" other plans in this month; their costs aren't deducted here."}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
       {needsMore&&v.suggestedCeiling!==null&&v.costSource!=="option"&&v.suggestedCeiling<(plan.budgetJod??Infinity)&&
        <Button size="sm" variant="outline" onClick={()=>{
         if(!window.confirm(ar?"تأكيد خفض سقف الخطة إلى "+fmtJOD(v.suggestedCeiling!)+"؟":"Lower the plan ceiling to "+fmtJOD(v.suggestedCeiling!)+"?"))return;
         onUpdate({...plan,budgetJod:v.suggestedCeiling!,updatedAt:new Date().toISOString()});
         toast.success(ar?"تم تعديل سقف الخطة.":(lang==="fr"?frenchUI("Plan ceiling updated."):"Plan ceiling updated."));
        }}>{ar?"خفض السقف إلى ":(lang==="fr"?frenchUI("Lower ceiling to "):"Lower ceiling to ")}{fmtJOD(v.suggestedCeiling)}</Button>}
       <Link to={explore} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white">
        {ar?"قارن الخيارات الآن":(lang==="fr"?frenchUI("Compare options"):"Compare options")} <ArrowRight className="size-4 rtl:rotate-180"/></Link>
       {needsMore&&<Link to="/money" className="inline-flex min-h-11 items-center rounded-full border border-[#D6E5D7] px-3 text-xs font-semibold text-brand">{ar?"راجع الميزانية":(lang==="fr"?frenchUI("Adjust my budget"):"Adjust my budget")}</Link>}
      </div>
    </div>
   </>}
  {!first&&hasMonthly&&v.cost!==null&&<details className="rounded-2xl border border-[#DEE5DE] bg-white px-4 py-3">
     <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand"><Calculator className="size-4"/>{ar?"كيف حسبنا هذا؟ وهل في سيولة للدفع؟":(lang==="fr"?frenchUI("See calculation & cash check"):"See calculation & cash check")}</summary>
     <div className="mt-4 space-y-2 text-sm">
      <div className="flex justify-between gap-2"><span>{ar?"دخل شهري تقديري":(lang==="fr"?frenchUI("Estimated monthly income"):"Estimated monthly income")}</span><strong>{fmtJOD(v.income)}</strong></div>
      {v.carryover!==0&&<div className="flex justify-between gap-2"><span>{ar?"ترحيل الشهر الماضي":(lang==="fr"?frenchUI("Last month's carryover"):"Last month's carryover")}</span><strong>{fmtJOD(v.carryover)}</strong></div>}
      <div className="flex justify-between gap-2"><span>{ar?"مخصصات المصاريف":(lang==="fr"?frenchUI("Budgeted expenses"):"Budgeted expenses")}</span><strong>− {fmtJOD(v.budgets)}</strong></div>
      <div className="flex justify-between gap-2"><span>{ar?"هدف الادخار":(lang==="fr"?frenchUI("Savings goal"):"Savings goal")}</span><strong>− {fmtJOD(v.savings)}</strong></div>
      <div className="flex justify-between gap-2 border-t border-border pt-2"><span>{ar?"قبل الخطة":(lang==="fr"?frenchUI("Before plan"):"Before plan")}</span><strong>{fmtJOD(v.unallocated!)}</strong></div>
      <div className="mt-3 flex gap-2 border-t border-border pt-3"><Wallet className="mt-1 size-4 shrink-0 text-brand"/><div>
       <p className="font-semibold">{ar?"السيولة النقدية منفصلة عن ميزانية الشهر":(lang==="fr"?frenchUI("Cash availability is a separate check"):"Cash availability is a separate check")}</p>
       <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{v.cashAssessment==="missing"?
        (ar?"البيانات غير مكتملة للتحقق من الرصيد والفواتير.":(lang==="fr"?frenchUI("A cash balance and dated bills are needed before a cash assessment."):"A cash balance and dated bills are needed before a cash assessment.")):
        v.cashAssessment==="future"?(ar?"موعد الخطة خارج الثلاثين يوماً المقبلة. رصيد اليوم لا يضمن السيولة حينها.":(lang==="fr"?frenchUI("This plan is beyond 30 days; today's cash cannot establish future availability."):"This plan is beyond 30 days; today's cash cannot establish future availability.")):
        v.cashAssessment==="fits"?(ar?"الرصيد المدخل يغطي المبلغ بعد الفواتير المسجلة والاحتياطي، لكن المصاريف غير المجدولة غير محسوبة.":(lang==="fr"?frenchUI("Entered cash covers the amount after scheduled bills and reserve, excluding unscheduled costs."):"Entered cash covers the amount after scheduled bills and reserve, excluding unscheduled costs.")):
        v.cashAssessment==="caution"?(ar?"فواتير متأخرة أو عجز متوقع يحتاج مراجعة.":(lang==="fr"?frenchUI("Overdue bills or a forecast shortfall require review."):"Overdue bills or a forecast shortfall require review.")):
        (ar?"الرصيد بعد الفواتير المسجلة لا يكفي للخطة.":(lang==="fr"?frenchUI("Entered cash after scheduled bills is insufficient."):"Entered cash after scheduled bills is insufficient."))}</p>
       {v.cashRemaining!==null&&<p className="mt-1 text-sm font-semibold">{ar?"بعد الفواتير والاحتياطي: ":(lang==="fr"?frenchUI("After bills and reserve: "):"After bills and reserve: ")}{fmtJOD(v.cashRemaining)}</p>}
       <Link to="/money" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">{ar?"مراجعة المالية":(lang==="fr"?frenchUI("Open Money"):"Open Money")} <ArrowRight className="size-3"/></Link>
      </div></div>
     </div>
   </details>}
  <p className="flex gap-2 px-1 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0"/>{ar?"هذه توصيات مبنية على الأرقام المُدخلة، وليست موافقة مالية. لا نغيّر بيانات الميزانية أو البنك دون تأكيد.":(lang==="fr"?frenchUI("These are explanations based on entered figures, not a spending guarantee. Your Money records aren't changed without confirmation."):"These are explanations based on entered figures, not a spending guarantee. Your Money records aren't changed without confirmation.")}</p>
 </section>;
}
