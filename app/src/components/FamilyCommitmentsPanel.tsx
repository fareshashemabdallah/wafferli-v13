import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {CalendarClock,CheckCircle2,ArrowUpRight} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD,readLocal,useLocalState,writeLocal} from "@/lib/storage";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {familyFinancialCommitments,familyFinancialSummary,recordFamilyCommitmentPayment} from "@/lib/familyFinancialCommitments";
import {sampleMembers,type Member,type MoneyState} from "@/lib/money";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {canonicalPlanViews} from "@/lib/canonicalFamilyFacts";

export function FamilyCommitmentsPanel({money,compact=false,withinBills=false}:{money:MoneyState;compact?:boolean;withinBills?:boolean}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [plans,,ready]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const [events]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const projectedPlans=canonicalPlanViews(plans,events,members,ar);
 const [confirmId,setConfirmId]=useState<string|null>(null);
 const [paidAmount,setPaidAmount]=useState("");
 const [categoryId,setCategoryId]=useState("");
 const [message,setMessage]=useState("");
 if(!ready)return null;
 const entries=familyFinancialCommitments(projectedPlans,money).filter(item=>!withinBills||(!item.paid&&item.certainty!=="idea"));
 if(!entries.length)return null;
 const totals=familyFinancialSummary(projectedPlans,money);
 const amountOk=paidAmount.trim()!==""&&Number.isFinite(Number(paidAmount))&&Number(paidAmount)>0&&
  Number(paidAmount)<=100000&&Math.abs(Number(paidAmount)*100-Math.round(Number(paidAmount)*100))<0.00001;
 const record=(entry:typeof entries[number])=>{
  const latest=readLocal<MoneyState>("money",money);
  const updated=recordFamilyCommitmentPayment(latest,entry,Number(paidAmount),categoryId);
  if(!updated){
   setMessage(t("Check the amount and payment status. Nothing was recorded.",
    "راجع المبلغ والفئة وحالة الدفع. لم يتم تسجيل شيء."));return;
  }
  if(!writeLocal("money",updated)){
   setMessage(t("Unable to save your payment on this device.","تعذّر حفظ المصروف على هذا الجهاز."));return;
  }
  setConfirmId(null);setMessage(t(
   "Paid expense recorded once. Your bank cash balance has not been changed.",
   "تم تسجيل المصروف المدفوع مرة واحدة. لم يتغيّر رصيدك النقدي."));
 };
 return <section aria-label={withinBills?t("Family commitments from calendar","التزامات المناسبات من التقويم"):t("Upcoming family commitments","الالتزامات العائلية القادمة")}
  className={withinBills?"mt-3 border-t border-[#E7DFE5] pt-4":"editorial-card rounded-[1.5rem] border border-[#E5DAE6] bg-[#FFFDFE] p-4 sm:p-5"}>
  <div className="flex items-start gap-3">
   <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FBEAF3] text-[#B45B85]">
    <CalendarClock className="size-5"/></span>
   <div className="flex-1">
    <h2 className="text-base font-bold text-[#27364C]">{withinBills?t("From Family Life · automatically added","من حياة العيلة · تُضاف تلقائياً"):t("Upcoming family commitments","التزامات العيلة القادمة")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(
     "Linked to family calendar costs. Ideas are not scheduled bills, and even confirmed commitments are not paid expenses or savings goals.",
     "مرتبطة بتكاليف تقويم العيلة. الأفكار ليست فواتير مجدولة والالتزامات المؤكدة ليست مصاريف مدفوعة أو أهداف ادخار.")}</p>
   </div>
  </div>
  <div className="mt-3 grid grid-cols-2 gap-2">
   <div className="rounded-xl bg-[#F4EEF6] p-3">
    <p className="text-xs text-[#74667B]">{t("Remaining planned costs","التكاليف المخططة المتبقية")}</p>
    <strong className="mt-1 block text-lg tabular-nums">{fmtJOD(totals.upcomingTotalJod)}</strong>
   </div>
   <div className="rounded-xl bg-[#EEF8F3] p-3">
    <p className="text-xs text-[#62796E]">{t("Suggested monthly preparation","التخصيص الشهري المقترح")}</p>
    <strong className="mt-1 block text-lg tabular-nums">{fmtJOD(totals.monthlyPreparationJod)}</strong>
   </div>
  </div>
  {totals.nextDeadline&&<p className="mt-2 text-xs text-[#647184]">
   {t("Next expected payment: ","أقرب موعد دفع متوقع: ")}<strong>{totals.nextDeadline}</strong>
  </p>}
  <p className="mt-2 text-[11px] leading-relaxed text-[#748092]">{t(
   "Monthly preparation is a planning suggestion, not money actually set aside. Planned costs enter the cash-flow outlook once, and leave it when a payment is recorded.",
   "المبلغ الشهري اقتراح للتخطيط وليس مالاً تم توفيره. تدخل الالتزامات ضمن التوقعات المالية مرة واحدة وتُزال عند تسجيل الدفع.")}</p>
  {totals.possibleIdeasJod>0&&<p className="mt-2 text-xs text-[#76697D]">{t("Ideas not scheduled: ","أفكار غير مجدولة: ")}{fmtJOD(totals.possibleIdeasJod)}</p>}
  <div className="mt-3 divide-y divide-[#F1E8EE]">
   {(compact?entries.slice(0,4):entries).map(item=><div key={item.id} className="py-3">
    <div className="flex flex-wrap justify-between gap-2">
     <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{item.planTitle} · {item.kind==="gift"?t("Gift","الهدية"):item.kind==="celebration"?t("Celebration","الاحتفال"):t("Extras","مصاريف أخرى")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{item.label} · {item.dueDate}</p>
     </div>
     <div className="shrink-0 text-end">
      <strong className="text-sm tabular-nums">{fmtJOD(item.paid?(item.actualPaidJod??0):item.amountJod)}</strong>
      <p className={"mt-1 text-xs font-semibold "+(item.paid?"text-[#36866F]":"text-[#906379]")}>
       {item.paid?t("Paid","مدفوع"):item.certainty==="idea"?t("Idea, not due","فكرة، ليست مستحقة"):item.certainty==="firm"?t("Confirmed obligation","التزام مؤكد"):t("Planned estimate","تقدير مخطط")}</p>
     </div>
    </div>
    {item.paid?<p className="mt-2 inline-flex items-center gap-1 text-xs text-[#337C61]"><CheckCircle2 className="size-4"/>
     {t("Actual payment is in your expense history.","المبلغ المدفوع مسجّل في المصاريف.")}</p>
    :money.demo?<p className="mt-2 text-xs text-muted-foreground">{t(
      "Replace sample finances with your actual plan to record payments.","استبدل المالية التجريبية بخطتك الفعلية لتسجيل الدفع.")}</p>
    :<div className="mt-2">
      {confirmId===item.id?<div className="space-y-3 rounded-xl border border-[#E4D9E1] bg-[#FFF7FA] p-3">
       <p className="text-xs font-bold">{t("Confirm you actually paid for this item","أكد أنك دفعت قيمة هذا البند فعلياً")}</p>
       <label className="block text-xs font-semibold">{t("Actual amount paid (JOD)","المبلغ المدفوع فعلياً (د.أ)")}
        <input className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 text-base" type="number" min="0.01" max="100000" step="0.01"
         value={paidAmount} onChange={e=>setPaidAmount(e.target.value)} inputMode="decimal"/></label>
       <label className="block text-xs font-semibold">{t("Expense category","فئة المصروف")}
        <select className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 text-sm"
         value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
         <option value="">{t("Uncategorized for now","غير مصنف الآن")}</option>
         {money.categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select></label>
       <p className="text-[11px] text-[#6C7483]">{t(
        "This creates one paid expense. It does not automatically deduct your manually entered cash or adjust savings.",
        "سيُسجّل مصروف مدفوع واحد، دون خصم الرصيد المدخل أو تعديل هدف الادخار.")}</p>
       <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!amountOk} onClick={()=>record(item)}
         className="min-h-11 rounded-xl bg-[#B25A85] px-4 text-xs font-bold text-white disabled:opacity-50">
         {t("Confirm paid expense","تأكيد المصروف المدفوع")}</button>
        <button type="button" onClick={()=>setConfirmId(null)} className="min-h-11 rounded-xl border px-3 text-xs font-semibold">
         {t("Cancel","إلغاء")}</button>
       </div>
      </div>:<button type="button" onClick={()=>{
       setConfirmId(item.id);setPaidAmount(String(item.amountJod));setCategoryId("");setMessage("");
      }} className="min-h-10 rounded-xl border border-[#ECD4E2] bg-white px-3 text-xs font-semibold text-[#A34C77]">
       {t("I paid this","دفعت هذا المبلغ")}
      </button>}
     </div>}
   </div>)}
  </div>
  {compact&&entries.length>4&&<p className="mt-2 text-xs text-muted-foreground">{t(
   "More family commitments are included in the totals above.","التزامات أخرى مشمولة بالمجموع أعلاه.")}</p>}
  {message&&<p role="status" className="mt-2 text-xs font-semibold text-[#516E64]">{message}</p>}
  <Link to="/family" className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#9B4A76] underline">
   {t("Review occasions in Family Life","راجع المناسبات في حياة العيلة")}<ArrowUpRight className="size-4"/>
  </Link>
  <p className="mt-1 text-[11px] text-muted-foreground">{t(
   "Edits or deletions to a saved family occasion automatically update its remaining planned commitments. Already paid expenses remain in Money.",
   "تعديل المناسبة أو حذفها يحدّث الالتزامات المستقبلية تلقائياً. المصاريف المدفوعة تبقى محفوظة في المالية.")}</p>
 </section>;
}
