import {frenchUI} from "@/lib/french";
import {useMemo,useState} from "react";
import {FileText,Printer,ChevronDown} from "lucide-react";
import type {MoneyState} from "@/lib/money";
import type {FamilyPlan} from "@/lib/familyPlans";
import {buildMonthlyMoneyReport} from "@/lib/monthlyMoneyReport";
import {localToday} from "@/lib/cashflow";
import {useI18n} from "@/lib/i18n";

type Props={state:MoneyState;plans:readonly FamilyPlan[]};
const printCss=String.raw`
@media print {
 @page { size:A4; margin:12mm; }
 html,body,#root {overflow:visible!important;height:auto!important;max-height:none!important;background:#fff!important;}
 body * {visibility:hidden!important;}
 #dabberna-monthly-report,#dabberna-monthly-report * {visibility:visible!important;}
 #dabberna-monthly-report {position:absolute!important;top:0!important;left:0!important;
  width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;
  border:0!important;box-shadow:none!important;background:#fff!important;color:#111827!important;}
 .money-report-screen-only {display:none!important;}
 .money-report-scroll {overflow:visible!important;max-height:none!important;}
 #dabberna-monthly-report table {width:100%!important;border-collapse:collapse!important;font-size:9pt!important;}
 #dabberna-monthly-report th,#dabberna-monthly-report td {padding:4px 5px!important;overflow-wrap:anywhere!important;}
 #dabberna-monthly-report tr {break-inside:avoid!important;}
 #dabberna-monthly-report .money-report-group {break-inside:avoid-page!important;}
 #dabberna-monthly-report .money-report-subtitle {color:#475569!important;}
 #dabberna-monthly-report .money-report-page {break-before:page!important;}
 #dabberna-monthly-report h2 {margin-top:14px!important;}
}
`;
const number=(n:number)=>Number.isFinite(n)?n.toFixed(2):"—";

export function MoneyMonthlyReport({state,plans}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:lang==="fr"?frenchUI(en):en;
 const [open,setOpen]=useState(false);
 const [month,setMonth]=useState(localToday().slice(0,7));
 const report=useMemo(()=>buildMonthlyMoneyReport(state,month,new Date(),plans),[state,month,plans]);
 const fmt=(n:number|null)=>n===null?t("Not recorded","غير مسجل"):number(n)+" "+t("JOD","د.أ");
 const exportPdf=()=>{window.print();};
 const summary=report.classification.map(g=>({
  role:g.role,planned:g.planned,paid:g.paid
 }));
 return <section className="my-4" aria-label={t("Generate monthly Money report","إنشاء تقرير المال الشهري")}>
  <style>{printCss}</style>
  <div className="money-report-screen-only flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#D7E7D9] bg-[#F4FAF2] p-3">
   <div className="flex items-center gap-2">
    <FileText className="size-5 text-[#367953]" aria-hidden="true"/>
    <div>
     <p className="text-sm font-semibold text-[#254D39]">{t("Monthly report","التقرير الشهري")}</p>
    </div>
   </div>
   <button type="button" onClick={()=>setOpen(x=>!x)}
    aria-expanded={open} aria-controls="dabberna-monthly-report"
    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2B7651] px-4 text-sm font-semibold text-white">
    {open?t("Close report","إغلاق التقرير"):t("Generate report","إنشاء التقرير")}
    <ChevronDown className={"size-4 "+(open?"rotate-180":"")} aria-hidden="true"/>
   </button>
  </div>
  {open&&<div className="mt-3">
   <div className="money-report-screen-only mb-3 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-[#DAE6DD] bg-white p-3">
    <label className="text-sm font-semibold">{t("Reporting month","شهر التقرير")}
     <input type="month" value={month} max={localToday().slice(0,7)} min="2000-01"
      onChange={e=>{if(/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)&&e.target.value<=localToday().slice(0,7))setMonth(e.target.value);}}
      className="mt-1 block min-h-11 rounded-lg border border-[#CBDCCF] px-3" />
    </label>
    <button type="button" onClick={exportPdf}
     className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2B7651] px-4 font-semibold text-white">
     <Printer className="size-4"/> {t("Print / Save as PDF","طباعة / حفظ PDF")}
    </button>
    <p className="w-full text-xs text-muted-foreground">
     {t("Use your browser's Print dialog, then choose Save as PDF. Nothing is uploaded or added to your ledger.",
     "استخدم نافذة الطباعة واختر حفظ كملف PDF. لا يتم رفع المعلومات ولا إضافة أي حركة مالية.")}
    </p>
   </div>
   <article id="dabberna-monthly-report" dir={ar?"rtl":(lang==="fr"?frenchUI("ltr"):"ltr")}
    className="rounded-2xl border border-[#D5E2D8] bg-white p-4 text-[#253C30] shadow-sm sm:p-6">
    <header className="mb-5 border-b-2 border-[#387A5D] pb-4">
     <p className="text-xs font-semibold uppercase tracking-wide text-[#438268]">DABBERNA · {t("PRIVATE FAMILY FINANCES","المالية العائلية الخاصة")}</p>
     <h1 className="mt-1 text-2xl font-bold">{t("Monthly Money Report","التقرير المالي الشهري")}</h1>
     <p className="money-report-subtitle mt-1 text-sm">{report.month} · {t("Generated","تاريخ الإنشاء")} {report.generatedOn}</p>
     {report.sample&&<p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-bold text-amber-900">{t("DEMO / EXAMPLE FINANCES — not real family data","بيانات تجريبية — ليست المالية الحقيقية للعائلة")}</p>}
     {report.partial&&<p className="mt-2 text-xs font-semibold text-amber-900">{t("Some household information is incomplete.","بعض المعلومات المالية للعائلة غير مكتملة.")}</p>}
    </header>
    <section className="money-report-group">
     <h2 className="mb-2 text-lg font-bold">{t("1. Monthly summary","١. الملخص الشهري")}</h2>
     <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {[
       [t("Planned monthly income","الدخل الشهري المخطط"),fmt(report.plannedIncome)],
       [t("Confirmed received income","الدخل المؤكد استلامه"),fmt(report.confirmedIncome)],
       [t("Category budget","ميزانية الفئات"),fmt(report.categoryPlanTotal)],
       [t("Recorded paid expenses","المصاريف المدفوعة المسجلة"),fmt(report.actualPaidTotal)],
       [t("Budget less recorded spending","الميزانية ناقص المصاريف المسجلة"),fmt(report.variance)],
       [t("Outstanding dated obligations","الالتزامات المجدولة المتبقية"),fmt(report.outstandingDue)]
      ].map(([label,value])=><div key={label} className="rounded-lg border border-[#DCE6DF] bg-[#F6F9F5] p-2">
       <p className="money-report-subtitle text-[11px]">{label}</p><p className="mt-1 text-sm font-bold tabular-nums">{value}</p>
      </div>)}
     </div>
     <p className="money-report-subtitle mt-2 text-xs">
      {t("The budget difference is not verified savings or cash. Scheduled bills may already be inside category budgets.",
      "فرق الميزانية ليس ادخاراً مؤكداً أو نقداً متاحاً. قد تكون الفواتير المجدولة داخلة أصلاً ضمن ميزانية الفئات.")}
     </p>
    </section>
    <section className="money-report-group mt-5">
     <h2 className="mb-2 text-lg font-bold">{t("2. Income sources and receipts","٢. مصادر الدخل والمبالغ المستلمة")}</h2>
     {report.incomeRows.length===0?<p className="text-sm">{t("No income source entered.","لم تُسجل مصادر دخل.")}</p>:
      <div className="money-report-scroll overflow-x-auto"><table className="w-full text-start text-xs">
       <thead className="bg-[#EAF3EB]"><tr>
        <th className="p-2 text-start">{t("Source","المصدر")}</th><th className="p-2 text-start">{t("Frequency","التكرار")}</th>
        <th className="p-2 text-end">{t("Monthly equivalent","المعادل الشهري")}</th>
        <th className="p-2 text-start">{t("Scheduled dates / confirmed receipts","المواعيد / الاستلام المؤكد")}</th>
       </tr></thead><tbody>
        {report.incomeRows.map(i=><tr key={i.id} className="border-b border-[#E5EBE6]">
         <td className="p-2">{i.name}</td><td className="p-2">{i.frequency}</td>
         <td className="p-2 text-end tabular-nums">{number(i.monthlyEquivalent)}</td>
         <td className="p-2">{i.scheduledDates.join(", ")||"—"}
          {i.confirmedReceipts.map(r=><div key={r.date} className="mt-1 text-[#34684D]">
           {r.date}: {number(r.amount)} {r.estimated?"("+t("amount estimated","المبلغ تقديري")+")":""}
          </div>)}
         </td>
        </tr>)}
       </tbody></table></div>}
     {report.plannedIncome!==null&&<p className="money-report-subtitle mt-2 text-xs">{t("Income planning uses existing monthly equivalents; confirmed receipts are shown separately.","التخطيط للدخل مبني على المعادل الشهري الحالي، والاستلام المؤكد معروض بشكل منفصل.")}</p>}
    </section>
    <section className="mt-5">
     <h2 className="mb-2 text-lg font-bold">{t("3. Category budget versus actual","٣. ميزانية الفئات مقابل المصاريف الفعلية")}</h2>
     {report.categoryRows.length===0?<p className="text-sm">{t("No budget categories entered. Unclassified paid entries still appear in the transaction register.","لا توجد فئات ميزانية؛ تظل المصاريف غير المصنفة ظاهرة في سجل الحركات.")}</p>:
      report.categoryRows.map(c=><div key={c.id} className="money-report-group mb-3 rounded-lg border border-[#DDE7DE] p-3">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{c.name} <span className="money-report-subtitle text-xs font-normal">({c.type} · {c.priority})</span></p>
        <p className="text-sm tabular-nums">{t("Budget","مخطط")} {number(c.planned)} | {t("Paid","مدفوع")} {number(c.paid)} | {t("Difference","الفرق")} {number(c.difference)}</p>
       </div>
       <p className="money-report-subtitle text-[11px]">{t("Budget confidence","موثوقية الميزانية")}: {c.confidence}</p>
       {(c.lines.length>0||c.unitemized.length>0)&&<div className="money-report-scroll mt-2 overflow-x-auto"><table className="w-full text-xs">
        <thead className="bg-[#F0F5F0]"><tr><th className="p-1 text-start">{t("Item / classification","البند / التصنيف")}</th>
         <th className="p-1 text-end">{t("Budget","المخطط")}</th><th className="p-1 text-end">{t("Paid","المدفوع")}</th></tr></thead>
        <tbody>
         {c.lines.map((line,i)=><tr key={i} className="border-b border-[#E4ECE5]">
          <td className="p-1">{line.name} <span className="money-report-subtitle">({line.role}{line.review?" · "+t("suggested / review","مقترح / للمراجعة"):""}; {line.frequency}; {line.priority})</span></td>
          <td className="p-1 text-end tabular-nums">{number(line.planned)}</td><td className="p-1 text-end tabular-nums">{number(line.paid)}</td>
         </tr>)}
         {c.unitemized.map((line,i)=><tr key={i} className="border-b border-[#E4ECE5]">
          <td className="p-1">{t("Unitemized allowance","المبلغ غير المفصل")} <span className="money-report-subtitle">({line.kind})</span></td>
          <td className="p-1 text-end tabular-nums">{number(line.planned)}</td><td className="p-1 text-end tabular-nums">{number(line.paid)}</td>
         </tr>)}
        </tbody>
       </table></div>}
      </div>)}
    </section>
    <section className="money-report-group mt-5">
     <h2 className="mb-2 text-lg font-bold">{t("4. Spending classification","٤. تصنيف المصاريف")}</h2>
     <div className="money-report-scroll overflow-x-auto"><table className="w-full text-xs">
      <thead className="bg-[#EAF3EB]"><tr><th className="p-2 text-start">{t("Role","التصنيف")}</th><th className="p-2 text-end">{t("Planned","المخطط")}</th><th className="p-2 text-end">{t("Paid linked to items","المدفوع المرتبط ببنود")}</th></tr></thead>
      <tbody>{summary.map(s=><tr key={s.role} className="border-b"><td className="p-2">{s.role}</td>
       <td className="p-2 text-end">{number(s.planned)}</td><td className="p-2 text-end">{number(s.paid)}</td></tr>)}</tbody>
     </table></div>
     <p className="money-report-subtitle mt-1 text-xs">{t("Roles apply to classified budget lines; unassigned category allowances remain visible above. This is a different view of the same budget, not an additional cost.",
     "التصنيف للبنود المصنفة، والمبالغ غير الموزعة ظاهرة أعلاه. هذا عرض آخر لنفس الميزانية وليس تكلفة إضافية.")}</p>
    </section>
    <section className="money-report-page mt-5">
     <h2 className="mb-2 text-lg font-bold">{t("5. Itemized recorded expenses","٥. تفاصيل المصاريف المسجلة")}</h2>
     {report.paidExpenses.length===0?<p className="text-sm">{t("No paid entries recorded for this month.","لا توجد مصاريف مدفوعة مسجلة في هذا الشهر.")}</p>:
      <div className="money-report-scroll overflow-x-auto"><table className="w-full text-xs">
       <thead className="bg-[#EAF3EB]"><tr><th className="p-2 text-start">{t("Paid date","تاريخ الدفع")}</th>
        <th className="p-2 text-start">{t("Category / item","الفئة / البند")}</th>
        <th className="p-2 text-start">{t("Description / link","الوصف / المرجع")}</th>
        <th className="p-2 text-end">{t("Paid JOD","مدفوع د.أ")}</th></tr></thead>
       <tbody>{report.paidExpenses.map(e=><tr key={e.id} className="border-b border-[#E4ECE5]">
        <td className="p-2">{e.date}</td><td className="p-2">{e.category}{e.item?" · "+e.item:""}</td>
        <td className="p-2">{e.description||e.link||"—"}</td><td className="p-2 text-end tabular-nums">{number(e.amount)}</td>
       </tr>)}</tbody></table></div>}
     <p className="mt-2 text-end text-sm font-bold">{t("Total recorded paid","إجمالي المدفوع المسجل")}: {fmt(report.actualPaidTotal)}</p>
     {report.plannedExpenses.length>0&&<>
      <h3 className="mt-4 font-semibold">{t("Unconfirmed planned entries — excluded from paid spending","مصاريف مخططة غير مؤكدة — لا تدخل ضمن المدفوع")}</h3>
      {report.plannedExpenses.map(e=><p key={e.id} className="border-b p-2 text-xs">{e.date} · {e.category} · {e.description||e.item} — {fmt(e.amount)}</p>)}
     </>}
    </section>
    <section className="mt-5">
     <h2 className="mb-2 text-lg font-bold">{t("6. Bills and family commitments due this month","٦. الفواتير والالتزامات العائلية المستحقة هذا الشهر")}</h2>
     {report.dues.length===0?<p className="text-sm">{t("No dated obligations recorded for this month; this does not prove none exist.","لا توجد التزامات مسجلة بتاريخ استحقاق لهذا الشهر، ولا يعني ذلك عدم وجود التزامات أخرى.")}</p>:
      <div className="money-report-scroll overflow-x-auto"><table className="w-full text-xs">
       <thead className="bg-[#EAF3EB]"><tr>
        <th className="p-2 text-start">{t("Due / obligation","تاريخ / الالتزام")}</th>
        <th className="p-2 text-end">{t("Due","المستحق")}</th>
        <th className="p-2 text-end">{t("Paid recorded","المدفوع المسجل")}</th>
        <th className="p-2 text-end">{t("Remaining","المتبقي")}</th>
        <th className="p-2 text-start">{t("State","الحالة")}</th>
       </tr></thead><tbody>{report.dues.map(d=><tr key={d.id} className="border-b border-[#E4ECE5]">
        <td className="p-2">{d.dueDate} · {d.name} <span className="money-report-subtitle">({d.category})</span></td>
        <td className="p-2 text-end tabular-nums">{number(d.scheduled)}</td>
        <td className="p-2 text-end tabular-nums">{number(d.recordedPaid)}</td>
        <td className="p-2 text-end tabular-nums">{number(d.remaining)}</td>
        <td className="p-2">{d.state}</td>
       </tr>)}</tbody></table></div>}
     <p className="money-report-subtitle mt-2 text-xs">{t("These are dated obligations, not extra expenses added to the category budget. Related confirmed payments appear only once in the paid transaction total.",
     "هذه التزامات بتاريخ استحقاق وليست مصاريف إضافية فوق الميزانية. الدفعات المؤكدة تدخل مرة واحدة فقط ضمن إجمالي المصاريف المدفوعة.")}</p>
    </section>
    <section className="money-report-group mt-5">
     <h2 className="mb-2 text-lg font-bold">{t("7. Cash position and 30-day outlook","٧. الوضع النقدي والتوقعات لـ٣٠ يوماً")}</h2>
     <p className="text-sm">{t("Manually entered cash","النقد المدخل يدوياً")}: <strong>{fmt(report.cash.balance)}</strong>
      {" · "}{t("Last updated","آخر تحديث")}: {report.cash.balanceDate??t("Unknown","غير معروف")}
      {" · "}{t("Reserved","الاحتياطي")}: {fmt(report.cash.reserve)}</p>
     {report.cash.forecast?<div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
       {[
        [t("Expected incoming","الدخل المتوقع"),report.cash.forecast.expectedIncome],
        [t("Remaining dated bills","الفواتير المجدولة المتبقية"),report.cash.forecast.upcomingBills],
        [t("Conservative safe-to-spend","متاح للصرف بشكل تحفظي"),report.cash.forecast.safeToSpend],
        [t("Forecast end balance","الرصيد المتوقع بنهاية الفترة"),report.cash.forecast.projectedEnd]
       ].map(([label,value])=><div key={String(label)} className="rounded-lg bg-[#F5F8F5] p-2">
        <p className="money-report-subtitle text-xs">{label}</p>
        <p className="font-bold">{fmt(value as number|null)}</p>
       </div>)}
      </div>
      <p className="money-report-subtitle mt-2 text-xs">
       {t("Forecast is from the report generation date, not a reconstructed historical cash balance. Expected income can arrive late; unentered expenses are excluded.",
       "التوقعات من تاريخ إنشاء التقرير وليست إعادة بناء للرصيد النقدي التاريخي. قد يتأخر الدخل المتوقع والمصاريف غير المسجلة مستبعدة.")}
      </p>
      {report.cash.forecast.events.length>0&&<div className="money-report-scroll mt-3 overflow-x-auto"><table className="w-full text-xs">
       <thead className="bg-[#EAF3EB]"><tr><th className="p-2 text-start">{t("Date","التاريخ")}</th>
        <th className="p-2 text-start">{t("Event","الحدث")}</th><th className="p-2 text-end">{t("Expected JOD","المبلغ المتوقع")}</th></tr></thead>
       <tbody>{report.cash.forecast.events.map(e=><tr key={e.key} className="border-b">
        <td className="p-2">{e.displayDate}</td>
        <td className="p-2">{e.name} ({e.kind}{e.overdue?", "+t("overdue","متأخر"):""})</td>
        <td className="p-2 text-end">{number(e.amount)}</td></tr>)}</tbody>
      </table></div>}
      {report.cash.forecast.advice.map((line,i)=><p key={i} className="money-report-subtitle mt-1 text-xs">• {line}</p>)}
     </div>:<p className="money-report-subtitle mt-2 text-xs">{t("A forward cash forecast is shown for the current month only. Past cash balances cannot be reconstructed reliably from today's entries.",
     "تظهر التوقعات المستقبلية للشهر الحالي فقط؛ لا يمكن إعادة بناء أرصدة الأشهر السابقة من السجلات الحالية بشكل موثوق.")}</p>}
    </section>
    <footer className="mt-5 border-t border-[#CEDCD0] pt-3 text-xs">
     <p className="font-bold">{t("Report limitations and sources","ملاحظات ومصادر التقرير")}</p>
     {report.warnings.map((w,i)=><p key={i} className="money-report-subtitle mt-1">• {w}</p>)}
     <p className="money-report-subtitle mt-2">
      {t("Private read-only export using saved browser data. No bank verification, transactions or commitments are created.",
      "تقرير خاص للقراءة فقط من بيانات المتصفح المحفوظة؛ لا توجد مطابقة بنكية ولا يتم إنشاء مصاريف أو التزامات.")}
     </p>
    </footer>
   </article>
  </div>}
 </section>;
}
