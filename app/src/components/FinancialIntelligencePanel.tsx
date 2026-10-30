import {frenchUI} from "@/lib/french";
import {useMemo,useState} from "react";
import {BarChart3,LineChart,ShieldAlert} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD,useLocalState} from "@/lib/storage";
import {MONTH_REVIEW_KEY,captureSpendingReview,reviewState,reviewedBaselineMonths,type MonthReview} from "@/lib/spendingMonthReview";
import {spendingHistory,detectSpendingChanges,forecastBudgetScenarios,type LongRangeAssumptions} from "@/lib/financialIntelligence";
import type {MoneyState} from "@/lib/money";

export function FinancialIntelligencePanel({state}:{state:MoneyState}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [horizon,setHorizon]=useState<3|6|12>(6);
 const [oneOff,setOneOff]=useState("0");
 const [when,setWhen]=useState("1");
 const [monthlyExtra,setMonthlyExtra]=useState("0");
 const [incomeChange,setIncomeChange]=useState("0");
 const [reviews,setReviews,reviewsReady]=useLocalState<MonthReview[]>(MONTH_REVIEW_KEY,[]);
 const currentMonth=new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0");
 const history=useMemo(()=>spendingHistory(state),[state]);
 const reviewed=useMemo(()=>reviewedBaselineMonths(state,reviews),[state,reviews]);
 const flags=useMemo(()=>detectSpendingChanges(state,new Date(),reviewed),[state,reviewed]);
 const showPlan=(month:string,defaultPlan:number)=>reviewState(state,month,reviews)==="reviewed"?
  (reviews.find(r=>r.month===month)?.capturedPlanJod??defaultPlan):defaultPlan;
 const args:LongRangeAssumptions={months:horizon,onceOffJod:Number(oneOff),onceOffMonth:Number(when),
  monthlyExtraJod:Number(monthlyExtra),monthlyIncomeChangeJod:Number(incomeChange)};
 const scenario=forecastBudgetScenarios(state,args);
 const largest=Math.max(1,...history.map(h=>Math.max(h.spentJod,showPlan(h.month,h.plannedJod))));
 if(!reviewsReady)return null;
 return <section className="editorial-card mb-4 p-4 sm:p-5" aria-label={ar?"تحليل مصروف العائلة":(lang==="fr"?frenchUI("Family financial intelligence"):"Family financial intelligence")}>
  <div className="flex items-start gap-3">
   <BarChart3 className="mt-0.5 size-6 shrink-0 text-brand"/>
   <div>
    <h2 className="font-semibold">{ar?"فهم مصاريفك مع الوقت":(lang==="fr"?frenchUI("Understand spending over time"):"Understand spending over time")}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"آخر ستة أشهر من المصاريف المدفوعة التي أدخلتها. الأشهر بدون تسجيل ليست دليلاً على عدم الإنفاق.":(lang==="fr"?frenchUI("Six months of paid expenses you entered. An empty month means no recorded entries, not necessarily zero real-world spending."):"Six months of paid expenses you entered. An empty month means no recorded entries, not necessarily zero real-world spending.")}</p>
   </div>
  </div>
  {state.demo?<p className="mt-3 rounded-xl bg-[#FFF8EC] p-3 text-xs">{ar?"الأرقام التجريبية للتوضيح فقط؛ لن نعرض أنماطاً تخص عائلتك حتى تدخل بياناتك.":(lang==="fr"?frenchUI("Sample financial figures are for demonstration, not evidence of your household's spending patterns."):"Sample financial figures are for demonstration, not evidence of your household's spending patterns.")}</p>:
   <div className="mt-4 space-y-3">
    {history.map(h=><div key={h.month}>
     <div className="mb-1 flex flex-wrap justify-between gap-1 text-[11px]">
      <span className="font-semibold">{h.month} · {h.transactionCount} {ar?"مصروف مسجّل":(lang==="fr"?frenchUI("recorded expenses"):"recorded expenses")}</span>
      <span>{fmtJOD(h.spentJod)} / {fmtJOD(showPlan(h.month,h.plannedJod))} {ar?"مخطط":(lang==="fr"?frenchUI("planned"):"planned")}</span>
     </div>
     <div className="relative h-3 overflow-hidden rounded-full bg-[#EDF1EA]">
      <div className="absolute inset-y-0 start-0 rounded-full bg-[#BCD1BE]" style={{width:(showPlan(h.month,h.plannedJod)/largest*100)+"%"}}/>
      <div className="absolute inset-y-0 start-0 rounded-full bg-[#4C8066]" style={{width:(h.spentJod/largest*100)+"%"}}/>
     </div>
     <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{h.month===currentMonth?
       (ar?"الشهر ما زال جارياً — غير مكتمل":(lang==="fr"?frenchUI("Current month is still in progress"):"Current month is still in progress")):
       reviewState(state,h.month,reviews)==="reviewed"?
       (ar?"راجعتُ المصاريف المسجلة":(lang==="fr"?frenchUI("Parent reviewed recorded entries"):"Parent reviewed recorded entries")):
       reviewState(state,h.month,reviews)==="changed"?
       (ar?"تغيرت المصاريف بعد المراجعة":(lang==="fr"?frenchUI("Entries changed since review"):"Entries changed since review")):
       (ar?"لم تراجع البيانات المسجلة":(lang==="fr"?frenchUI("Recorded entries not yet reviewed"):"Recorded entries not yet reviewed"))}</span>
      {h.month<currentMonth&&<button type="button"
       className="min-h-9 rounded-lg border border-[#D4E2D1] bg-white px-2 font-semibold text-brand"
       onClick={()=>setReviews(old=>[...old.filter(x=>x.month!==h.month),
        captureSpendingReview(state,h.month)].slice(-24))}>
       {reviewState(state,h.month,reviews)==="unreviewed"?
        (ar?"راجعتُ الإدخالات":(lang==="fr"?frenchUI("I reviewed these entries"):"I reviewed these entries")):
        (ar?"أعد تأكيد المراجعة":(lang==="fr"?frenchUI("Re-review entries"):"Re-review entries"))}
      </button>}
     </div>
    </div>)}
    <p className="text-[11px] text-muted-foreground">{ar?"الأخضر الداكن: مصاريف مسجلة. الفاتح: الميزانية كما كانت وقت تأكيدك مراجعة الشهر، أو ميزانية اليوم قبل المراجعة؛ ليس تأكيداً لميزانيات الماضي.":(lang==="fr"?frenchUI("Dark green: recorded actuals. Light green: the budget captured when you manually reviewed that month, or the current budget if unreviewed. This is not proof those historical budgets originally applied."):"Dark green: recorded actuals. Light green: the budget captured when you manually reviewed that month, or the current budget if unreviewed. This is not proof those historical budgets originally applied.")}</p>
    {reviewed.size<2&&<p className="text-[11px] text-muted-foreground">{ar?"لتفادي تنبيهات مضلّلة، لا نقارن الزيادات قبل مراجعة إدخالات شهرين سابقين على الأقل. المراجعة ذاتية ولا تؤكد شمول المصاريف الفعلية.":(lang==="fr"?frenchUI("Spending-change warnings wait for at least two past months you reviewed. Reviewing confirms only that you inspected these entries—not that all real spending was captured."):"Spending-change warnings wait for at least two past months you reviewed. Reviewing confirms only that you inspected these entries—not that all real spending was captured.")}</p>}
    {flags.length>0&&<div className="mt-3 rounded-xl border border-[#E9D8CB] bg-[#FFF9F1] p-3">
     <div className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="size-4"/>
      {ar?"زيادة تستحق المراجعة":(lang==="fr"?frenchUI("Spending increases worth reviewing"):"Spending increases worth reviewing")}</div>
     {flags.map(f=><p key={f.categoryId} className="mt-2 text-xs">
      <strong>{f.categoryName}</strong>: {fmtJOD(f.monthJod)} {ar?"هذا الشهر مقابل متوسط":(lang==="fr"?frenchUI("this month vs. average"):"this month vs. average")} {fmtJOD(f.priorAverageJod)}
      <span className="block text-muted-foreground">{ar?"مبني فقط على أشهر كان فيها مصروف مسجّل؛ قد تكون هناك فواتير موسمية أو معلومات ناقصة.":(lang==="fr"?frenchUI("Based on prior months with entries only; seasonality, timing or missing records may explain the difference."):"Based on prior months with entries only; seasonality, timing or missing records may explain the difference.")}</span>
     </p>)}
    </div>}
   </div>}
  <div className="mt-6 border-t border-[#DDE8DD] pt-4">
   <div className="flex items-center gap-2"><LineChart className="size-5 text-brand"/>
    <h3 className="font-semibold">{ar?"اختبر سيناريو مالي لـ٣ أو ٦ أو ١٢ شهر":(lang==="fr"?frenchUI("What-if budget for 3, 6 or 12 months"):"What-if budget for 3, 6 or 12 months")}</h3></div>
   <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"أدخل فقط تكاليف إضافية غير موجودة ضمن الفئات الحالية؛ لا نكرر الفواتير المسجلة تلقائياً ولا ندعي أن الناتج رصيد بنكي.":(lang==="fr"?frenchUI("Enter only EXTRA expenses not already in budget categories. This is a monthly envelope projection—not a bank balance, dated-bill forecast, or verified financial advice."):"Enter only EXTRA expenses not already in budget categories. This is a monthly envelope projection—not a bank balance, dated-bill forecast, or verified financial advice.")}</p>
   <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
    <label className="text-xs font-semibold">{ar?"المدة":(lang==="fr"?frenchUI("Horizon"):"Horizon")}
     <select value={horizon} onChange={e=>{setHorizon(Number(e.target.value) as 3|6|12);setWhen("1");}}
      className="mt-1 min-h-11 w-full rounded-xl border px-2">
      {[3,6,12].map(n=><option key={n} value={n}>{n} {ar?"أشهر":(lang==="fr"?frenchUI("months"):"months")}</option>)}
     </select>
    </label>
    <label className="text-xs font-semibold">{ar?"دفعة إضافية واحدة JOD":(lang==="fr"?frenchUI("Extra one-off JOD"):"Extra one-off JOD")}
     <input type="number" min="0" max="100000" step=".01" value={oneOff} onChange={e=>setOneOff(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-2"/>
    </label>
    <label className="text-xs font-semibold">{ar?"شهر الدفعة":(lang==="fr"?frenchUI("Payment month"):"Payment month")}
     <select value={when} onChange={e=>setWhen(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border px-2">
      {Array.from({length:horizon},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}
     </select>
    </label>
    <label className="text-xs font-semibold">{ar?"مصروف إضافي شهري JOD":(lang==="fr"?frenchUI("Extra cost per month JOD"):"Extra cost per month JOD")}
     <input type="number" min="0" max="100000" step=".01" value={monthlyExtra} onChange={e=>setMonthlyExtra(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-2"/>
    </label>
    <label className="text-xs font-semibold sm:col-span-2">{ar?"تغير الدخل الشهري JOD (سالب للنقص)":(lang==="fr"?frenchUI("Monthly income change JOD (negative = decrease)"):"Monthly income change JOD (negative = decrease)")}
     <input type="number" min="-100000" max="100000" step=".01" value={incomeChange}
      onChange={e=>setIncomeChange(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border px-2"/>
    </label>
   </div>
   {!scenario.ready?<p role="status" className="mt-3 rounded-lg bg-[#FFF8ED] p-3 text-xs">
    {ar?"أكمل أرقاماً فعلية وصحيحة لعرض السيناريو.":(lang==="fr"?frenchUI("Real, valid budgeting data is needed before modeling this scenario."):"Real, valid budgeting data is needed before modeling this scenario.")}
    <span className="block text-muted-foreground">{scenario.reason}</span></p>:
    <div className="mt-4">
     <div className="flex flex-wrap gap-3 rounded-xl bg-[#F1F7ED] p-3 text-sm">
      <span>{ar?"صافي الفائض/العجز التراكمي الافتراضي":(lang==="fr"?frenchUI("Hypothetical cumulative budget net"):"Hypothetical cumulative budget net")}:
       <strong className="ms-1">{fmtJOD(scenario.totalNetJod??0)}</strong></span>
      <span>{ar?"أشهر بعجز":(lang==="fr"?frenchUI("Deficit months"):"Deficit months")}: <strong>{scenario.negativeMonths}</strong></span>
     </div>
     <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-[#E2E9DF]">
      <table className="w-full text-xs"><thead className="bg-[#F1F7ED]"><tr>
       <th className="p-2 text-start">{ar?"الشهر":(lang==="fr"?frenchUI("Month"):"Month")}</th>
       <th className="p-2 text-end">{ar?"دخل مفترض":(lang==="fr"?frenchUI("Planned income"):"Planned income")}</th>
       <th className="p-2 text-end">{ar?"تكاليف + ادخار":(lang==="fr"?frenchUI("Costs + savings"):"Costs + savings")}</th>
       <th className="p-2 text-end">{ar?"الصافي":(lang==="fr"?frenchUI("Net"):"Net")}</th>
      </tr></thead><tbody>{scenario.rows.map(row=><tr key={row.month} className="border-t border-[#E4EADF]">
       <td className="p-2">{row.month}</td>
       <td className="p-2 text-end">{row.plannedIncomeJod.toFixed(2)}</td>
       <td className="p-2 text-end">{(row.plannedCostsJod+row.savingsTargetJod+row.oneOffJod).toFixed(2)}</td>
       <td className={"p-2 text-end font-semibold "+(row.netJod<0?"text-[#A15441]":"text-brand")}>{row.netJod.toFixed(2)}</td>
      </tr>)}</tbody></table>
     </div>
    </div>}
   <p className="mt-3 text-[11px] text-muted-foreground">{ar?"لا نعدّل أموالك أو ننفذ أي دفعة. الدخل المتوقع قد يتأخر، وقد تكون مصاريف حقيقية غير مسجلة.":(lang==="fr"?frenchUI("Read-only scenario: no changes to Money, no payments and no assurance that expected income arrives or all costs are recorded."):"Read-only scenario: no changes to Money, no payments and no assurance that expected income arrives or all costs are recorded.")}</p>
  </div>
 </section>;
}
