import {useMemo,useState} from "react";
import {BarChart3,LineChart,ShieldAlert} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD} from "@/lib/storage";
import {spendingHistory,detectSpendingChanges,forecastBudgetScenarios,type LongRangeAssumptions} from "@/lib/financialIntelligence";
import type {MoneyState} from "@/lib/money";

export function FinancialIntelligencePanel({state}:{state:MoneyState}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [horizon,setHorizon]=useState<3|6|12>(6);
 const [oneOff,setOneOff]=useState("0");
 const [when,setWhen]=useState("1");
 const [monthlyExtra,setMonthlyExtra]=useState("0");
 const [incomeChange,setIncomeChange]=useState("0");
 const history=useMemo(()=>spendingHistory(state),[state]);
 const flags=useMemo(()=>detectSpendingChanges(state),[state]);
 const args:LongRangeAssumptions={months:horizon,onceOffJod:Number(oneOff),onceOffMonth:Number(when),
  monthlyExtraJod:Number(monthlyExtra),monthlyIncomeChangeJod:Number(incomeChange)};
 const scenario=forecastBudgetScenarios(state,args);
 const largest=Math.max(1,...history.map(h=>Math.max(h.spentJod,h.plannedJod)));
 return <section className="editorial-card mb-4 p-4 sm:p-5" aria-label={ar?"تحليل مصروف العائلة":"Family financial intelligence"}>
  <div className="flex items-start gap-3">
   <BarChart3 className="mt-0.5 size-6 shrink-0 text-brand"/>
   <div>
    <h2 className="font-semibold">{ar?"فهم مصاريفك مع الوقت":"Understand spending over time"}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{ar?
     "آخر ستة أشهر من المصاريف المدفوعة التي أدخلتها. الأشهر بدون تسجيل ليست دليلاً على عدم الإنفاق.":
     "Six months of paid expenses you entered. An empty month means no recorded entries, not necessarily zero real-world spending."}</p>
   </div>
  </div>
  {state.demo?<p className="mt-3 rounded-xl bg-[#FFF8EC] p-3 text-xs">{ar?
   "الأرقام التجريبية للتوضيح فقط؛ لن نعرض أنماطاً تخص عائلتك حتى تدخل بياناتك.":
   "Sample financial figures are for demonstration, not evidence of your household's spending patterns."}</p>:
   <div className="mt-4 space-y-3">
    {history.map(h=><div key={h.month}>
     <div className="mb-1 flex flex-wrap justify-between gap-1 text-[11px]">
      <span className="font-semibold">{h.month} · {h.transactionCount} {ar?"مصروف مسجّل":"recorded expenses"}</span>
      <span>{fmtJOD(h.spentJod)} / {fmtJOD(h.plannedJod)} {ar?"مخطط":"planned"}</span>
     </div>
     <div className="relative h-3 overflow-hidden rounded-full bg-[#EDF1EA]">
      <div className="absolute inset-y-0 start-0 rounded-full bg-[#BCD1BE]" style={{width:(h.plannedJod/largest*100)+"%"}}/>
      <div className="absolute inset-y-0 start-0 rounded-full bg-[#4C8066]" style={{width:(h.spentJod/largest*100)+"%"}}/>
     </div>
    </div>)}
    <p className="text-[11px] text-muted-foreground">{ar?
     "الأخضر الداكن: المدفوع المسجل · الفاتح: الميزانية الحالية المطبقة على الشهر (قد تكون عدّلتها لاحقاً).":
     "Dark green: recorded actuals · light green: current budget applied to that month (which may have changed since then)."}</p>
    {flags.length>0&&<div className="mt-3 rounded-xl border border-[#E9D8CB] bg-[#FFF9F1] p-3">
     <div className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="size-4"/>
      {ar?"زيادة تستحق المراجعة":"Spending increases worth reviewing"}</div>
     {flags.map(f=><p key={f.categoryId} className="mt-2 text-xs">
      <strong>{f.categoryName}</strong>: {fmtJOD(f.monthJod)} {ar?"هذا الشهر مقابل متوسط":"this month vs. average"} {fmtJOD(f.priorAverageJod)}
      <span className="block text-muted-foreground">{ar?
       "مبني فقط على أشهر كان فيها مصروف مسجّل؛ قد تكون هناك فواتير موسمية أو معلومات ناقصة.":
       "Based on prior months with entries only; seasonality, timing or missing records may explain the difference."}</span>
     </p>)}
    </div>}
   </div>}
  <div className="mt-6 border-t border-[#DDE8DD] pt-4">
   <div className="flex items-center gap-2"><LineChart className="size-5 text-brand"/>
    <h3 className="font-semibold">{ar?"اختبر سيناريو مالي لـ٣ أو ٦ أو ١٢ شهر":"What-if budget for 3, 6 or 12 months"}</h3></div>
   <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
    "أدخل فقط تكاليف إضافية غير موجودة ضمن الفئات الحالية؛ لا نكرر الفواتير المسجلة تلقائياً ولا ندعي أن الناتج رصيد بنكي.":
    "Enter only EXTRA expenses not already in budget categories. This is a monthly envelope projection—not a bank balance, dated-bill forecast, or verified financial advice."}</p>
   <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
    <label className="text-xs font-semibold">{ar?"المدة":"Horizon"}
     <select value={horizon} onChange={e=>{setHorizon(Number(e.target.value) as 3|6|12);setWhen("1");}}
      className="mt-1 min-h-11 w-full rounded-xl border px-2">
      {[3,6,12].map(n=><option key={n} value={n}>{n} {ar?"أشهر":"months"}</option>)}
     </select>
    </label>
    <label className="text-xs font-semibold">{ar?"دفعة إضافية واحدة JOD":"Extra one-off JOD"}
     <input type="number" min="0" max="100000" step=".01" value={oneOff} onChange={e=>setOneOff(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-2"/>
    </label>
    <label className="text-xs font-semibold">{ar?"شهر الدفعة":"Payment month"}
     <select value={when} onChange={e=>setWhen(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border px-2">
      {Array.from({length:horizon},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}
     </select>
    </label>
    <label className="text-xs font-semibold">{ar?"مصروف إضافي شهري JOD":"Extra cost per month JOD"}
     <input type="number" min="0" max="100000" step=".01" value={monthlyExtra} onChange={e=>setMonthlyExtra(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-2"/>
    </label>
    <label className="text-xs font-semibold sm:col-span-2">{ar?"تغير الدخل الشهري JOD (سالب للنقص)":"Monthly income change JOD (negative = decrease)"}
     <input type="number" min="-100000" max="100000" step=".01" value={incomeChange}
      onChange={e=>setIncomeChange(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border px-2"/>
    </label>
   </div>
   {!scenario.ready?<p role="status" className="mt-3 rounded-lg bg-[#FFF8ED] p-3 text-xs">
    {ar?"أكمل أرقاماً فعلية وصحيحة لعرض السيناريو.":"Real, valid budgeting data is needed before modeling this scenario."}
    <span className="block text-muted-foreground">{scenario.reason}</span></p>:
    <div className="mt-4">
     <div className="flex flex-wrap gap-3 rounded-xl bg-[#F1F7ED] p-3 text-sm">
      <span>{ar?"صافي الفائض/العجز التراكمي الافتراضي":"Hypothetical cumulative budget net"}:
       <strong className="ms-1">{fmtJOD(scenario.totalNetJod??0)}</strong></span>
      <span>{ar?"أشهر بعجز":"Deficit months"}: <strong>{scenario.negativeMonths}</strong></span>
     </div>
     <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-[#E2E9DF]">
      <table className="w-full text-xs"><thead className="bg-[#F1F7ED]"><tr>
       <th className="p-2 text-start">{ar?"الشهر":"Month"}</th>
       <th className="p-2 text-end">{ar?"دخل مفترض":"Planned income"}</th>
       <th className="p-2 text-end">{ar?"تكاليف + ادخار":"Costs + savings"}</th>
       <th className="p-2 text-end">{ar?"الصافي":"Net"}</th>
      </tr></thead><tbody>{scenario.rows.map(row=><tr key={row.month} className="border-t border-[#E4EADF]">
       <td className="p-2">{row.month}</td>
       <td className="p-2 text-end">{row.plannedIncomeJod.toFixed(2)}</td>
       <td className="p-2 text-end">{(row.plannedCostsJod+row.savingsTargetJod+row.oneOffJod).toFixed(2)}</td>
       <td className={"p-2 text-end font-semibold "+(row.netJod<0?"text-[#A15441]":"text-brand")}>{row.netJod.toFixed(2)}</td>
      </tr>)}</tbody></table>
     </div>
    </div>}
   <p className="mt-3 text-[11px] text-muted-foreground">{ar?
    "لا نعدّل أموالك أو ننفذ أي دفعة. الدخل المتوقع قد يتأخر، وقد تكون مصاريف حقيقية غير مسجلة.":
    "Read-only scenario: no changes to Money, no payments and no assurance that expected income arrives or all costs are recorded."}</p>
  </div>
 </section>;
}
