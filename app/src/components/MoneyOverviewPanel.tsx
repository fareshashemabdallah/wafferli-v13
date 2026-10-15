import {AlertCircle,ArrowRight,CalendarClock,Info,Landmark,Plus,Wallet} from "lucide-react";
import {fmtJOD} from "@/lib/storage";
import type {MoneyState} from "@/lib/money";
import {emptyRealMoney,getMoneyOverview} from "@/lib/moneyOverview";
import {budgetAlignment} from "@/lib/financeAlignment";
import {MoneyGuidance} from "@/components/MoneyGuidance";
import {useI18n} from "@/lib/i18n";

type Section="overview"|"spending"|"planning";
type Props={state:MoneyState;setState:(fn:(s:MoneyState)=>MoneyState)=>void;goTo:(s:Section)=>void};
export function MoneyOverviewPanel({state,setState,goTo}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const v=getMoneyOverview(state);
 const f=v.forecast,c=v.month;
 const alignment=budgetAlignment(state);
 const cash=state.cashOnHand;
 const needReview=f.overdueCount>0||(f.minimumBalance!==null&&f.minimumBalance<0);
 const resetToActual=()=>{
   const message=ar?"هذا سيستبدل بيانات المالية التجريبية أو المسجلة على هذا الجهاز بصفحة مالية فارغة. لن تتغير معلومات العائلة أو التقويم. هل تريد المتابعة؟":"Start your own finances? This will replace the saved Money sample and any financial entries on this device with a blank Money plan. Family profiles and calendar will stay unchanged.";
   if(window.confirm(message))setState(()=>emptyRealMoney());
 };
 return <div className="space-y-4">
   {state.demo&&<section className="rounded-2xl border border-[#EBDCC9] bg-[#FFF6E9] px-4 py-4">
     <p className="text-sm font-semibold text-ink">{ar?"هذه أرقام للتجربة فقط":"You're viewing example finances"}</p>
     <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?"المبالغ المعروضة ليست بياناتك. ابدأ بصفحة مالية فارغة وسجّل الأرقام الحقيقية عندما تكون جاهزاً.":"Sample rent, income and expenses are not yours. Start with a blank plan when you're ready to enter real figures."}</p>
     <button type="button" onClick={resetToActual} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
       {ar?"ابدأ بماليتي":"Start with my own finances"} <ArrowRight className="size-4 rtl:rotate-180"/>
     </button>
   </section>}
   <section className="editorial-card p-5 sm:p-6" aria-label={ar?"توازن ميزانية الشهر":"Monthly budget alignment"}>
     <div className="flex flex-wrap items-center justify-between gap-2">
       <div><p className="section-eyebrow">{ar?"التخطيط الشهري":"YOUR MONTHLY PLAN"}</p>
       <h2 className="mt-1 text-xl font-semibold">{ar?"هل الدخل والمصاريف والادخار متوازنة؟":"Do your income, expenses and savings fit?"}</h2></div>
       <button type="button" onClick={()=>goTo("planning")} className="text-xs font-semibold text-brand underline underline-offset-2">{ar?"عدّل الدخل والادخار":"Edit income & savings"}</button>
     </div>
     <div className="mt-4 grid grid-cols-3 gap-2">
       <div className="rounded-xl bg-[#EFF5EE] p-3"><p className="text-xs text-muted-foreground">{ar?"دخل الشهر":"Monthly income"}</p><p className="mt-2 text-sm font-semibold tabular-nums sm:text-lg">{fmtJOD(alignment.income)}</p></div>
       <div className="rounded-xl bg-[#F8F0E7] p-3"><p className="text-xs text-muted-foreground">{ar?"مخصص المصاريف":"Expense budgets"}</p><p className="mt-2 text-sm font-semibold tabular-nums sm:text-lg">{fmtJOD(alignment.categories)}</p></div>
       <div className="rounded-xl bg-[#EDF1F5] p-3"><p className="text-xs text-muted-foreground">{ar?"هدف الادخار":"Savings goal"}</p><p className="mt-2 text-sm font-semibold tabular-nums sm:text-lg">{fmtJOD(alignment.savings)}</p></div>
     </div>
     <p className="mt-3 text-sm font-semibold text-ink">{alignment.status==="incomplete"?
        (ar?"أكمل البيانات لنقارنها":"Complete your budget to check alignment"):
        alignment.status==="balanced"?(ar?"الخطة متوازنة":"Your plan is balanced"):
        (alignment.gap<0?(ar?"عجز في الخطة: ":"Plan exceeds income by "):(ar?"غير موزّع في الخطة: ":"Not yet allocated: "))+fmtJOD(Math.abs(alignment.gap))}</p>
     <p className="mt-1 text-xs text-muted-foreground">{ar?"هذه مقارنة مخصصات وهدف ادخار، وليست رصيد البنك أو مصروفاً تم دفعه.":"This compares monthly budget envelopes and the savings goal, not actual bank cash or payments made."}</p>
     <MoneyGuidance scope="alignment" state={state} setState={setState}/>
   </section>
   <section className="editorial-card overflow-hidden p-5 sm:p-6" aria-label={ar?"السيولة والالتزامات":"Cash and commitments"}>
     <div className="flex items-start gap-3">
       <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#E8F1E7] text-brand"><Wallet className="size-6"/></span>
       <div className="min-w-0 flex-1">
        <p className="section-eyebrow">{ar?"الصورة المالية الآن":"YOUR CASH & COMMITMENTS"}</p>
        <h2 className="mt-1 text-xl font-semibold">{v.cashSet?(v.cashAfterBills!==null&&v.cashAfterBills<0?(ar?"عجز بعد الفواتير والاحتياطي":"Shortfall after bills & reserve"):(ar?"بعد الفواتير والاحتياطي":"After scheduled bills & reserve")):(ar?"ابدأ برصيدك الحالي":"Let's begin with your current balance")}</h2>
       </div>
     </div>
     {v.cashSet?<>
       <p className="mt-5 text-3xl font-semibold tabular-nums text-ink sm:text-4xl">{fmtJOD(v.cashAfterBills??0)}</p>
       <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"هذا رصيدك المدخل ناقص الفواتير غير المدفوعة المسجلة خلال ٣٠ يوماً والاحتياطي. ليس مبلغاً آمناً للإنفاق: لا يشمل المصاريف اليومية التي لم تُجدول.":"Your manually entered cash minus recorded unpaid bills over the next 30 days and your reserve. Not a safe-to-spend amount: everyday costs without due dates are excluded."}</p>
     </>:<div className="mt-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{ar?"حتى تكون الحسابات واضحة، أدخل الرصيد الحقيقي المتاح في البنك والنقد، ثم جدول الفواتير المستحقة.":"Enter the actual cash and bank balance you have today, then add due dates for your bills. Monthly budget estimates are not bank balances."}</p>
        <button type="button" onClick={()=>goTo("planning")} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white">
         <Plus className="size-4"/>{ar?"أدخل الرصيد والفواتير":"Set cash & bills"}
        </button>
       </div>}
     <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
       <div className="rounded-2xl bg-[#F1F5EF] p-3">
        <p className="text-xs text-muted-foreground">{ar?"رصيد اليوم":"Cash entered today"}</p>
        <p className="mt-1 text-sm font-semibold tabular-nums">{v.cashSet?fmtJOD(cash!):(ar?"لم يُدخل":"Not set")}</p>
       </div>
       <div className="rounded-2xl bg-[#FBF4EC] p-3">
        <p className="text-xs text-muted-foreground">{ar?"فواتير غير مدفوعة (٣٠ يوم)":"Unpaid bills (30 days)"}</p>
        <p className="mt-1 text-sm font-semibold tabular-nums">{v.hasBillSchedule?fmtJOD(f.upcomingBills):(ar?"لم تُجدول":"Not scheduled")}</p>
       </div>
       <div className="rounded-2xl bg-[#F1F5EF] p-3">
        <p className="text-xs text-muted-foreground">{ar?"احتياطي محمي":"Protected reserve"}</p>
        <p className="mt-1 text-sm font-semibold tabular-nums">{fmtJOD(state.cashReserve??0)}</p>
       </div>
       <div className="rounded-2xl bg-[#F5F4EE] p-3">
        <p className="text-xs text-muted-foreground">{ar?"دخل متوقع (٣٠ يوم)":"Expected income (30 days)"}</p>
        <p className="mt-1 text-sm font-semibold tabular-nums">{v.hasIncomeSchedule?fmtJOD(f.expectedIncome):(ar?"لم يُجدول":"Not scheduled")}</p>
       </div>
     </div>
     {state.cashUpdatedAt&&<p className="mt-3 text-xs font-medium text-brand">{ar?"آخر تحديث للرصيد: ":"Balance last updated: "}{state.cashUpdatedAt}</p>}
     <p className="mt-3 text-xs text-muted-foreground">{ar?"الدخل المتوقع يظهر للمعلومية فقط؛ لا يُضاف إلى رصيد اليوم حتى تستلمه وتحدّث الرصيد يدوياً.":"Expected income is informational only; it isn't included in today's cash. Update cash yourself when it arrives."}</p>
     {!v.hasBillSchedule&&<div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF3E5] p-3 text-sm text-[#835C39]">
       <Info className="mt-0.5 size-4 shrink-0"/><span>{ar?"لا توجد فواتير مجدولة بعد؛ لذلك لا يمكن اعتبار المتبقي متاحاً للإنفاق.":"No bills have been scheduled yet. The number above cannot represent a reliable spending limit."}</span>
     </div>}
     {v.hasBillSchedule&&v.uncategorizedBills>0&&<button type="button" onClick={()=>goTo("planning")} className="mt-3 flex w-full items-start gap-2 rounded-xl bg-[#F0F5ED] p-3 text-start text-sm text-[#496952]">
       <Info className="mt-0.5 size-4 shrink-0"/><span>{ar?"بعض الفواتير غير مرتبطة بفئة مصروف. يمكنك ربطها لتظهر دفعاتها ضمن الفئة الصحيحة.":"Some bills have no spending category. Link them so paid bills appear under the right spending category."}</span>
     </button>}
     {v.dateProblems>0&&<div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FFF3E5] p-3 text-sm text-[#835C39]">
       <AlertCircle className="mt-0.5 size-4 shrink-0"/><span>{ar?"هناك مواعيد دخل أو فواتير غير مكتملة ولن تظهر في التوقعات.":"Some income or bill dates are missing, so those amounts are excluded from the forecast."}</span>
     </div>}
     {needReview&&<div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FFF3E5] p-3 text-sm text-[#835C39]">
       <AlertCircle className="mt-0.5 size-4 shrink-0"/><span>{f.overdueCount>0?(ar?"هناك فواتير مسجلة متأخرة أو لم تؤكد دفعتها بعد.":"Some recorded bills are overdue or not yet confirmed."):(ar?"تُظهر التوقعات نقصاً محتملاً في السيولة.":"The current forecast shows a possible cash shortage.")}</span>
     </div>}
     <button type="button" onClick={()=>goTo("planning")} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">
      <CalendarClock className="size-4"/>{ar?"شوف الدخل والفواتير ومواعيدها":"See income & bill dates"} <ArrowRight className="size-4 rtl:rotate-180"/>
     </button>
   </section>
   <section className="editorial-card p-5 sm:p-6">
    <div className="flex items-center gap-2"><Landmark className="size-5 text-brand"/><h2 className="text-lg font-semibold">{ar?"شو صرفت فعلياً؟":"What have you actually spent?"}</h2></div>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-[#F1F5EF] p-4">
      <div><p className="text-xs text-muted-foreground">{ar?"المدفوع والمسجل هذا الشهر":"Confirmed spending this month"}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{fmtJOD(c.spent)}</p></div>
      <button type="button" onClick={()=>goTo("spending")} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
       {ar?"المصاريف":"View expenses"} <ArrowRight className="size-4 rtl:rotate-180"/>
      </button>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{ar?"أي مصروف مخطط وغير مؤكّد الدفع لا يدخل ضمن المبلغ الفعلي.":"Planned expenses are excluded until you confirm what was actually paid."}</p>
    <MoneyGuidance scope="variance" state={state} setState={setState}/>
   </section>
   <details className="editorial-card px-4 py-3">
    <summary className="cursor-pointer text-sm font-semibold text-brand">{ar?"تفاصيل إضافية وأرقام متوقعة":"Additional estimates (optional)"} +</summary>
    <div className="mt-4 grid grid-cols-2 gap-3">
     <div><p className="text-xs text-muted-foreground">{ar?"هدف الادخار":"Savings target"}</p><p className="mt-1 font-semibold">{fmtJOD(c.savingsTarget)}</p></div>
     <div><p className="text-xs text-muted-foreground">{ar?"التصوّر المتوقع للمصاريف":"Projected monthly spending"}</p><p className="mt-1 font-semibold">{fmtJOD(c.projected)}</p></div>
     <div><p className="text-xs text-muted-foreground">{ar?"فواتير مؤكدة الدفع هذا الشهر":"Bill payments confirmed this month"}</p><p className="mt-1 font-semibold">{v.paidBillsThisMonth}</p></div>
     <div><p className="text-xs text-muted-foreground">{ar?"مصاريف الفواتير المسجلة":"Expenses logged from bill payments"}</p><p className="mt-1 font-semibold">{fmtJOD(v.billExpensesThisMonth)}</p></div>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{ar?"يتم حساب توقع المصاريف الثابتة والدورية من الأعلى بين المخطط والفعلي، والمتغيرة حسب وتيرة الصرف.":"The monthly projection uses the higher of planned or actual for fixed/periodic categories and extrapolates variable spending pace."}</p>
   </details>
   <p className="px-1 text-xs leading-relaxed text-muted-foreground">{ar?"تحتفظ دبّرنا بالأرقام على هذا المتصفح فقط. لا توجد مزامنة بنكية، والتوقعات مشروطة بدقة البيانات.":"Data stays on this device. No bank synchronization is connected; forecasts are only as complete as your entries."}</p>
 </div>;
}
